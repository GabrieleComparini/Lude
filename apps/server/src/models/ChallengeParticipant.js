const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChallengeParticipantSchema = new Schema({
    challengeId: {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    progress: { // Current progress towards the goal
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    // goalValue: { type: Number }, // Optional: Denormalize goal value at time of joining?
    completedAt: { // Timestamp when the challenge was completed
        type: Date,
        default: null // null if not completed
    },
    status: { // Calculated status based on progress and completion
        type: String,
        enum: ['joined', 'in_progress', 'completed', 'expired_incomplete'], // Add more as needed
        default: 'joined'
    }
}, {
    timestamps: true // Adds createdAt, updatedAt
});

// --- INDEXES ---
// Ensure a user can only join a specific challenge once
ChallengeParticipantSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
// Index to quickly find participation records for a user
ChallengeParticipantSchema.index({ userId: 1 });
// Index to quickly find participants for a challenge
ChallengeParticipantSchema.index({ challengeId: 1 });
// Index to find completed participations
ChallengeParticipantSchema.index({ challengeId: 1, completedAt: 1 });

// --- METHODS --- 
// Method to update progress - could be moved to a service
ChallengeParticipantSchema.methods.updateProgress = async function(increment, challengeGoal) {
    if (this.completedAt) return this; // Already completed

    this.progress += increment;
    let updatedStatus = 'in_progress';

    if (this.progress >= challengeGoal) {
        this.progress = challengeGoal; // Cap progress at goal
        this.completedAt = new Date();
        updatedStatus = 'completed';
        // TODO: Trigger reward/notification? (Likely better handled in service layer)
    }
    this.status = updatedStatus;
    return this.save();
};

// --- MIDDLEWARE (PRE/POST HOOKS) ---
// Could add pre-save hook to validate progress doesn't exceed goal if needed,
// or to update status based on challenge expiry if not completed.

module.exports = mongoose.model('ChallengeParticipant', ChallengeParticipantSchema); 