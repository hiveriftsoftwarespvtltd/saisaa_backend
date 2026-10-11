import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { RESPONSE_MESSAGE_METADATA } from '../constants/response.constants';

/**
 * Global Response Interceptor
 * Standardizes all outgoing controller responses into a unified structure:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "...",
 *   data: { ... },
 *   timestamp: "...",
 *   path: "/api/..."
 * }
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const request = httpContext.getRequest();
    const statusCode = response.statusCode;

    // Retrieve custom message set via @ResponseMessage decorator, if any
    const customMessage =
      this.reflector.get<string>(
        RESPONSE_MESSAGE_METADATA,
        context.getHandler(),
      ) ||
      this.reflector.get<string>(
        RESPONSE_MESSAGE_METADATA,
        context.getClass(),
      );

    const defaultMessage =
      statusCode >= 200 && statusCode < 300
        ? 'Request executed successfully'
        : 'Operation completed';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        message: customMessage || defaultMessage,
        data: data !== undefined ? data : null,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
