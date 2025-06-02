const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const POIReviewSchema = new Schema({
    poiId: {
        type: Schema.Types.ObjectId,
        ref: 'POI',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    images: [{
        url: {
            type: String,
            required: true,
            trim: true
        },
        caption: {
            type: String,
            trim: true,
            maxlength: [100, 'Image caption cannot exceed 100 characters']
        }
    }],
    helpfulCount: {
        type: Number,
        default: 0,
        min: 0
    },
    reportCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    visitDate: {
        type: Date
    },
    tags: {
        type: [String],
        validate: [val => val.length <= 5, 'Maximum 5 tags allowed per review']
    }
}, {
    timestamps: true
});

// Ensure a user can only review a POI once
POIReviewSchema.index({ poiId: 1, userId: 1 }, { unique: true });

// Index for sorting by date
POIReviewSchema.index({ poiId: 1, createdAt: -1 });

// Index for sorting by helpfulness
POIReviewSchema.index({ poiId: 1, helpfulCount: -1 });

// Update POI rating when a review is added, modified, or removed
POIReviewSchema.post('save', async function(doc) {
    await updatePOIRating(doc.poiId);
});

POIReviewSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        await updatePOIRating(doc.poiId);
    }
});

POIReviewSchema.post('remove', async function(doc) {
    await updatePOIRating(doc.poiId);
});

// Function to update the average rating of a POI
async function updatePOIRating(poiId) {
    const POI = mongoose.model('POI');
    const reviews = await mongoose.model('POIReview').find({ poiId, isVisible: true });
    
    if (reviews.length === 0) {
        await POI.findByIdAndUpdate(poiId, {
            'rating.average': 0,
            'rating.count': 0
        });
        return;
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    
    await POI.findByIdAndUpdate(poiId, {
        'rating.average': parseFloat(average.toFixed(1)),
        'rating.count': reviews.length
    });
}

module.exports = mongoose.model('POIReview', POIReviewSchema); 