console.log('Auth Service loading...');
// Temporary alert to debug loading
// alert('Auth Service Loaded!'); 

// Define global object immediately
window.FirebaseAuth = window.FirebaseAuth || {};

(function() {
    console.log('Auth Service IIFE running');
    
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // Initialize Firebase
    let auth = null;

    const initializeFirebase = () => {
        console.log('Initializing Firebase...');
        try {
            if (typeof firebase !== 'undefined') {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                auth = firebase.auth();
                console.log('Firebase initialized successfully');
                return true;
            } else {
                console.warn('Firebase SDK not loaded');
                return false;
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    };

    // Google Sign In
    const signInWithGoogle = async () => {
        try {
            if (!auth) initializeFirebase();
            if (!auth) throw new Error('Firebase not available');

            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            const idToken = await user.getIdToken();
            
            return {
                idToken,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                provider: 'google'
            };
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    };

    // GitHub Sign In
    const signInWithGitHub = async () => {
        try {
            if (!auth) initializeFirebase();
            if (!auth) throw new Error('Firebase not available');

            const provider = new firebase.auth.GithubAuthProvider();
            provider.addScope('user:email');

            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            const idToken = await user.getIdToken();
            
            return {
                idToken,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL,
                provider: 'github'
            };
        } catch (error) {
            console.error('GitHub sign-in error:', error);
            throw error;
        }
    };

    // Send OAuth data to backend
    const authenticateWithBackend = async (oauthData) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/oauth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(oauthData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Authentication failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Backend authentication error:', error);
            throw error;
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            if (auth) {
                await auth.signOut();
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    // Attach to window object
    window.FirebaseAuth = {
        initialize: initializeFirebase,
        signInWithGoogle,
        signInWithGitHub,
        authenticateWithBackend,
        signOut
    };
    
    console.log('Firebase Auth module loaded.');
})();
