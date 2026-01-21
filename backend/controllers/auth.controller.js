const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const env = require('../config/env');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide all fields' });
        }

        const user = await userService.createUser({ name, email, password });
        
        // Generate token and set cookie
        const token = generateToken(user.id);
        
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            // secure: true, // Use in production with HTTPS
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            success: true,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userService.findUserByEmail(email);

        if (user && (await userService.validatePassword(user, password))) {
            const token = generateToken(user.id);
            
            console.log('Login - Setting cookie with token:', token.substring(0, 20) + '...');
            
            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            console.log('Login - Cookie set successfully');

            const { password: _, ...userSafe } = user;
            res.json({
                success: true,
                user: userSafe
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

const logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(0)
    });
    res.status(200).json({ success: true, message: 'Logged out' });
};

const getMe = async (req, res) => {
    // req.user is set by auth middleware
    if (req.user) {
        res.json({ success: true, user: req.user });
    } else {
         res.status(401).json({ error: 'Not authorized' });
    }
};

module.exports = {
    signup,
    login,
    logout,
    getMe
};
