const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load .env file from server root
// console.log('process.env.MONGO_URI after dotenv:', process.env.MONGO_URI); // DEBUG LINE REMOVED
const environment = require('../config/environment'); // Load DB URI AFTER dotenv config
const Achievement = require('../models/Achievement');

const achievements = [
    // --- Distance --- 
    {
        achievementCode: 'DISTANCE_10KM',
        name: 'Marathon Starter',
        description: 'Complete a total distance of 10 kilometers across all tracks.',
        iconUrl: '/icons/achievements/distance_10km.png',
        category: 'distance',
        requirements: { stat: 'totalDistance', value: 10000 }, // 10km in meters
        rarity: 'common'
    },
    {
        achievementCode: 'DISTANCE_100KM',
        name: 'Road Warrior',
        description: 'Complete a total distance of 100 kilometers across all tracks.',
        iconUrl: '/icons/achievements/distance_100km.png',
        category: 'distance',
        requirements: { stat: 'totalDistance', value: 100000 }, // 100km in meters
        rarity: 'uncommon'
    },
    // --- Speed --- 
    {
        achievementCode: 'SPEED_100KPH',
        name: 'Speedster',
        description: 'Reach a maximum speed of 100 km/h on any track.',
        iconUrl: '/icons/achievements/speed_100kph.png',
        category: 'speed',
        // 100 km/h = 27.78 m/s
        requirements: { trackCondition: 'maxSpeed', value: 27.78 }, 
        rarity: 'common'
    },
     {
        achievementCode: 'SPEED_150KPH',
        name: 'Velocity King',
        description: 'Reach a maximum speed of 150 km/h on any track.',
        iconUrl: '/icons/achievements/speed_150kph.png',
        category: 'speed',
        // 150 km/h = 41.67 m/s
        requirements: { trackCondition: 'maxSpeed', value: 41.67 }, 
        rarity: 'uncommon'
    },
    // --- Frequency --- 
    {
        achievementCode: 'TRACKS_10',
        name: 'Consistent Cruiser',
        description: 'Record 10 tracks.',
        iconUrl: '/icons/achievements/tracks_10.png',
        category: 'frequency',
        requirements: { stat: 'totalTracks', value: 10 },
        rarity: 'common'
    },
    {
        achievementCode: 'TRACKS_50',
        name: 'Dedicated Driver',
        description: 'Record 50 tracks.',
        iconUrl: '/icons/achievements/tracks_50.png',
        category: 'frequency',
        requirements: { stat: 'totalTracks', value: 50 },
        rarity: 'rare'
    },
     // --- Social --- (Example - Requires 'connectionsCount' stat)
     {
        achievementCode: 'CONNECTIONS_5',
        name: 'Social Butterfly',
        description: 'Connect with 5 other users.',
        iconUrl: '/icons/achievements/social_5.png',
        category: 'social',
        requirements: { stat: 'connectionsCount', value: 5 }, // Assumes connectionsCount exists on User.statistics or is calculated
        rarity: 'uncommon'
    }
];

const seedDB = async () => {
    try {
        // Ensure DATABASE_URL is loaded before connecting (using the name from environment.js)
        if (!environment.databaseUrl) {
            throw new Error('DATABASE_URL (or MONGO_URI, depending on config) not found in environment variables. Make sure .env file is present and configured correctly in environment.js.');
        }
        // Use environment.databaseUrl here
        await mongoose.connect(environment.databaseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex: true, // No longer needed in Mongoose 6+
            // useFindAndModify: false // No longer needed in Mongoose 6+
        });
        console.log('MongoDB Connected for Seeding...');

        // Clear existing achievements
        await Achievement.deleteMany({});
        console.log('Existing achievements cleared.');

        // Insert new achievements
        await Achievement.insertMany(achievements);
        console.log(`Successfully seeded ${achievements.length} achievements.`);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1); // Exit with failure code
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('MongoDB Disconnected after Seeding.');
    }
};

// Run the seeder function
seedDB(); 