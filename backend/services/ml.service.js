const { spawn } = require('child_process');
const path = require('path');
const env = require('../config/env');

const processResumes = (jobDescription, filePaths) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../ml/resume_matcher.py');
        
        // Prepare data to pass to python script
        const inputData = JSON.stringify({
            job_description: jobDescription,
            file_paths: filePaths
        });

        const pythonProcess = spawn(env.PYTHON_PATH, [scriptPath]);
        
        let dataString = '';
        let errorString = '';

        // Write data to stdin of python process
        pythonProcess.stdin.write(inputData);
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Python stderr: ${errorString}`);
                return reject(new Error(`ML processing failed: ${errorString}`));
            }
            
            try {
                // Determine if we have valid JSON
                const results = JSON.parse(dataString);
                resolve(results);
            } catch (err) {
                console.error('Failed to parse Python output:', dataString);
                reject(new Error('Invalid output from ML service'));
            }
        });
    });
};

module.exports = {
    processResumes
};
