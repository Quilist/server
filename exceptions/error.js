module.exports = class ApiError extends Error {
    status;
    error;

    constructor(status, message, error) {
        super(message)
        this.status = status;
        this.error = error;
    }

    static unathorizedError() {
        return new ApiError(401, "Action not allowed");
    }

    static badRequest(message) {
        return new ApiError(400, message)
    }
}