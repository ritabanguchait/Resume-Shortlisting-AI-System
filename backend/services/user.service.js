const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../data/users.json');

const readUsers = async () => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty array
        return [];
    }
};

const writeUsers = async (users) => {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

const createUser = async (userData) => {
    const users = await readUsers();
    
    // Check if user exists
    if (users.find(u => u.email === userData.email)) {
        throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

const findUserByEmail = async (email) => {
    const users = await readUsers();
    return users.find(u => u.email === email);
};

const findUserById = async (id) => {
    const users = await readUsers();
    return users.find(u => u.id === id);
};

const validatePassword = async (user, password) => {
    return await bcrypt.compare(password, user.password);
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    validatePassword
};
