const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunityCommentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityPost',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: [1, 'Comment cannot be empty'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    // Optional: parent comment for replies
    parentCommentId: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityComment',
        default: null
    },
    // Denormalized fields for performance
    username: { // Denormalized for quick display
        type: String,
        required: true
    },
    userProfileImage: {
        type: String
    },
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// --- INDEXES ---
CommunityCommentSchema.index({ postId: 1, createdAt: 1 }); // For fetching comments for a post, sorted by time
CommunityCommentSchema.index({ parentCommentId: 1, createdAt: 1 }); // For fetching replies to a comment

// --- MIDDLEWARE ---
// Pre-save middleware could be added here...

module.exports = mongoose.model('CommunityComment', CommunityCommentSchema); 