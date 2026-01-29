const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let db;
let auth;

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
    console.error("CRITICAL ERROR: serviceAccountKey.json is missing in backend/config/");
    process.exit(1);
}

try {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    db = admin.firestore();
    auth = admin.auth();
    console.log("Firebase Admin Initialized Successfully");
} catch (e) {
    console.error("Firebase Init Error:", e);
    process.exit(1);
}

module.exports = { admin, db, auth };
