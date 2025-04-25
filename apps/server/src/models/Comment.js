const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Track = require('./Track'); // Needed to update commentsCount

const CommentSchema = new Schema({
    trackId: {
        type: Schema.Types.ObjectId,
        ref: 'Track',
        required: [true, 'Track ID is required'],
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    text: {
        type: String,
        trim: true,
        required: [true, 'Comment text cannot be empty'],
        minlength: [1, 'Comment text cannot be empty'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// --- INDEXES ---
// Compound index for fetching comments for a track, sorted by time
CommentSchema.index({ trackId: 1, createdAt: 1 });

// --- MIDDLEWARE (PRE/POST HOOKS) ---

// Update commentsCount on the associated Track when a comment is saved
CommentSchema.post('save', async function() {
    try {
        await Track.findByIdAndUpdate(this.trackId, { $inc: { commentsCount: 1 } });
    } catch (error) {
        console.error(`Error incrementing commentsCount for track ${this.trackId} after saving comment ${this._id}:`, error);
        // Handle error appropriately, maybe log it or queue a retry?
    }
});

// Update commentsCount on the associated Track when a comment is removed
// Note: findByIdAndDelete triggers 'findOneAndDelete' hook, not 'remove'
CommentSchema.post('findOneAndDelete', async function(doc) {
    if (doc) { // Ensure a document was actually deleted
        try {
            await Track.findByIdAndUpdate(doc.trackId, { $inc: { commentsCount: -1 } });
        } catch (error) {
            console.error(`Error decrementing commentsCount for track ${doc.trackId} after deleting comment ${doc._id}:`, error);
        }
    }
});

// If using bulk delete (deleteMany), a different approach is needed as hooks aren't called per document.

module.exports = mongoose.model('Comment', CommentSchema); 