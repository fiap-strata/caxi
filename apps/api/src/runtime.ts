export function academicDemo() {
  return (
    process.env.CAXI_DEMO_MODE === 'true' &&
    process.env.AUTH_PROVIDER === 'demo' &&
    process.env.DATABASE_DRIVER === 'sqljs'
  );
}

export function assertProductionConfiguration() {
  if (process.env.NODE_ENV !== 'production' || academicDemo()) return;
  if (
    process.env.AUTH_PROVIDER !== 'cognito' ||
    !process.env.ADMIN_KEY ||
    process.env.ADMIN_KEY.length < 32 ||
    !process.env.COGNITO_CLIENT_ID ||
    !process.env.COGNITO_USER_POOL_ID ||
    !process.env.APP_ORIGIN?.startsWith('https://')
  )
    throw new Error('Configuração de produção incompleta. Consulte README.');
}

export function applicationOrigins() {
  const origins = new Set([process.env.APP_ORIGIN || 'http://127.0.0.1:5173']);
  if (academicDemo()) {
    for (const host of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL])
      if (host) origins.add(new URL('https://' + host).origin);
  }
  return origins;
}
