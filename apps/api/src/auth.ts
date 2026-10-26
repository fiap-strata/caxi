import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { normalizePhone } from '@caxi/domain';
import { Store } from './store';
export type Interest = {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved';
  createdAt: string;
};
type Challenge = {
  id: string;
  phone: string;
  expires: number;
  attempts: number;
  sentAt: number;
  session?: string;
};
type Session = {
  ownerId: string;
  csrf: string;
  expires: number;
  refreshToken?: string;
  accessToken?: string;
  accessExpires?: number;
};
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, 429);
  }
}
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
@Injectable()
export class AuthService {
  constructor(@Inject(Store) private readonly store: Store) {}
  get demo() {
    return process.env.AUTH_PROVIDER !== 'cognito';
  }
  private client() {
    return new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
  }
  async interest(name: string, raw: string) {
    return this.store.exclusive('interest-input:' + String(raw).replace(/\D/g, ''), () =>
      this.interestUnlocked(name, raw),
    );
  }
  private async interestUnlocked(name: string, raw: string) {
    let phone: string;
    try {
      phone = normalizePhone(raw);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    if (typeof name !== 'string' || !name.trim() || name.length > 100)
      throw new BadRequestException('Informe seu nome (até 100 caracteres).');
    const old = await this.store.get<Interest>('interest:' + phone);
    if (old) return { id: old.id, status: old.status };
    const value: Interest = {
      id: randomUUID(),
      name: name.trim(),
      phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await this.store.put('interest', 'interest:' + phone, value);
    await this.store.event('interest_registered', value.id);
    return { id: value.id, status: value.status };
  }
  async approve(id: string) {
    const value = (await this.store.list<Interest>('interest')).find((x) => x.id === id);
    if (!value) throw new BadRequestException('Interesse não encontrado.');
    if (value.status === 'approved') return { status: value.status };
    if (!this.demo)
      await this.client().send(
        new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: value.phone,
          UserAttributes: [
            { Name: 'phone_number', Value: value.phone },
            { Name: 'phone_number_verified', Value: 'true' },
          ],
          MessageAction: 'SUPPRESS',
        }),
      );
    value.status = 'approved';
    await this.store.put('interest', 'interest:' + value.phone, value);
    await this.store.event('access_approved', value.id);
    return { status: 'approved' };
  }
  async request(raw: string) {
    return this.store.exclusive('request:' + String(raw).replace(/\D/g, ''), () =>
      this.requestUnlocked(raw),
    );
  }
  private async requestUnlocked(raw: string) {
    let phone: string;
    try {
      phone = normalizePhone(raw);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const interest = await this.store.get<Interest>('interest:' + phone);
    if (interest?.status !== 'approved')
      throw new ForbiddenException('Aguarde a equipe liberar seu acesso.');
    const key = 'challenge:' + phone,
      old = await this.store.get<Challenge>(key);
    if (old && Date.now() - old.sentAt < 30000)
      throw new TooManyRequestsException('Aguarde 30 segundos para solicitar outro código.');
    const challenge: Challenge = {
      id: randomUUID(),
      phone,
      expires: Date.now() + 180000,
      attempts: 0,
      sentAt: Date.now(),
    };
    if (!this.demo) {
      const result = await this.client().send(
        new InitiateAuthCommand({
          ClientId: process.env.COGNITO_CLIENT_ID,
          AuthFlow: 'USER_AUTH',
          AuthParameters: { USERNAME: phone, PREFERRED_CHALLENGE: 'SMS_OTP' },
        }),
      );
      if (result.ChallengeName !== 'SMS_OTP' || !result.Session)
        throw new BadRequestException(
          'O pool Cognito não retornou SMS_OTP. Confira sua configuração.',
        );
      challenge.session = result.Session;
    }
    await this.store.put('challenge', key, challenge);
    return {
      challengeId: challenge.id,
      expiresIn: 180,
      ...(this.demo ? { demoCode: '123456' } : {}),
    };
  }
  async verify(id: string, code: string) {
    return this.store.exclusive('verify:' + String(id), () => this.verifyUnlocked(id, code));
  }
  private async verifyUnlocked(id: string, code: string) {
    if (typeof id !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code))
      throw new BadRequestException('Informe o código de seis dígitos.');
    const challenge = (await this.store.list<Challenge>('challenge')).find((x) => x.id === id);
    if (!challenge || challenge.expires < Date.now())
      throw new UnauthorizedException('O código venceu. Peça outro código.');
    if (challenge.attempts >= 5)
      throw new TooManyRequestsException(
        'Limite de tentativas atingido. Solicite outro código após o intervalo.',
      );
    challenge.attempts++;
    await this.store.put('challenge', 'challenge:' + challenge.phone, challenge);
    let ownerId: string | undefined,
      refreshToken: string | undefined,
      accessToken: string | undefined,
      accessExpires: number | undefined;
    if (this.demo) {
      if (!safeEqual(code || '', '123456'))
        throw new UnauthorizedException('Código incorreto. Confira e tente novamente.');
    } else {
      try {
        const result = await this.client().send(
          new RespondToAuthChallengeCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            ChallengeName: 'SMS_OTP',
            Session: challenge.session,
            ChallengeResponses: { USERNAME: challenge.phone, SMS_OTP_CODE: code },
          }),
        );
        const auth = result.AuthenticationResult;
        if (!auth?.AccessToken) throw new Error();
        const verifier = CognitoJwtVerifier.create({
          userPoolId: process.env.COGNITO_USER_POOL_ID!,
          tokenUse: 'access',
          clientId: process.env.COGNITO_CLIENT_ID!,
        });
        const claims = await verifier.verify(auth.AccessToken);
        ownerId = claims.sub;
        refreshToken = auth.RefreshToken;
        accessToken = auth.AccessToken;
        accessExpires = Date.now() + (auth.ExpiresIn || 3600) * 1000;
      } catch {
        throw new UnauthorizedException(
          'Código inválido ou expirado. Solicite outro e tente novamente.',
        );
      }
    }
    const interest = await this.store.get<Interest>('interest:' + challenge.phone);
    if (!interest || interest.status !== 'approved') throw new UnauthorizedException();
    ownerId = ownerId || interest.id;
    await this.store.remove('challenge:' + challenge.phone);
    const token = randomBytes(32).toString('hex'),
      csrf = randomBytes(24).toString('hex');
    const session: Session = {
      ownerId,
      csrf,
      expires: Date.now() + Number(process.env.SESSION_DAYS || 7) * 86400000,
      refreshToken,
      accessToken,
      accessExpires,
    };
    await this.store.put('session', 'session:' + hash(token), session);
    await this.store.put('owner', 'owner:' + ownerId, {
      id: ownerId,
      name: interest.name,
      phone: interest.phone,
    });
    await this.store.event('first_access', ownerId);
    return { token, csrf, ownerId };
  }
  async session(token?: string) {
    if (!token) throw new UnauthorizedException('Entre para continuar.');
    const session = await this.store.get<Session>('session:' + hash(token));
    if (!session || session.expires < Date.now())
      throw new UnauthorizedException('Entre de novo para continuar.');
    if (!this.demo && (!session.accessExpires || session.accessExpires < Date.now())) {
      if (!session.refreshToken) throw new UnauthorizedException('Entre novamente.');
      try {
        const result = await this.client().send(
          new InitiateAuthCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: { REFRESH_TOKEN: session.refreshToken },
          }),
        );
        if (!result.AuthenticationResult?.AccessToken) throw new Error();
        session.accessToken = result.AuthenticationResult.AccessToken;
        session.accessExpires = Date.now() + (result.AuthenticationResult.ExpiresIn || 3600) * 1000;
        await this.store.put('session', 'session:' + hash(token), session);
      } catch {
        throw new UnauthorizedException('Não foi possível renovar sua sessão. Entre novamente.');
      }
    }
    return session;
  }
  async logout(token: string) {
    if (token) await this.store.remove('session:' + hash(token));
  }
}
