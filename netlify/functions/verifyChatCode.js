const bcrypt = require("bcrypt");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_SDK_CREDENTIALS)
    ), // Use environment variable for credentials
    databaseURL: process.env.FIREBASE_DATABASE_URL, // Use environment variable for database URL
  });
}

exports.handler = async function (event, context) {
  // Netlify Function handler is 'handler'
  const params = event.queryStringParameters; // Get parameters from query string for GET requests, or use JSON.parse(event.body) for POST requests if needed

  const enteredPassword = params.code; // Get code from query parameters (adjust if using POST and body)
  const chatroomName = params.chatroomName; // Get chatroom name

  if (!chatroomName || !enteredPassword) {
    return {
      // Netlify Functions return objects with statusCode, body, headers
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: "Chatroom name and password are required.",
      }),
    };
  }

  try {
    const roomMetadataRef = admin
      .database()
      .ref(`chatrooms_metadata/${chatroomName}`);
    const snapshot = await roomMetadataRef.once("value");
    const roomMetadata = snapshot.val();

    if (!roomMetadata) {
      return {
        statusCode: 404, // 404 Not Found
        body: JSON.stringify({ success: false, error: "Chatroom not found." }),
      };
    }

    if (!roomMetadata.isPasswordProtected) {
      return {
        // If not password protected, verification is always successful
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    const passwordHashFromDB = roomMetadata.passwordHash;

    if (!passwordHashFromDB) {
      // Should not happen if isPasswordProtected is true, but check for safety
      return {
        statusCode: 500, // 500 Internal Server Error - unexpected state
        body: JSON.stringify({
          success: false,
          error: "Server error: Password hash not found.",
        }),
      };
    }

    const passwordMatch = await bcrypt.compare(
      enteredPassword,
      passwordHashFromDB
    );

    if (passwordMatch) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    } else {
      return {
        statusCode: 401, // 401 Unauthorized - incorrect password
        body: JSON.stringify({ success: false, error: "Incorrect password." }),
      };
    }
  } catch (error) {
    console.error("Error verifying chat code:", error);
    return {
      statusCode: 500, // 500 Internal Server Error
      body: JSON.stringify({
        success: false,
        error: "Server error during password verification.",
        details: error.message,
      }),
    };
  }
};
