const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const resumeController = require('../controllers/resume.controller');

router.post('/shortlist', upload.array('resumes', 20), resumeController.shortlistResumes);

// Test route
router.get('/ping', (req, res) => {
    res.json({ message: 'Pong' });
});

module.exports = router;
