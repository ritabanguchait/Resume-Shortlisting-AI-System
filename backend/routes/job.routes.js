const express = require('express');
const router = express.Router();
const jobService = require('../services/job.service');
const { protect } = require('../middleware/auth.middleware');

// Get all jobs
router.get('/jobs', protect, async (req, res) => {
    try {
        const jobs = await jobService.getAllJobs();
        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get specific job
router.get('/jobs/:id', protect, async (req, res) => {
    try {
        const job = await jobService.getJobById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update candidate status
router.patch('/jobs/:id/candidates/:fileName/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, error: 'Status is required' });
        }
        
        const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }
        
        const job = await jobService.updateCandidateStatus(
            req.params.id, 
            req.params.fileName, 
            status
        );
        
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add candidate note
router.post('/jobs/:id/candidates/:fileName/notes', protect, async (req, res) => {
    try {
        const { note } = req.body;
        if (!note) {
            return res.status(400).json({ success: false, error: 'Note is required' });
        }
        
        const job = await jobService.addCandidateNote(
            req.params.id, 
            req.params.fileName, 
            note
        );
        
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
