const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// GeoJSON Schema for Point location
const PointSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere' // Index for geospatial queries
    }
}, { _id: false });

// Schema for POI images
const POIImageSchema = new Schema({
    url: {
        type: String,
        required: true,
        trim: true
    },
    caption: {
        type: String,
        trim: true,
        maxlength: [200, 'Image caption cannot exceed 200 characters']
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { _id: true });

const POISchema = new Schema({
    name: {
        type: String,
        required: [true, 'POI name is required'],
        trim: true,
        maxlength: [100, 'POI name cannot exceed 100 characters'],
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'POICategory',
        required: true,
        index: true
    },
    location: {
        type: PointSchema,
        required: true
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        postalCode: { type: String, trim: true }
    },
    images: [POIImageSchema],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'archived'],
        default: 'active'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tags: {
        type: [String],
        index: true,
        validate: [val => !val.some(tag => tag.length > 30), 'Tags cannot exceed 30 characters']
    },
    website: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    openingHours: {
        type: Map,
        of: {
            open: String,
            close: String
        }
    }
}, {
    timestamps: true
});

// --- INDEXES ---
// Index for searching by name and tags
POISchema.index({ name: 'text', tags: 'text' });

// Index for filtering by category and sorting by rating
POISchema.index({ category: 1, 'rating.average': -1 });

module.exports = mongoose.model('POI', POISchema); 