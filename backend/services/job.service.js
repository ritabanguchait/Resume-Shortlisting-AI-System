const fs = require('fs').promises;
const path = require('path');

const JOBS_FILE = path.join(__dirname, '../data/jobs.json');

const readJobs = async () => {
    try {
        const data = await fs.readFile(JOBS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty array
        return [];
    }
};

const writeJobs = async (jobs) => {
    await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
};

const createJob = async (jobData) => {
    const jobs = await readJobs();
    
    const newJob = {
        id: Date.now().toString(),
        jobDescription: jobData.jobDescription,
        uploadedBy: jobData.uploadedBy,
        candidates: jobData.candidates || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    jobs.push(newJob);
    await writeJobs(jobs);
    
    return newJob;
};

const getAllJobs = async () => {
    return await readJobs();
};

const getJobById = async (jobId) => {
    const jobs = await readJobs();
    return jobs.find(j => j.id === jobId);
};

const updateCandidateStatus = async (jobId, candidateFileName, newStatus) => {
    const jobs = await readJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex === -1) {
        throw new Error('Job not found');
    }
    
    const candidateIndex = jobs[jobIndex].candidates.findIndex(
        c => c.fileName === candidateFileName
    );
    
    if (candidateIndex === -1) {
        throw new Error('Candidate not found');
    }
    
    jobs[jobIndex].candidates[candidateIndex].status = newStatus;
    jobs[jobIndex].updatedAt = new Date().toISOString();
    
    await writeJobs(jobs);
    return jobs[jobIndex];
};

const addCandidateNote = async (jobId, candidateFileName, note) => {
    const jobs = await readJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex === -1) {
        throw new Error('Job not found');
    }
    
    const candidateIndex = jobs[jobIndex].candidates.findIndex(
        c => c.fileName === candidateFileName
    );
    
    if (candidateIndex === -1) {
        throw new Error('Candidate not found');
    }
    
    if (!jobs[jobIndex].candidates[candidateIndex].notes) {
        jobs[jobIndex].candidates[candidateIndex].notes = [];
    }
    
    jobs[jobIndex].candidates[candidateIndex].notes.push({
        text: note,
        createdAt: new Date().toISOString()
    });
    
    jobs[jobIndex].updatedAt = new Date().toISOString();
    
    await writeJobs(jobs);
    return jobs[jobIndex];
};

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    updateCandidateStatus,
    addCandidateNote
};
