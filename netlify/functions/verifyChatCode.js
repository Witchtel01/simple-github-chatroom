const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
require('firebase-admin/auth'); // Import auth module

// Initialize Firebase Admin SDK (if not already initialized) - Keep initialization as before
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_ADMIN_SDK_CREDENTIALS)
        ),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

exports.handler = async function (event, context) {
    const params = event.queryStringParameters;
    const enteredPassword = params.code;
    const chatroomName = params.chatroomName;

    if (!chatroomName || !enteredPassword) { // Keep input validation
        return { statusCode: 400, body: JSON.stringify({ success: false, error: "Chatroom name and password are required." }) };
    }

    try {
        const roomMetadataRef = admin.database().ref(`chatrooms_metadata/${chatroomName}`);
        const snapshot = await roomMetadataRef.once("value");
        const roomMetadata = snapshot.val();

        if (!roomMetadata) { // Keep chatroom not found handling
            return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Chatroom not found.' }) };
        }

        if (!roomMetadata.isPasswordProtected) { // Keep public room handling - though ideally redirect to public room join directly
            return { statusCode: 200, body: JSON.stringify({ success: true, isPasswordProtected: false, chatroomName: chatroomName }) };
        }

        const passwordHashFromDB = roomMetadata.passwordHash;
        if (!passwordHashFromDB) { // Keep password hash not found error handling
            return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Server error: Password hash not found.' }) };
        }

        const passwordMatch = await bcrypt.compare(enteredPassword, passwordHashFromDB);

        if (passwordMatch) {
            // --- Generate Firebase Custom Auth Token ---
            let customToken;
            try {
                customToken = await admin.auth().createCustomToken(chatroomName); // Use chatroomName as uid (or generate a unique user ID if needed)
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
                    token: customToken, // <--- Return the Custom Token in the response
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