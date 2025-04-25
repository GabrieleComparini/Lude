const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary'); // Ensure Cloudinary is initialized
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const AppError = require('../utils/AppError');

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // Use the configured cloudinary instance
    params: async (req, file) => {
        // Determine folder based on the route or field name
        let folder = 'misc'; // Default folder
        if (file.fieldname === 'profileImage') {
            folder = 'user_profiles';
        } else if (file.fieldname === 'vehicleImage') {
            folder = 'vehicle_images';
        }
        // Add more logic based on user ID, etc. if needed for organization

        // Generate a unique public_id
        const filename = path.parse(file.originalname).name;
        const public_id = `${req.user?._id || 'unknown'}_${file.fieldname}_${filename}_${Date.now()}`;

        return {
            folder: `lude/${folder}`, // Organize within a main 'lude' folder in Cloudinary
            public_id: public_id,
            // format: 'jpg', // Allow Cloudinary to auto-detect format or specify
            // transformation: [{ width: 500, height: 500, crop: "limit" }] // Optional: Apply transformations on upload
        };
    },
});

// File Filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        cb(null, true); // Accept file
    } else {
        cb(new AppError('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) are allowed.', 400), false); // Reject file
    }
};

// Multer upload instance
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: fileFilter
});

module.exports = upload; 