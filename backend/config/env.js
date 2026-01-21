const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    PORT: process.env.PORT || 3000,
    PYTHON_PATH: process.env.PYTHON_PATH || 'python',
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey_change_in_production'
};
