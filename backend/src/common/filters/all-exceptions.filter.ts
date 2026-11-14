import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Filtro global de excepciones para normalizar las respuestas de error de la API.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) ?? exception.message;
        error = (resObj.error as string) ?? exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as {
        number?: number;
        message?: string;
      };

      // Códigos de SQL Server para violación de restricción UNIQUE / PRIMARY KEY
      if (driverError?.number === 2627 || driverError?.number === 2601) {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'Ya existe un registro con ese identificador único.';
      } else if (driverError?.number === 547) {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message =
          'Operación rechazada por restricción de integridad o regla de base de datos.';
      } else {
        this.logger.error(
          `Database error on ${request.method} ${request.url}: ${exception.message}`,
          exception.stack,
        );
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
