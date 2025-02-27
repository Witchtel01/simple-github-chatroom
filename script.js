import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  get,
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";
import {
  getAuth,
  signInWithCustomToken,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js"; // IMPORT getAuth and signInWithCustomToken

// Firebase configuration (Replace with your actual config) - Keep config as before
const firebaseConfig = {
  apiKey: "AIzaSyB2W99M0O5ZzFqOilrVTyhjRCsvjxpZgI8",
  authDomain: "simple-github-chatroom-109.firebaseapp.com",
  projectId: "simple-github-chatroom-109",
  storageBucket: "simple-github-chatroom-109.firebasestorage.app",
  messagingSenderId: "207217285359",
  appId: "1:207217285359:web:76b6b4c2acd7cbdf16231a",
  measurementId: "G-NLHVVGCDH5",
};

// Initialize Firebase App (Modular way) - Keep initialization as before (in initializeChat function)
const app = initializeApp(firebaseConfig); // Initialize app here
let database = getDatabase(app);

// DOM Element Selectors - Updated to include access container elements
const chatroomSelectionContainer = document.getElementById(
  "chatroom-selection-container"
);
const createRoomContainer = document.getElementById("create-room-container");
const joinRoomContainer = document.getElementById("join-room-container");
const createRoomNameInput = document.getElementById("create-room-name-input");
const createRoomPasswordInput = document.getElementById(
  "create-room-password-input"
);
const createRoomButton = document.getElementById("create-room-button");
const joinRoomNameInput = document.getElementById("join-room-name-input");
const joinRoomButton = document.getElementById("join-room-button");
const passwordCheckbox = document.getElementById("password-checkbox");
const passwordCheckboxContainer = document.getElementById(
  "password-checkbox-container"
);
const errorMessageDiv = document.getElementById("error-message");
const accessContainer = document.getElementById("access-container");
const secretCodeInput = document.getElementById("secret-code-input");
const verifyButton = document.getElementById("verify-button");
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const usernameInput = document.getElementById("username-input");

let currentChatroomName = null;

const NETLIFY_FUNCTIONS_BASE_URL = "/.netlify/functions"; // Base URL for Netlify Functions

// --- Initialize Chat (same as before) ---
function initializeChat(chatroomName) {
  currentChatroomName = chatroomName;

  chatroomSelectionContainer.style.display = "none";
  accessContainer.style.display = "none";
  chatContainer.style.display = "block";
  errorMessageDiv.textContent = "";

  // --- Function to send a message (same as before) ---
  function sendMessage() {
    const messageText = messageInput.value.trim();
    const username = usernameInput.value.trim() || "Anonymous";

    if (messageText && currentChatroomName) {
      push(ref(database, `chatrooms/${currentChatroomName}/messages`), {
        username: username,
        text: messageText,
        timestamp: serverTimestamp(),
      });
      messageInput.value = "";
    } else if (!currentChatroomName) {
      alert("Please join or create a chatroom first.");
    }
  }

  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

  // Listen for new messages (same as before)
  const messagesRef = query(
    ref(database, `chatrooms/${currentChatroomName}/messages`),
    orderByChild("timestamp"),
    limitToLast(50)
  );
  onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    if (messageData) {
      displayMessage(messageData);
    }
  });
}

// --- Functions for Chatroom Creation and Joining (Updated for Netlify Functions) ---
async function createChatroom() {
  const roomName = createRoomNameInput.value.trim();
  const setPassword = passwordCheckbox.checked;
  const password = createRoomPasswordInput.value;

  if (!roomName) {
    errorMessageDiv.textContent = "Please enter a chatroom name.";
    return;
  }

  errorMessageDiv.textContent = "Creating chatroom..."; // Indicate loading

  const creationResult = await createChatroomWithPasswordCall(
    roomName,
    setPassword,
    password
  ); // Call Netlify Function

  if (creationResult.success) {
    errorMessageDiv.textContent = creationResult.message; // Success message from function
    createRoomNameInput.value = "";
    createRoomPasswordInput.value = "";
    passwordCheckbox.checked = false;
    createRoomPasswordInput.style.display = "none";
    initializeChat(roomName); // Initialize chat after successful creation
  } else {
    errorMessageDiv.textContent = creationResult.error; // Error message from function
  }
}

