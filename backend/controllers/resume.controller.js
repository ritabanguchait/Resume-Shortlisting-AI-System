const path = require('path');
const mlService = require('../services/ml.service');
const jobService = require('../services/job.service');

const shortlistResumes = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No resumes uploaded' });
        }
        if (!req.body.jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        const jobDescription = req.body.jobDescription;
        const filePaths = req.files.map(file => file.path); // Absolute paths

        console.log(`Processing ${filePaths.length} resumes...`);

        const results = await mlService.processResumes(jobDescription, filePaths);

        // Persist job and candidates
        const job = await jobService.createJob({
            jobDescription,
            uploadedBy: req.user.id, // From auth middleware
            candidates: results
        });

        res.json({
            success: true,
            jobId: job.id,
            data: results
        });

    } catch (error) {
        console.error('Error in shortlistResumes:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        });
    }
};

module.exports = {
    shortlistResumes
};
