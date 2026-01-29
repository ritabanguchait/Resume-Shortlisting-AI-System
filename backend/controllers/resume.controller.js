const path = require('path');
const mlService = require('../services/ml.service');
const jobService = require('../services/job.service');
const { spawn } = require('child_process'); // Added this line as it's used in the new code

const shortlistResumes = async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const files = req.files;

        // Validation
        if (!files || files.length === 0) { // Added validation for files
            return res.status(400).json({ error: 'No resumes uploaded' });
        }
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Prepare file paths
        const filePaths = files.map(file => file.path);

        // Resolve absolute path to python script
        const scriptPath = path.join(__dirname, '../../ml/matcher.py');

        // Run Python Script
        const pythonProcess = spawn('python', [scriptPath]);

        const inputData = JSON.stringify({
            job_description: jobDescription,
            file_paths: filePaths
        });

        let resultString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            resultString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error('Python Error:', errorString);
                // Return the actual error from Python to help debugging
                return res.status(500).json({ 
                    error: 'AI Engine Error', 
                    details: errorString || 'Unknown Python script error',
                    code: code
                });
            }

            try {
                const results = JSON.parse(resultString);
                
                // Persist job and candidates (re-integrated from original logic)
                const job = await jobService.createJob({
                    jobDescription,
                    uploadedBy: req.user.id, // From auth middleware
                    candidates: results // Assuming results structure is compatible
                });

                res.json({
                    success: true,
                    jobId: job.id,
                    data: results
                });
            } catch (e) {
                console.error('JSON Parse Error:', e);
                res.status(500).json({ error: 'Invalid response from AI engine' });
            }
        });

        // Send data to python script
        pythonProcess.stdin.write(inputData);
        pythonProcess.stdin.end();

    } catch (error) {
        console.error('Error in shortlistResumes:', error); // Kept original error logging
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        });
    }
};

module.exports = {
    shortlistResumes
};
