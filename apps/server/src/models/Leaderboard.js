const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Defines a single entry in the leaderboard scores array
const LeaderboardScoreSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: { // Denormalized for quick display
        type: String,
        required: true,
        trim: true
    },
    profileImage: { // Denormalized
        type: String,
        default: null
    },
    value: { // The actual score (e.g., distance in meters, time in seconds, track count)
        type: Number,
        required: true,
        default: 0
    },
    rank: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false }); // No need for individual IDs on subdocuments unless necessary

const LeaderboardSchema = new Schema({
    type: { // Type of leaderboard (e.g., 'weekly_distance', 'monthly_top_speed', 'all_time_tracks')
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    period: { // Identifier for the period (e.g., '2023-W45', '2023-11', 'all')
        type: String,
        required: true,
        trim: true,
        index: true
    },
    generatedAt: { // When this leaderboard data was generated
        type: Date,
        default: Date.now
    },
    scores: [LeaderboardScoreSchema] // Array containing top scores for this type/period
}, {
    timestamps: true // Adds createdAt, updatedAt (useful for seeing when the doc itself was created/updated)
});

// --- INDEXES ---
// Compound index to quickly find a specific leaderboard for a type and period
LeaderboardSchema.index({ type: 1, period: 1 }, { unique: true });
// Index to find the latest generated leaderboard for a type (useful for display)
LeaderboardSchema.index({ type: 1, generatedAt: -1 });


module.exports = mongoose.model('Leaderboard', LeaderboardSchema); 