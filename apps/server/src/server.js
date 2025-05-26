const express = require('express');
const cors = require('cors');
const path = require('path');
const environment = require('./config/environment'); // Loads .env vars
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler'); // Require the handler
const AppError = require('./utils/AppError'); // Import AppError class

// --- Initialize Core Services ---
require('./config/firebaseAdmin'); // Initialize Firebase Admin SDK (logs success/error)
require('./config/cloudinary'); // Initialize Cloudinary SDK (logs success/error)

// --- Connect to Database ---
connectDB();

// --- Initialize Express App ---
const app = express();

// --- Core Middlewares ---

// CORS Configuration
// TODO: Restrict origins in production!
const corsOptions = {
    origin: '*', // Allow all origins for now (development)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies if needed (might be relevant for sessions later)
};
app.use(cors(corsOptions));

// Body Parsers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Basic Test Route ---
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to Lude (Track Master) Backend API!',
        status: 'OK',
        environment: environment.nodeEnv,
        timestamp: new Date().toISOString()
     });
});

// --- API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/tracks', require('./routes/trackRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/leaderboards', require('./routes/leaderboardRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
// Placeholder for future routes:
// app.use('/api/analytics', require('./routes/analyticsRoutes'));

// --- Handle 404 Not Found for API routes ---
// This should come after all API routes but before the global error handler
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --- Global Error Handler ---
// This must be the LAST middleware added
app.use(errorHandler);

// --- Start Server ---
const PORT = environment.port;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${environment.nodeEnv} mode on port ${PORT}`);
});

// --- Graceful Shutdown Handling ---
process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`, err.stack);
    // Close server & exit process
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Shutting down gracefully.');
    server.close(() => {
        console.log('Process terminated.');
        mongoose.connection.close(false, () => {
             console.log('MongoDB connection closed.');
             process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received. Shutting down gracefully.');
    server.close(() => {
        console.log('Process terminated.');
         mongoose.connection.close(false, () => {
             console.log('MongoDB connection closed.');
             process.exit(0);
        });
    });
}); 