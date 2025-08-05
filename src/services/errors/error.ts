export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly name: string = "AppError",
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown,
    public readonly context?: Record<string, unknown>,
    public readonly timestamp: Date = new Date()
  ) {
    super(message);

    if (originalError instanceof Error) {
      this.stack = originalError.stack;
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
      timestamp: this.timestamp.toISOString(),
      ...(process.env.NODE_ENV !== "production" && {
        stack: this.stack,
        originalError: this.originalError,
      }),
    };
  }

  public static fromUnknown(
    error: unknown,
    context?: Record<string, unknown>
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        error.name || "UnknownError",
        500,
        error,
        context
      );
    }

    return new AppError(
      "Ocorreu um erro desconhecido",
      "UnknownError",
      500,
      error,
      context
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly validationErrors: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, "ValidationError", 400, undefined, context);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(
    resourceName: string,
    resourceId?: string | number,
    context?: Record<string, unknown>
  ) {
    super(
      resourceId
        ? `${resourceName} com ID ${resourceId} não encontrado`
        : `${resourceName} não encontrado`,
      "NotFoundError",
      404,
      undefined,
      context
    );
  }
}

export class RepositoryError extends AppError {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly parameters?: unknown[],
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, "RepositoryError", 500, originalError, context);
  }
}

export class AuthError extends AppError {
  constructor(
    message: string,
    public readonly authType?: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, "AuthError", 401, originalError, context);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string,
    public readonly conflictField?: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, "ConflictError", 409, originalError, context);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string,
    public readonly details?: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, "BadRequestError", 400, originalError, context);
  }
}
export class ErrorHandler {
  public static normalize(
    error: unknown,
    context?: Record<string, unknown>
  ): AppError {
    return AppError.fromUnknown(error, context);
  }

  public static log(error: AppError, logger: Console = console): void {
    const logData = {
      ...error.toJSON(),
      env: process.env.NODE_ENV,
      app: process.env.APP_NAME,
    };

    if (error.statusCode >= 500) {
      logger.error("Server Error:", logData);
    } else if (error.statusCode >= 400) {
      logger.warn("Client Error:", logData);
    } else {
      logger.info("App Error:", logData);
    }
  }

  public static toHttpResponse(
    error: AppError,
    includeDetails = false
  ): {
    statusCode: number;
    body: Record<string, unknown>;
  } {
    const isProduction = process.env.NODE_ENV === "production";
    const response = error.toJSON();

    if (isProduction && !includeDetails) {
      delete response.stack;
      delete response.originalError;
      if (
        response.context &&
        typeof response.context === "object" &&
        response.context !== null &&
        "sensitiveData" in response.context
      ) {
        delete (response.context as Record<string, unknown>).sensitiveData;
      }
    }

    return {
      statusCode: error.statusCode,
      body: response,
    };
  }

  public static is<T extends AppError>(
    error: unknown,
    errorType: new (...args: unknown[]) => T
  ): error is T {
    return error instanceof errorType;
  }
}

export type AppErrorType =
  | AppError
  | ValidationError
  | NotFoundError
  | RepositoryError
  | AuthError
  | ConflictError
  | BadRequestError;

export type ErrorResponse = {
  statusCode: number;
  body: {
    name: string;
    message: string;
    statusCode: number;
    timestamp?: string;
    [key: string]: unknown;
  };
};
