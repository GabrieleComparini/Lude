const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunityPostSchema = new Schema({
    communityId: {
        type: Schema.Types.ObjectId, 
        ref: 'Community',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: {
            values: ['text', 'image', 'track', 'route'],
            message: '{VALUE} is not a supported post type'
        },
        required: true
    },
    content: {
        text: {
            type: String,
            trim: true,
            maxlength: [2000, 'Post text cannot exceed 2000 characters']
        },
        images: [{
            type: String // URLs to Cloudinary images
        }],
        trackId: {
            type: Schema.Types.ObjectId,
            ref: 'Track'
        },
        routeId: {
            type: Schema.Types.ObjectId,
            ref: 'Route' // Future implementation
        }
    },
    visibility: {
        type: String,
        enum: {
            values: ['public', 'community-only'],
            message: '{VALUE} is not a supported visibility setting'
        },
        default: 'community-only'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    // Denormalized fields for performance
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    username: { // Denormalized for quick display
        type: String,
        required: true
    },
    userProfileImage: {
        type: String
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// --- INDEXES ---
CommunityPostSchema.index({ communityId: 1, createdAt: -1 }); // For fetching community posts sorted by time
CommunityPostSchema.index({ userId: 1, communityId: 1, createdAt: -1 }); // For fetching user's posts in a community
CommunityPostSchema.index({ type: 1, communityId: 1 }); // For filtering by type within a community

module.exports = mongoose.model('CommunityPost', CommunityPostSchema); 