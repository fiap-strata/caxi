import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Req,
  Res,
  Inject,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AuthService, safeEqual, Interest } from './auth';
import { StallsService, ProductsService } from './products';
import { Store } from './store';
import { MAX_PHOTO_BYTES, PhotosService } from './photos';
const objectBody = { schema: { type: 'object' as const, additionalProperties: true } };
@ApiTags('Caxi')
@Controller('api')
export class AppController {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(StallsService) private stalls: StallsService,
    @Inject(ProductsService) private products: ProductsService,
    @Inject(Store) private store: Store,
    @Inject(PhotosService) private photos: PhotosService,
  ) {}
  private async user(req: Request) {
    const session = await this.auth.session(req.cookies?.caxi_session);
    if (
      !['GET', 'HEAD'].includes(req.method) &&
      !safeEqual(String(req.headers['x-csrf-token'] || ''), session.csrf)
    )
      throw new ForbiddenException('Sessão de formulário inválida. Atualize a página.');
    return session.ownerId;
  }
  private admin(req: Request) {
    if (
      !process.env.ADMIN_KEY ||
      !safeEqual(String(req.headers['x-admin-key'] || ''), process.env.ADMIN_KEY)
    )
      throw new UnauthorizedException('Chave administrativa inválida.');
  }
  @Get('health') health() {
    return { status: 'ok' };
  }
  @Get('config') config() {
    return { demo: this.auth.demo };
  }
  @Post('interests')
  @ApiOperation({ summary: 'Registra interesse idempotente por telefone' })
  @ApiBody(objectBody)
  interest(@Body() b: any) {
    return this.auth.interest(b.name, b.phone || '');
  }
  @Get('admin/interests') async interests(@Req() req: Request) {
    this.admin(req);
    return this.store.list<Interest>('interest');
  }
  @Post('admin/interests/:id/approve') async approve(@Req() req: Request, @Param('id') id: string) {
    this.admin(req);
    return this.auth.approve(id);
  }
  @Post('demo/interests/:id/approve') async demoApprove(@Param('id') id: string) {
    if (!this.auth.demo) throw new ForbiddenException();
    return this.auth.approve(id);
  }
  @Post('auth/code') @ApiBody(objectBody) code(@Body() b: any) {
    return this.auth.request(b.phone || '');
  }
  @Post('auth/verify') @ApiBody(objectBody) async verify(
    @Body() b: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.verify(b.challengeId, b.code);
    res.cookie('caxi_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(process.env.SESSION_DAYS || 7) * 86400000,
    });
    return { csrf: result.csrf };
  }
  @Get('auth/session') async session(@Req() req: Request) {
    const session = await this.auth.session(req.cookies?.caxi_session);
    return { csrf: session.csrf, owner: await this.store.get('owner:' + session.ownerId) };
  }
  @Post('auth/refresh') async refresh(@Req() req: Request) {
    await this.user(req);
    return { ok: true };
  }
  @Post('auth/logout') async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.user(req);
    await this.auth.logout(req.cookies?.caxi_session);
    res.clearCookie('caxi_session', { path: '/' });
    return { ok: true };
  }
  @Get('onboarding') async onboarding(@Req() req: Request) {
    const id = await this.user(req);
    return { stall: await this.stalls.mine(id), products: await this.products.list(id) };
  }
  @Put('stalls/mine') @ApiBody(objectBody) async stall(@Req() req: Request, @Body() b: any) {
    return this.stalls.save(await this.user(req), b);
  }
  @Get('products') async listProducts(@Req() req: Request) {
    return this.products.list(await this.user(req));
  }
  @Post('products') @ApiBody(objectBody) async addProduct(@Req() req: Request, @Body() b: any) {
    return this.products.save(await this.user(req), b);
  }
  @Patch('products/:id') @ApiBody(objectBody) async updateProduct(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() b: any,
  ) {
    return this.products.save(await this.user(req), b, id);
  }
  @Post('stalls/mine/publish') async publish(@Req() req: Request) {
    return this.products.publish(await this.user(req));
  }
  @Get('catalog/:id') catalog(@Param('id') id: string) {
    return this.products.catalog(id);
  }
  @Post('events/shared') async shared(@Req() req: Request) {
    await this.store.event('catalog_shared', await this.user(req));
    return { ok: true };
  }
  @Get('admin/funnel') async funnel(@Req() req: Request) {
    this.admin(req);
    const events = await this.store.list<{ type: string; ownerId?: string; test: boolean }>(
      'event',
    );
    return [
      'interest_registered',
      'access_approved',
      'first_access',
      'stall_saved',
      'product_saved',
      'catalog_published',
      'catalog_shared',
    ].map((type) => ({
      type,
      testUsers: new Set(events.filter((e) => e.type === type && e.test).map((e) => e.ownerId))
        .size,
      realUsers: new Set(events.filter((e) => e.type === type && !e.test).map((e) => e.ownerId))
        .size,
    }));
  }
  @Post('uploads')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  async upload(@Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
    return this.photos.upload(await this.user(req), file);
  }
}
