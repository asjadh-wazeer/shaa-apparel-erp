import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiErrorResponse } from '../interfaces';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${errorResponse.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${errorResponse.statusCode}: ${errorResponse.message}`,
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ApiErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        return {
          success: false,
          statusCode: status,
          message: Array.isArray(resp.message)
            ? 'Validation failed'
            : (resp.message as string) ?? exception.message,
          errors: Array.isArray(resp.message)
            ? [{ field: 'general', messages: resp.message as string[] }]
            : undefined,
          timestamp,
          path,
        };
      }

      return {
        success: false,
        statusCode: status,
        message: exception.message,
        timestamp,
        path,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path);
    }

    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp,
      path,
    };
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
  ): ApiErrorResponse {
    switch (error.code) {
      case 'P2002':
        return {
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with this value already exists',
          timestamp,
          path,
        };
      case 'P2025':
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          timestamp,
          path,
        };
      case 'P2003':
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          timestamp,
          path,
        };
      default:
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
          timestamp,
          path,
        };
    }
  }
}
