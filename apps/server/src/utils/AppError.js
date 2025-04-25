class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent constructor (Error)

        this.statusCode = statusCode;
        // Determine status based on statusCode (4xx = fail, 5xx = error)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // Mark as an operational error (trusted error, not a programming bug)
        this.isOperational = true;

        // Capture the stack trace, excluding the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError; 