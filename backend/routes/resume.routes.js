const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const resumeController = require('../controllers/resume.controller');

const { protect } = require('../middleware/auth.middleware');

// Protect the shortlist route so only logged-in users can upload
router.post('/shortlist', protect, upload.array('resumes', 10), resumeController.shortlistResumes);

// Test route
router.get('/ping', (req, res) => {
    res.json({ message: 'Pong' });
});

module.exports = router;
