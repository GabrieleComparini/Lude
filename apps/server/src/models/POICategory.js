const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const POICategorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    icon: {
        type: String, // URL or icon identifier
        required: false,
        trim: true
    },
    color: {
        type: String, // Hex color code
        required: false,
        trim: true,
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('POICategory', POICategorySchema); 