const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AchievementEarnedSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    achievementId: { // Reference to the Achievement definition
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true
    },
    // Store achievementCode denormalized for easier querying/checking?
    achievementCode: {
        type: String, 
        required: true,
        index: true 
    },
    earnedAt: {
        type: Date,
        default: Date.now
    },
    trackId: { // Optional: The specific track that triggered the achievement
        type: Schema.Types.ObjectId,
        ref: 'Track',
        required: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// --- INDEXES ---
// Ensure a user can only earn a specific achievement once
AchievementEarnedSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
AchievementEarnedSchema.index({ userId: 1, achievementCode: 1 }, { unique: true }); // If using code

// Index for fetching earned achievements for a user, sorted by time
AchievementEarnedSchema.index({ userId: 1, earnedAt: -1 });

module.exports = mongoose.model('AchievementEarned', AchievementEarnedSchema); 