async function joinChatroom() {
  const roomName = joinRoomNameInput.value.trim();

  if (!roomName) {
    errorMessageDiv.textContent = "Please enter a chatroom name to join.";
    return;
  }

  errorMessageDiv.textContent = "Checking chatroom...";
  initializeChat(roomName); // Initialize chat immediately

  try {
    const metadataSnapshot = await get(
      ref(database, `chatrooms_metadata/${roomName}`)
    );
    const roomMetadata = metadataSnapshot.val();

    if (roomMetadata && roomMetadata.isPasswordProtected) {
      chatroomSelectionContainer.style.display = "none";
      accessContainer.style.display = "block";
      chatContainer.style.display = "none";
      errorMessageDiv.textContent = "";

      // **Remove any existing event listener first**
      verifyButton.removeEventListener("click", verifyPassword); // Remove previous listener (if any)
      verifyButton.addEventListener("click", verifyPassword); // Add the new listener

      // Set up Verify Button event listener
      async function verifyPassword(event) {
        event.preventDefault();
        const enteredPassword = secretCodeInput.value;
        errorMessageDiv.textContent = "Verifying password...";
        verifyChatCodeCall(enteredPassword, roomName)
          .then(async (verificationResult) => {
            if (verificationResult.success) {
              try {
                console.log("Attempting Firebase sign-in with custom token..."); // BEFORE sign-in
                const auth = getAuth(app); // Get the auth service instance using getAuth(app)
                await signInWithCustomToken(auth, verificationResult.token); // Use signInWithCustomToken(auth, token) and pass the auth instance
                console.log("Firebase authentication SUCCESSFUL!"); // AFTER sign-in success
                const currentUser = auth.currentUser; // Get currentUser from the auth instance
                console.log("Current Firebase User object:", currentUser); // Log the user object in detail
                if (currentUser) {
                  console.log("  User UID:", currentUser.uid);
                  console.log("  User isAnonymous:", currentUser.isAnonymous);
                  // ... any other relevant properties you see in the object in the console
                } else {
                  console.warn(
                    "currentUser is unexpectedly NULL after signInWithCustomToken!"
                  );
                }

                accessContainer.style.display = "none";
                chatContainer.style.display = "block";
                errorMessageDiv.textContent = "";
              } catch (authError) {
                console.error("Firebase authentication ERROR:", authError); // Log detailed auth error
                errorMessageDiv.textContent =
                  "Error authenticating with Firebase.";
              }
            } else {
              errorMessageDiv.textContent =
                verificationResult.error || "Incorrect password.";
            }
          })
          .catch((error) => {
            console.error(
              "Error during password verification (verifyChatCodeCall failed):",
              error
            ); // Log errors from verifyChatCodeCall
            errorMessageDiv.textContent =
              "Error verifying password. Please try again.";
          });
      }
      verifyButton.addEventListener("click", verifyPassword);
    } else {
      // Chatroom is NOT password protected
      errorMessageDiv.textContent = `Joining chatroom: ${roomName}...`;
      chatroomSelectionContainer.style.display = "none";
      accessContainer.style.display = "none";
      chatContainer.style.display = "block";
      errorMessageDiv.textContent = "";
    }
  } catch (error) {
    console.error("Error checking chatroom metadata:", error);
    errorMessageDiv.textContent = "Error checking chatroom. Please try again.";
  }
}

// --- Helper functions to call Netlify Functions ---
async function verifyChatCodeCall(enteredCode, chatroomName) {
  try {
    const response = await fetch(
      `${NETLIFY_FUNCTIONS_BASE_URL}/verifyChatCode?code=${encodeURIComponent(
        enteredCode
      )}&chatroomName=${encodeURIComponent(chatroomName)}`
    );
    if (!response.ok) {
      console.error(
        "Verification failed:",
        response.statusText,
        response.status
      ); // Log response status code
      const errorData = await response.text(); // Extract response text
      console.error("Error response body:", errorData); // Log error response body
      return {
        success: false,
        error: `Verification failed: ${response.statusText} (${response.status}) - ${errorData}`, // Include response body in error message
      };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling verifyChatCode Netlify Function:", error);
    return { success: false, error: "Error verifying password." };
  }
}

async function createChatroomWithPasswordCall(roomName, setPassword, password) {
  try {
    const response = await fetch(
      `${NETLIFY_FUNCTIONS_BASE_URL}/createChatroomWithPassword`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: roomName,
          setPassword: setPassword,
          password: password,
        }),
      }
    );

    if (!response.ok) {
      console.error("Chatroom creation failed:", response.statusText);
      const errorData = await response.json();
      return {
        success: false,
        error:
          errorData.error || `Chatroom creation failed: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "Error calling createChatroomWithPassword Netlify Function:",
      error
    );
    return { success: false, error: "Error creating chatroom." };
  }
}

// --- Event Listeners for Create and Join Buttons ---
createRoomButton.addEventListener("click", createChatroom);
joinRoomButton.addEventListener("click", joinChatroom);

// --- Event Listener for Password Checkbox ---
passwordCheckbox.addEventListener("change", function () {
  if (this.checked) {
    createRoomPasswordInput.style.display = "block";
  } else {
    createRoomPasswordInput.style.display = "none";
  }
});

// --- (displayMessage and formatTimestamp functions - no changes needed) ---
// --- (displayMessage and formatTimestamp functions - no changes needed) ---
function displayMessage(messageData) {
  const messageDiv = document.createElement("div"); // Create a container for the message
  messageDiv.classList.add("message"); // Add class for styling

  const usernameSpan = document.createElement("span");
  usernameSpan.classList.add("message-username");
  usernameSpan.textContent = messageData.username + ":"; // Display username + colon

  const timestampSpan = document.createElement("span");
  timestampSpan.classList.add("message-timestamp");
  const formattedTime = formatTimestamp(messageData.timestamp); // Format the timestamp
  timestampSpan.textContent = formattedTime;

  const textDiv = document.createElement("div");
  textDiv.classList.add("message-text");
  textDiv.textContent = messageData.text;

  messageDiv.appendChild(usernameSpan); // Add username to message container
  messageDiv.appendChild(timestampSpan); // Add timestamp to message container
  messageDiv.appendChild(textDiv); // Add message text to container

  chatBox.appendChild(messageDiv); // Add the whole message container to chat box
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}
function formatTimestamp(timestamp) {
  if (!timestamp) return "—"; // or handle null/undefined timestamps as needed

  const date = new Date(timestamp); // Firebase timestamps are in milliseconds
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`; // HH:MM format (you can customize the format)
}
