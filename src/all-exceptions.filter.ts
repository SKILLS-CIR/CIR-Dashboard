import { Catch, ArgumentsHost, HttpStatus, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { LoggerService } from "./logger/logger.service";
import e, { Request, Response } from 'express';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

type Responseobj = {
    statusCode: number;
    timestamp: string;
    path: string;
    response: string | object;
}
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
    private readonly logger = new LoggerService(AllExceptionsFilter.name);
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();


        const responseObj: Responseobj = {
            statusCode: 500,
            timestamp: new Date().toISOString(),
            path: request.url,
            response: '',
        }
        if (exception instanceof HttpException) {
            responseObj.statusCode = exception.getStatus();
            const res = exception.getResponse();
        } else if (exception instanceof PrismaClientValidationError) {
            responseObj.statusCode = 422
            responseObj.response = exception.message.replaceAll(/\n/g, ' ');
        }
        else {
            responseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            responseObj.response = 'Internal Server Error';
        }
        //for adding more custom exceptions
        response.status(responseObj.statusCode)
            .json(responseObj)
        this.logger.error(responseObj.response, AllExceptionsFilter.name);
        // super.catch(exception, host); // Cannot call super if response is already sent

    }
}