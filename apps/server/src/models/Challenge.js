const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChallengeSchema = new Schema({
    challengeCode: { // Unique code, e.g., 'NOVEMBER_DISTANCE_CHALLENGE'
        type: String,
        required: [true, 'Challenge code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Challenge name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Challenge description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    type: {
        type: String,
        required: true,
        enum: ['distance', 'duration', 'track_count', 'top_speed', 'elevation_gain'], // Expand as needed
        index: true
    },
    goal: { // The target value for the challenge type
        type: Number,
        required: [true, 'Challenge goal is required'],
        min: [0, 'Goal must be non-negative']
    },
    goalUnit: { // Unit associated with the goal (e.g., 'meters', 'seconds', 'count')
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    isActive: { // Allows manual activation/deactivation
        type: Boolean,
        default: true,
        index: true
    },
    reward: { // Description or reference to a reward
        description: { type: String, trim: true, maxlength: 200 },
        // points: { type: Number, default: 0 }, // Optional: Points system?
        // badgeUrl: { type: String } // Optional: Badge reward?
    },
    // participantsCount: { type: Number, default: 0 } // Optional: Denormalized count?
}, {
    timestamps: true
});

// --- INDEXES ---
ChallengeSchema.index({ isActive: 1, endTime: 1 }); // Index for finding active/past challenges
ChallengeSchema.index({ isActive: 1, startTime: 1 });
ChallengeSchema.index({ type: 1, isActive: 1 });

// --- VIRTUALS ---
ChallengeSchema.virtual('isExpired').get(function() {
    return this.endTime < new Date();
});

ChallengeSchema.virtual('hasStarted').get(function() {
    return this.startTime <= new Date();
});

ChallengeSchema.virtual('status').get(function() {
    const now = new Date();
    if (!this.isActive) return 'inactive';
    if (this.endTime < now) return 'expired';
    if (this.startTime > now) return 'upcoming';
    return 'active';
});

ChallengeSchema.set('toJSON', { virtuals: true });
ChallengeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Challenge', ChallengeSchema); 