const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const COLLECTION = 'users';

const createUser = async (userData) => {
    // Firebase Mode Only
    const existing = await findUserByEmail(userData.email);
    if (existing) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const docRef = db.collection(COLLECTION).doc();
    const newUser = {
        id: docRef.id,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'student',
        createdAt: new Date().toISOString()
    };
    await docRef.set(newUser);
    const { password, ...userSafe } = newUser;
    return userSafe;
};

const findUserByEmail = async (email) => {
    const snapshot = await db.collection(COLLECTION).where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
};

const findUserById = async (id) => {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return doc.data();
};

const validatePassword = async (user, password) => {
    return await bcrypt.compare(password, user.password);
};

// Create OAuth user (no password required)
const createOAuthUser = async (userData) => {
    const existing = await findUserByEmail(userData.email);
    if (existing) return existing; // Return existing user

    const docRef = db.collection(COLLECTION).doc();
    const newUser = {
        id: docRef.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'student',
        oauthProvider: userData.provider,
        photoURL: userData.photoURL || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    await docRef.set(newUser);
    return newUser;
};

// Update user
const updateUser = async (userId, updates) => {
    const docRef = db.collection(COLLECTION).doc(userId);
    await docRef.update({
        ...updates,
        updatedAt: new Date().toISOString()
    });
    const doc = await docRef.get();
    return doc.data();
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    validatePassword,
    createOAuthUser,
    updateUser
};
