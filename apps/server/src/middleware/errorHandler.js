const AppError = require('../utils/AppError');
const environment = require('../config/environment'); // To check NODE_ENV

// --- Specific Error Handlers ---

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400); // Bad Request
};

const handleDuplicateFieldsDB = (err) => {
    // Extract value from the error message (may need adjustment based on DB/driver)
    const value = err.errmsg?.match(/(?<=").*?(?=")/)?.[0] || 'unknown'; 
    const message = `Duplicate field value: [${value}]. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// --- JWT Error Handlers (Keep for reference, but Firebase errors are handled in authMiddleware) ---
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401); // Unauthorized
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// --- Response Formatting ---

const sendErrorDev = (err, res) => {
    console.error('ERROR 💥', err);
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    // B) Programming or other unknown error: don't leak error details
    } else {
        // 1) Log error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong! Please try again later.' // Generic message
        });
    }
};

// --- Global Error Handling Middleware ---

module.exports = (err, req, res, next) => {
    // Set default status code and status if not already set
    err.statusCode = err.statusCode || 500; // Internal Server Error default
    err.status = err.status || 'error';

    if (environment.nodeEnv === 'development') {
        sendErrorDev(err, res);
    } else if (environment.nodeEnv === 'production') {
        let error = { ...err, message: err.message }; // Avoid modifying original err object directly

        // Handle specific Mongoose errors for cleaner production messages
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error); // Duplicate key error
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        
        // Handle potential JWT errors (if applicable elsewhere)
        // if (error.name === 'JsonWebTokenError') error = handleJWTError();
        // if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
}; 