const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Community name is required'],
        trim: true,
        minlength: [3, 'Community name must be at least 3 characters long'],
        maxlength: [50, 'Community name cannot exceed 50 characters'],
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Community description cannot exceed 500 characters'],
        default: ''
    },
    coverImage: {
        type: String, // URL to Cloudinary image
        default: null
    },
    avatar: {
        type: String, // URL to Cloudinary image
        default: null
    },
    isPublic: {
        type: Boolean, 
        default: true,
        index: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner ID is required'],
        index: true
    },
    moderators: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingRequests: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        requestDate: {
            type: Date,
            default: Date.now
        }
    }],
    rules: [{
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, 'Rule title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Rule description cannot exceed 500 characters']
        }
    }],
    tags: {
        type: [String],
        validate: [val => !val.some(tag => tag.length > 30), 'Tags cannot exceed 30 characters']
    },
    // Denormalized fields for performance
    membersCount: {
        type: Number,
        default: 0,
        min: 0
    },
    postsCount: {
        type: Number, 
        default: 0,
        min: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// --- INDEXES ---
CommunitySchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search index
CommunitySchema.index({ isPublic: 1, createdAt: -1 }); // For listing public communities

// --- MIDDLEWARE ---
// Pre-save middleware to update the membersCount
CommunitySchema.pre('save', function(next) {
    if (this.isModified('members')) {
        this.membersCount = this.members.length;
    }
    next();
});

module.exports = mongoose.model('Community', CommunitySchema); 