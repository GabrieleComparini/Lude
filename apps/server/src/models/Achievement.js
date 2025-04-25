const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AchievementSchema = new Schema({
    achievementCode: { // Unique code, e.g., 'DISTANCE_100KM', 'TOP_SPEED_150'
        type: String,
        required: [true, 'Achievement code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Achievement name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Achievement description is required'],
        trim: true,
        maxlength: [255, 'Description cannot exceed 255 characters']
    },
    iconUrl: { // URL to the achievement icon/badge
        type: String,
        required: false // Or make required if every achievement must have an icon
    },
    category: {
        type: String,
        enum: ['distance', 'speed', 'frequency', 'social', 'exploration', 'other'],
        required: [true, 'Achievement category is required'],
        index: true
    },
    requirements: {
        // Flexible structure based on category/type
        // Examples:
        // { stat: 'totalDistance', value: 100000 } // 100km
        // { stat: 'topSpeed', value: 41.67 } // 150 km/h in m/s
        // { stat: 'totalTracks', value: 50 }
        // { stat: 'connectionsCount', value: 10 }
        // { trackCondition: 'maxSpeed', value: 55.56 } // Max speed > 200km/h on a single track
        type: Object, 
        required: [true, 'Achievement requirements are required']
    },
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Achievement', AchievementSchema); 