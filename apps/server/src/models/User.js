const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Basic email regex validation
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const UserSchema = new Schema({
    firebaseUid: {
        type: String,
        required: [true, 'Firebase UID is required'],
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [emailRegex, 'Please provide a valid email address'],
        index: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
        index: true,
    },
    name: { // Display name
        type: String,
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
        default: ''
    },
    profileImage: {
        type: String, // URL to Cloudinary image
        default: null
    },
    bio: {
        type: String,
        maxlength: [160, 'Bio cannot exceed 160 characters'],
        default: ''
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    preferences: {
        units: {
            type: String,
            enum: {
                values: ['metric', 'imperial'],
                message: '{VALUE} is not a supported unit system (metric, imperial)'
            },
            default: 'metric'
        },
        privacy: {
            profileVisibility: {
                type: String,
                enum: {
                    values: ['public', 'connections', 'private'],
                    message: '{VALUE} is not a supported visibility setting'
                },
                default: 'public'
            },
            trackVisibilityDefault: {
                type: String,
                enum: {
                    values: ['public', 'private'],
                    message: '{VALUE} is not a supported track visibility'
                },
                default: 'private'
            }
        },
        notifications: {
            newFollower: { type: Boolean, default: true },
            trackComment: { type: Boolean, default: true },
            trackReaction: { type: Boolean, default: true },
            achievementUnlocked: { type: Boolean, default: true }
            // Add more notification types as needed
        }
    },
    statistics: {
        totalDistance: { type: Number, default: 0, min: 0 }, // Meters
        totalTime: { type: Number, default: 0, min: 0 }, // Seconds
        totalTracks: { type: Number, default: 0, min: 0 },
        topSpeed: { type: Number, default: 0, min: 0 }, // m/s
        avgSpeed: { type: Number, default: 0, min: 0 } // m/s (Consider how/when to calculate)
    },
    connections: [{ // Users this user is following
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{ // Users following this user
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Consider adding isAdmin flag if needed later
    // isAdmin: { type: Boolean, default: false }
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: '{VALUE} is not a supported role.'
        },
        default: 'user',
        index: true // Index for potential queries based on role
    }

}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
    toObject: { virtuals: true } // Ensure virtuals are included when converting to plain objects
});

// --- VIRTUALS ---

// Example: Virtual for profile completion percentage (rough estimate)
UserSchema.virtual('profileCompletion').get(function() {
    let score = 0;
    if (this.name && this.name.length > 0) score += 20;
    if (this.username) score += 10; // Username is required, so always +10?
    if (this.profileImage) score += 25;
    if (this.bio && this.bio.length > 0) score += 20;
    // Cannot check vehicles directly here without population
    // Add check for email verification if implemented
    // Add more criteria as needed
    return Math.min(score, 100); // Cap at 100
});

// Virtual to count connections
UserSchema.virtual('connectionsCount').get(function() {
    return this.connections ? this.connections.length : 0;
});

// Virtual to count followers
UserSchema.virtual('followersCount').get(function() {
    return this.followers ? this.followers.length : 0;
});

// --- METHODS ---

// Method to safely update statistics after a track is saved
UserSchema.methods.updateStats = async function(trackStats) {
    this.statistics.totalDistance += trackStats.distance || 0;
    this.statistics.totalTime += trackStats.duration || 0;
    this.statistics.totalTracks += 1;
    if (trackStats.maxSpeed > this.statistics.topSpeed) {
        this.statistics.topSpeed = trackStats.maxSpeed;
    }
    // Recalculating average speed accurately can be tricky.
    // Simplest: total distance / total time
    if (this.statistics.totalTime > 0) {
         this.statistics.avgSpeed = this.statistics.totalDistance / this.statistics.totalTime;
    }
    // Note: This average includes stopped time. May need refinement.
    return this.save(); // Return the promise
};

// --- MIDDLEWARE (PRE/POST HOOKS) ---

// Example: Pre-save hook to normalize username if needed
// UserSchema.pre('save', function(next) {
//     if (this.isModified('username')) {
//         this.username = this.username.toLowerCase();
//     }
//     next();
// });

module.exports = mongoose.model('User', UserSchema); 