export class ApiError extends Error {
    constructor(statusCode, message, details){
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message, details) {
        return new ApiError(401, message, details);
    }

    static forbidden(message, details) {
        return new ApiError(403, message, details);
    }

    static notFound(message, details) {
        return new ApiError(404, message, details);
    }

    static conflict(message, details) {
        return new ApiError(409, message, details);
    }
}