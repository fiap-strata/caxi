import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('api/health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(TypeOrmHealthIndicator) private readonly db: TypeOrmHealthIndicator,
  ) {}

  // Processo vivo, sem dependências: health check do container.
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  // Pronto para tráfego: banco acessível. Health check do ALB/nginx.
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.db.pingCheck('database', { timeout: 1500 })]);
  }
}
