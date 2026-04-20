const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let firebaseAdmin;

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.warn('Firebase Admin SDK initialization failed - Check your FIREBASE_SERVICE_ACCOUNT_JSON in .env');
    // console.error(error);
}

module.exports = admin;
