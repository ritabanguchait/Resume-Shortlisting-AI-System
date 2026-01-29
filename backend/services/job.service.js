const { db } = require('../config/firebase');

const COLLECTION = 'jobs';

const createJob = async (jobData) => {
    const docRef = db.collection(COLLECTION).doc();
    const newJob = {
        id: docRef.id,
        jobDescription: jobData.jobDescription,
        uploadedBy: jobData.uploadedBy,
        candidates: jobData.candidates || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await docRef.set(newJob);
    return newJob;
};

const getJobsByUser = async (userId) => {
    const snapshot = await db.collection(COLLECTION).where('uploadedBy', '==', userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => doc.data());
};

const getAllJobs = async () => {
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => doc.data());
};

const getJobById = async (jobId) => {
    const doc = await db.collection(COLLECTION).doc(jobId).get();
    if (!doc.exists) return null;
    return doc.data();
};

const updateCandidateStatus = async (jobId, candidateFileName, newStatus) => {
    const docRef = db.collection(COLLECTION).doc(jobId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Job not found');
    
    const job = doc.data();
    const candidateIndex = job.candidates.findIndex(c => c.fileName === candidateFileName);
    if (candidateIndex === -1) throw new Error('Candidate not found');
    
    job.candidates[candidateIndex].status = newStatus;
    const updatedAt = new Date().toISOString();
    
    await docRef.update({ candidates: job.candidates, updatedAt: updatedAt });
    return { ...job, updatedAt };
};

const addCandidateNote = async (jobId, candidateFileName, note) => {
    const docRef = db.collection(COLLECTION).doc(jobId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Job not found');
    
    const job = doc.data();
    const candidateIndex = job.candidates.findIndex(c => c.fileName === candidateFileName);
    if (candidateIndex === -1) throw new Error('Candidate not found');
    
    if (!job.candidates[candidateIndex].notes) job.candidates[candidateIndex].notes = [];
    job.candidates[candidateIndex].notes.push({ text: note, createdAt: new Date().toISOString() });
    const updatedAt = new Date().toISOString();
    
    await docRef.update({ candidates: job.candidates, updatedAt: updatedAt });
    return { ...job, updatedAt };
};

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    updateCandidateStatus,
    addCandidateNote,
    getJobsByUser
};
