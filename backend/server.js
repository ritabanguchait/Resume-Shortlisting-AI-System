const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const cookieParser = require('cookie-parser');
const resumeRoutes = require('./routes/resume.routes');
const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');

const app = express();

// Middleware - CORS must come before routes
app.use(cors({
    origin: true, // Allow all origins in development (or specify 'http://localhost:3000')
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for frontend
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve uploaded files if needed (optional, for "cv view link")
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', resumeRoutes);
app.use('/api', jobRoutes);

// Fallback for frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
    console.log(`Open http://localhost:${env.PORT} to view the app`);
});
