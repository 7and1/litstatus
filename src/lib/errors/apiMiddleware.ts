import { NextResponse } from "next/server";
import { logError, createAppError } from "./";

export type ApiHandler = (
  request: Request,
  context?: { params: Record<string, string> },
) => Promise<NextResponse>;

export interface ErrorHandlerOptions {
  errorMessage?: string;
  logContext?: Record<string, unknown>;
}

export function withApiHandler(
  handler: ApiHandler,
  options: ErrorHandlerOptions = {},
): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));
      
      logError(appError, {
        ...options.logContext,
        path: new URL(request.url).pathname,
        method: request.method,
      });

      const statusCode = (error as { statusCode?: number })?.statusCode || 500;
      const message = options.errorMessage || "An error occurred. Please try again.";

      return NextResponse.json(
        { error: message },
        { status: statusCode },
      );
    }
  };
}

export function createApiResponse<T>(
  data: T,
  status: number = 200,
  headers: HeadersInit = {},
): NextResponse<T> {
  return NextResponse.json(data, { status, headers });
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  code: string = "API_ERROR",
): NextResponse<{ error: string; code?: string }> {
  return NextResponse.json(
    { error: message, code },
    { status },
  );
}
