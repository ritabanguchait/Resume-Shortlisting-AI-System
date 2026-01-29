const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const initializeFirebase = () => {
    try {
        // Check if service account key exists
        const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
        
        // Try to initialize with service account
        try {
            const serviceAccount = require(serviceAccountPath);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin initialized with service account');
        } catch (err) {
            // Fallback: Initialize without credentials (for development)
            console.warn('Firebase service account not found, using mock verification');
            firebaseApp = null;
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
    try {
        if (!firebaseApp) {
            // Mock verification for development
            console.warn('Using mock token verification (development only)');
            // In production, this should fail
            return {
                email: 'mock@example.com',
                name: 'Mock User',
                uid: 'mock-uid-' + Date.now()
            };
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return {
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email.split('@')[0],
            uid: decodedToken.uid,
            picture: decodedToken.picture
        };
    } catch (error) {
        console.error('Token verification error:', error);
        throw new Error('Invalid authentication token');
    }
};

module.exports = {
    initializeFirebase,
    verifyIdToken
};
