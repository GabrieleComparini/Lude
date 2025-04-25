const Achievement = require('../models/Achievement');
const AchievementEarned = require('../models/AchievementEarned');
const User = require('../models/User');
const Track = require('../models/Track');

/**
 * Checks all relevant achievements based on the trigger event and user data.
 * 
 * @param {string} trigger - The event that triggered the check (e.g., 'track_saved', 'user_updated', 'follow_added').
 * @param {object} data - Contextual data. For 'track_saved', includes { userId: string, trackId: string }. For 'user_updated', { userId: string }.
 */
const checkAchievements = async (trigger, data) => {
    console.log(`Checking achievements for trigger: ${trigger}, data:`, data);
    let user;
    let track;

    try {
        // Fetch necessary data based on trigger
        if (data.userId) {
            // Fetch user with stats, connections count etc.
            user = await User.findById(data.userId).select('statistics connections'); 
            if (!user) {
                console.error(`[AchievementCheck] User not found: ${data.userId}`);
                return;
            }
             // Add virtual counts if needed, although direct query is better
            user.connectionsCount = user.connections?.length || 0; 
        }
        if (trigger === 'track_saved' && data.trackId) {
            track = await Track.findById(data.trackId); // Get full track data
             if (!track) {
                console.error(`[AchievementCheck] Track not found: ${data.trackId}`);
                return; // Cannot check track-specific achievements
            }
        }

        // Fetch all achievement definitions (cache this in production?)
        const allAchievements = await Achievement.find({});

        // Get achievements already earned by the user
        const earnedAchievements = await AchievementEarned.find({ userId: data.userId }).select('achievementCode');
        const earnedCodes = earnedAchievements.map(a => a.achievementCode);

        // Iterate through definitions and check requirements
        for (const achievement of allAchievements) {
            if (earnedCodes.includes(achievement.achievementCode)) {
                continue; // Already earned
            }

            let earned = false;
            const req = achievement.requirements;

            try {
                 // Check requirements based on trigger and achievement category/requirements structure
                switch (trigger) {
                    case 'track_saved':
                        if (track && req.trackCondition && track[req.trackCondition] !== undefined && track[req.trackCondition] >= req.value) {
                             // e.g., { trackCondition: 'maxSpeed', value: 55.56 }
                            earned = true;
                        } else if (user && req.stat && user.statistics[req.stat] !== undefined && user.statistics[req.stat] >= req.value) {
                             // Check user stats after track save (e.g., total distance)
                             // e.g., { stat: 'totalDistance', value: 100000 }
                             earned = true;
                        }
                        break;
                    
                    case 'user_updated': // Could be triggered after profile update, connection changes etc.
                         if (user && req.stat && user.statistics[req.stat] !== undefined && user.statistics[req.stat] >= req.value) {
                            // e.g., { stat: 'totalTracks', value: 50 }
                            earned = true;
                        } else if (user && req.stat === 'connectionsCount' && user.connectionsCount >= req.value) {
                            // e.g., { stat: 'connectionsCount', value: 10 }
                             earned = true;
                        } 
                        break;

                    // Add more triggers as needed (e.g., 'comment_added', 'reaction_added')
                }

                if (earned) {
                    console.log(`[AchievementCheck] User ${data.userId} earned achievement: ${achievement.achievementCode}`);
                    await AchievementEarned.create({
                        userId: data.userId,
                        achievementId: achievement._id,
                        achievementCode: achievement.achievementCode,
                        trackId: trigger === 'track_saved' ? data.trackId : undefined // Link triggering track if applicable
                    });
                    earnedCodes.push(achievement.achievementCode); // Add to list to prevent re-checking in this run
                    // TODO: Send notification to user?
                }

            } catch (checkError) {
                console.error(`[AchievementCheck] Error checking achievement ${achievement.achievementCode} for user ${data.userId}:`, checkError);
            }
        }

    } catch (error) {
        console.error(`[AchievementCheck] General error during achievement check for trigger ${trigger}:`, error);
    }
};

module.exports = { checkAchievements }; 