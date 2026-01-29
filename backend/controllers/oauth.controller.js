const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const firebaseConfig = require('../config/firebase.config');
const env = require('../config/env');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// OAuth Authentication Handler
const oauthLogin = async (req, res) => {
    try {
        const { idToken, email, name, provider, photoURL } = req.body;

        if (!idToken || !email) {
            return res.status(400).json({ error: 'Missing required OAuth data' });
        }

        // Verify Firebase ID token (in production)
        let verifiedData;
        try {
            verifiedData = await firebaseConfig.verifyIdToken(idToken);
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        // Find or create user
        let user = await userService.findUserByEmail(email);

        if (!user) {
            // Create new user with OAuth
            user = await userService.createOAuthUser({
                name: name || verifiedData.name,
                email: email,
                provider: provider,
                photoURL: photoURL || verifiedData.picture,
                role: 'student' // Default role for OAuth users
            });
            console.log('Created new OAuth user:', user.email);
        } else {
            // Update existing user with OAuth info if needed
            if (!user.oauthProvider) {
                user.oauthProvider = provider;
                await userService.updateUser(user.id, { oauthProvider: provider });
            }
            console.log('Existing user logged in via OAuth:', user.email);
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Return user data (without password)
        const { password: _, ...userSafe } = user;
        res.json({
            success: true,
            user: userSafe,
            isNewUser: !user.lastLogin
        });

    } catch (error) {
        console.error('OAuth login error:', error);
        res.status(500).json({ error: error.message || 'OAuth authentication failed' });
    }
};

module.exports = {
    oauthLogin
};
