const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
require('firebase-admin/auth');

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
    try { // Added try-catch for Firebase Admin initialization
        admin.initializeApp({
            credential: admin.credential.cert(
                JSON.parse(process.env.FIREBASE_ADMIN_SDK_CREDENTIALS)
            ),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization error:", error);
    }
}

exports.handler = async function (event, context) {
    const params = event.queryStringParameters;
    const enteredPassword = params.code;
    const chatroomName = params.chatroomName;

    if (!chatroomName || !enteredPassword) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: "Chatroom name and password are required." }) };
    }

    try {
        const roomMetadataRef = admin.database().ref(`chatrooms_metadata/${chatroomName}`);
        const snapshot = await roomMetadataRef.once("value");
        const roomMetadata = snapshot.val();

        if (!roomMetadata) {
            return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Chatroom not found.' }) };
        }

        if (!roomMetadata.isPasswordProtected) {
            return { statusCode: 200, body: JSON.stringify({ success: true, isPasswordProtected: false, chatroomName: chatroomName }) };
        }

        const passwordHashFromDB = roomMetadata.passwordHash;
        if (!passwordHashFromDB) {
            return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Server error: Password hash not found.' }) };
        }

        const passwordMatch = await bcrypt.compare(enteredPassword, passwordHashFromDB);

        if (passwordMatch) {
            // --- Generate Firebase Custom Auth Token ---
            let customToken;
            try {
                customToken = await admin.auth().createCustomToken(chatroomName);
            } catch (adminTokenError) {
                console.error("Error creating Custom Auth Token:", adminTokenError);
                return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Error creating authentication token.', details: adminTokenError.message }) };
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    isPasswordProtected: true,
                    chatroomName: chatroomName,
                    token: customToken,
                }),
            };
        } else { // Keep incorrect password handling
            return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Incorrect password.' }) };
        }
    } catch (error) { // Keep general error handling
        console.error("Error verifying chat code:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: "Server error during password verification.", details: error.message }) };
    }
};