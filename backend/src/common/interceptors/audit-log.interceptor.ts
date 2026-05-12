import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Request } from 'express';
import { JwtPayload } from '../interfaces';
import { QUEUE_NAMES } from '../constants';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectQueue(QUEUE_NAMES.AUDIT_LOG) private readonly auditQueue: Queue,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const { method, url, user, ip } = request;

    const auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!auditableMethods.includes(method) || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void this.auditQueue.add('log', {
          userId: user.sub,
          tenantId: user.tenantId,
          method,
          url,
          ipAddress: ip,
          timestamp: new Date().toISOString(),
        });
      }),
    );
  }
}
