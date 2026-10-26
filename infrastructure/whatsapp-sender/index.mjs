import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);
const secrets = new SecretsManagerClient({});
export async function handler(event) {
  if (!event.request?.code) throw new Error('Missing encrypted authentication code');
  const keyring = new KmsKeyringNode({ generatorKeyId: process.env.KMS_KEY_ARN });
  const { plaintext } = await decrypt(keyring, Buffer.from(event.request.code, 'base64'));
  const code = Buffer.from(plaintext).toString('utf8');
  const secret = await secrets.send(
    new GetSecretValueCommand({ SecretId: process.env.META_SECRET_ARN }),
  );
  const { accessToken, phoneNumberId } = JSON.parse(secret.SecretString);
  const result = await fetch(
    `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: event.request.userAttributes.phone_number.replace('+', ''),
        type: 'template',
        template: {
          name: process.env.META_TEMPLATE_NAME,
          language: { code: 'pt_BR' },
          components: [
            { type: 'body', parameters: [{ type: 'text', text: code }] },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      }),
    },
  );
  // Never log Meta responses: templates may contain authentication codes.
  if (!result.ok) throw new Error(`WhatsApp delivery failed: HTTP ${result.status}`);
  return event;
}
