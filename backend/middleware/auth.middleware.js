const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userService = require('../services/user.service');

const protect = async (req, res, next) => {
    try {
        let token;

        // Debug logging
        console.log('Auth Middleware - Cookies:', req.cookies);
        console.log('Auth Middleware - Headers:', req.headers.cookie);

        // Check for token in cookies
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            console.log('Auth Middleware - No token found');
            return res.status(401).json({ error: 'Not authorized, please login' });
        }

        console.log('Auth Middleware - Token found:', token.substring(0, 20) + '...');

        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // Get user from token
        const user = await userService.findUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user to request (exclude password)
        const { password, ...userSafe } = user;
        req.user = userSafe;
        
        next();

    } catch (error) {
        console.error('Auth Error:', error.message);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
