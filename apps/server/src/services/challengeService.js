const Challenge = require('../models/Challenge');
const ChallengeParticipant = require('../models/ChallengeParticipant');
const Track = require('../models/Track'); // Needed to get track details

/**
 * Updates progress for active challenges a user is participating in based on a new track.
 * 
 * @param {string} userId - The ID of the user who saved the track.
 * @param {string} trackId - The ID of the newly saved track.
 */
const updateChallengeProgressOnTrackSave = async (userId, trackId) => {
    try {
        console.log(`[ChallengeService] Updating challenge progress for user ${userId} based on track ${trackId}`);
        
        // 1. Find the track data
        const track = await Track.findById(trackId).select('distance duration startTime');
        if (!track) {
            console.error(`[ChallengeService] Track ${trackId} not found.`);
            return;
        }

        // 2. Find active challenges the user is participating in and hasn't completed
        const now = new Date();
        const participations = await ChallengeParticipant.find({
            userId: userId,
            completedAt: null, // Not already completed
            // We also need to ensure the challenge itself is active and the track falls within its period
        }).populate('challengeId'); // Populate challenge details (goal, type, dates)

        if (!participations || participations.length === 0) {
            console.log(`[ChallengeService] User ${userId} has no active, incomplete challenge participations.`);
            return; // No active participations to update
        }

        // 3. Iterate through participations and update progress if applicable
        for (const participation of participations) {
            const challenge = participation.challengeId;
            
            // Basic checks: Challenge exists, is active, and track is within challenge dates
            if (!challenge || !challenge.isActive || track.startTime < challenge.startTime || track.startTime > challenge.endTime) {
                continue; // Skip this participation
            }

            let progressIncrement = 0;
            switch (challenge.type) {
                case 'distance':
                    progressIncrement = track.distance; // Assuming track.distance is in meters
                    break;
                case 'duration':
                    progressIncrement = track.duration; // Assuming track.duration is in seconds
                    break;
                case 'track_count':
                    progressIncrement = 1;
                    break;
                // TODO: Add cases for 'top_speed', 'elevation_gain' if needed
                // These might require slightly different logic (e.g., comparing max speed)
                default:
                    console.warn(`[ChallengeService] Unhandled challenge type: ${challenge.type}`);
                    continue; // Skip unsupported types
            }

            if (progressIncrement > 0) {
                console.log(`[ChallengeService] Updating progress for user ${userId}, challenge ${challenge.challengeCode}, increment: ${progressIncrement}`);
                // Use the method defined on the model (or could replicate logic here)
                await participation.updateProgress(progressIncrement, challenge.goal);
                // Potential: Check if challenge is now completed and trigger notifications/rewards
                if (participation.completedAt) {
                     console.log(`[ChallengeService] User ${userId} completed challenge ${challenge.challengeCode}!`);
                     // TODO: Add logic for rewards/notifications
                }
            }
        }

    } catch (error) {
        console.error(`[ChallengeService] Error updating challenge progress for user ${userId}:`, error);
        // Decide if this error should propagate or just be logged
    }
};

// Add other service functions as needed, e.g., checkExpiredChallenges()

module.exports = {
    updateChallengeProgressOnTrackSave
}; 