import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class ViewerReadOnlyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== 'viewer') {
      return next.handle();
    }
    const method = String(req.method || '').toUpperCase();
    if (!WRITE_METHODS.has(method)) {
      return next.handle();
    }
    const path = String(req.path || req.url || '');
    if (
      method === 'POST' &&
      (path.includes('/disease-management/predict') ||
        path.includes('/disease-management/analyze-fruit') ||
        path.includes('/disease-management/analyze-gallery'))
    ) {
      return next.handle();
    }
    throw new ForbiddenException('This inspector login can view the farm but cannot change records.');
  }
}
