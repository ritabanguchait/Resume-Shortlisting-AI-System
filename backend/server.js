const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const resumeRoutes = require('./routes/resume.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for frontend
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve uploaded files if needed (optional, for "cv view link")
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', resumeRoutes);

// Fallback for frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
    console.log(`Open http://localhost:${env.PORT} to view the app`);
});
