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
  const body = JSON.parse(event.body); // Netlify Functions body is a string, parse it

  const roomName = body.roomName; // Get roomName from request body
  const password = body.password; // Get password from request body
  const setPassword = body.setPassword; // Get setPassword flag

  if (!roomName) {
    return {
      statusCode: 400, // 400 Bad Request
      body: JSON.stringify({
        success: false,
        error: "Chatroom name is required.",
      }),
    };
  }

  if (setPassword && !password) {
    return {
      statusCode: 400, // 400 Bad Request
      body: JSON.stringify({
        success: false,
        error: "Password is required for password-protected rooms.",
      }),
    };
  }

  try {
    const roomMetadataRef = admin
      .database()
      .ref(`chatrooms_metadata/${roomName}`);
    const snapshot = await roomMetadataRef.once("value");

    if (snapshot.exists()) {
      return {
        statusCode: 409, // 409 Conflict
        body: JSON.stringify({
          success: false,
          error: "Chatroom name already exists.",
        }),
      };
    }

    let passwordHash = null;
    if (setPassword && password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await roomMetadataRef.set({
      isPasswordProtected: setPassword,
      passwordHash: passwordHash,
    });

    return {
      statusCode: 200, // 200 OK
      body: JSON.stringify({
        success: true,
        message: `Chatroom "${roomName}" created successfully!`,
      }),
    };
  } catch (error) {
    console.error("Error creating chatroom with password:", error);
    return {
      statusCode: 500, // 500 Internal Server Error
      body: JSON.stringify({
        success: false,
        error: "Failed to create chatroom.",
        details: error.message,
      }),
    };
  }
};
