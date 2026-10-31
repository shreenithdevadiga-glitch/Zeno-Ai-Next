export class AppError extends Error {
    constructor(code, message, status = 500, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.status = status;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, details = null) {
        super('VALIDATION_ERROR', message, 400, details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required', details = null) {
        super('AUTHENTICATION_ERROR', message, 401, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden to requested resource', details = null) {
        super('FORBIDDEN_ERROR', message, 403, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details = null) {
        super('NOT_FOUND_ERROR', message, 404, details);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict', details = null) {
        super('CONFLICT_ERROR', message, 409, details);
    }
}

export class RateLimitedError extends AppError {
    constructor(message = 'Rate limit exceeded. Please throttle requests.', details = null) {
        super('RATE_LIMITED_ERROR', message, 429, details);
    }
}

export class ProviderError extends AppError {
    constructor(message = 'Upstream AI provider error', details = null) {
        super('PROVIDER_ERROR', message, 502, details);
    }
}

export class TimeoutError extends AppError {
    constructor(message = 'Operation timed out', details = null) {
        super('TIMEOUT_ERROR', message, 504, details);
    }
}

export class SandboxError extends AppError {
    constructor(message = 'Code execution failed or violated sandbox rules', details = null) {
        super('SANDBOX_ERROR', message, 422, details);
    }
}

export function errorHandler(err, req, res, next) {
    const requestId = req.requestId || req.headers['x-request-id'] || 'req_' + Math.random().toString(36).slice(2, 9);
    const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
    const code = err.code || (status === 400 ? 'VALIDATION_ERROR' : status === 401 ? 'AUTHENTICATION_ERROR' : status === 403 ? 'FORBIDDEN_ERROR' : status === 404 ? 'NOT_FOUND_ERROR' : status === 429 ? 'RATE_LIMITED_ERROR' : 'INTERNAL_ERROR');

    const isProduction = process.env.NODE_ENV === 'production';

    // Structured logging of error
    const errorPayload = {
        code,
        message: err.message || 'An unexpected internal error occurred',
        details: err.details || null,
        requestId
    };

    if (!isProduction && err.stack) {
        errorPayload.stack = err.stack;
    }

    // Do not leak stack traces to client in production
    res.status(status).json({
        error: errorPayload
    });
}
