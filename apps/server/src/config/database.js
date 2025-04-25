const mongoose = require('mongoose');
const environment = require('./environment');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true); // Recommended for Mongoose 7+
        await mongoose.connect(environment.databaseUrl, {
            // Options are generally handled by the driver now
            // useNewUrlParser: true, // Deprecated
            // useUnifiedTopology: true, // Deprecated
            // connectTimeoutMS: 10000, // Optional: Specify connection timeout
        });
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);

        mongoose.connection.on('error', (err) => {
          console.error(`MongoDB connection error: ${err}`);
          process.exit(1);
        });

    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB; 