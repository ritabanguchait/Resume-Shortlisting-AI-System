const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const resumeController = require('../controllers/resume.controller');

const { protect } = require('../middleware/auth.middleware');

// Middleware to validate strict upload limits based on role
const validateUploads = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Please upload a resume' });
    }
    
    // Strict limit for Students
    if (req.user.role === 'student' && req.files.length > 1) {
        return res.status(400).json({ 
            error: 'Students can only upload 1 resume for self-analysis.' 
        });
    }
    
    next();
};

// Protect the shortlist route so only logged-in users can upload
router.post('/shortlist', protect, upload.array('resumes', 10), validateUploads, resumeController.shortlistResumes);

// Test route
router.get('/ping', (req, res) => {
    res.json({ message: 'Pong' });
});

module.exports = router;
