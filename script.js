// Import Firebase modules (Modular SDK) - Keep imports as before
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, serverTimestamp, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";

// Firebase configuration (Replace with your actual config) - Keep config as before
const firebaseConfig = {
    apiKey: "AIzaSyB2W99M0O5ZzFqOilrVTyhjRCsvjxpZgI8",
    authDomain: "simple-github-chatroom-109.firebaseapp.com",
    projectId: "simple-github-chatroom-109",
    storageBucket: "simple-github-chatroom-109.firebasestorage.app",
    messagingSenderId: "207217285359",
    appId: "1:207217285359:web:76b6b4c2acd7cbdf16231a",
    measurementId: "G-NLHVVGCDH5"
  };


// Initialize Firebase App (Modular way) - Keep initialization as before (in initializeChat function)
let app;
let database;

// DOM Element Selectors - Updated to include new UI elements
const chatroomSelectionContainer = document.getElementById('chatroom-selection-container');
const createRoomContainer = document.getElementById('create-room-container');
const joinRoomContainer = document.getElementById('join-room-container');
const createRoomNameInput = document.getElementById('create-room-name-input');
const createRoomPasswordInput = document.getElementById('create-room-password-input');
const createRoomButton = document.getElementById('create-room-button');
const joinRoomNameInput = document.getElementById('join-room-name-input');
const joinRoomButton = document.getElementById('join-room-button');
const passwordCheckbox = document.getElementById('password-checkbox');
const passwordCheckboxContainer = document.getElementById('password-checkbox-container'); // Select the container
const errorMessageDiv = document.getElementById('error-message');
const accessContainer = document.getElementById('access-container'); // Access code container
const secretCodeInput = document.getElementById('secret-code-input'); // Access code input
const verifyButton = document.getElementById('verify-button'); // Access code verify button

const chatContainer = document.getElementById('chat-container');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameInput = document.getElementById('username-input');


let currentChatroomName = null; // To store the name of the currently joined chatroom

// --- Initialize Chat (same as before, but now takes chatroomName) ---
function initializeChat(chatroomName) {
    if (!app) {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
    }

    currentChatroomName = chatroomName; // Set the current chatroom name

    chatroomSelectionContainer.style.display = 'none'; // Hide room selection
    accessContainer.style.display = 'none';          // Hide access code (password) container (initially)
    chatContainer.style.display = 'block';         // Show chat container
    errorMessageDiv.textContent = '';              // Clear any error messages

    // --- Function to send a message (updated to use chatroomName) ---
    function sendMessage() {
        const messageText = messageInput.value.trim();
        const username = usernameInput.value.trim() || 'Anonymous';

        if (messageText && currentChatroomName) { // Check if chatroomName is set
            push(ref(database, `chatrooms/${currentChatroomName}/messages`), { // Use chatroomName in path
                username: username,
                text: messageText,
                timestamp: serverTimestamp()
            });
            messageInput.value = '';
        } else if (!currentChatroomName) {
            alert("Please join or create a chatroom first."); // Basic error if no chatroom selected
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Listen for new messages (updated to use chatroomName)
    const messagesRef = query(ref(database, `chatrooms/${currentChatroomName}/messages`), orderByChild('timestamp'), limitToLast(50));
    onChildAdded(messagesRef, (snapshot) => {
        const messageData = snapshot.val();
        if (messageData) {
            displayMessage(messageData);
        }
    });
}

// --- Functions for Chatroom Creation and Joining (Placeholder for now) ---
async function createChatroom() {
    const roomName = createRoomNameInput.value.trim();
    const setPassword = passwordCheckbox.checked;
    const password = createRoomPasswordInput.value;

    if (!roomName) {
        errorMessageDiv.textContent = "Please enter a chatroom name.";
        return;
    }

    // --- Placeholder for backend call to create chatroom ---
    alert(`Creating chatroom: ${roomName}, Password Protected: ${setPassword}`); // Replace with actual function call later

    // For now, just initialize chat directly (without actual creation logic yet) - REPLACE THIS LATER
    initializeChat(roomName);
}

async function joinChatroom() {
    const roomName = joinRoomNameInput.value.trim();

    if (!roomName) {
        errorMessageDiv.textContent = "Please enter a chatroom name to join.";
        return;
    }

    // --- Placeholder for backend call to check and join chatroom ---
    alert(`Joining chatroom: ${roomName}`); // Replace with actual function call later

    // For now, just initialize chat directly (without actual joining logic yet) - REPLACE THIS LATER
    initializeChat(roomName);
}


// --- Event Listeners for Create and Join Buttons ---
createRoomButton.addEventListener('click', createChatroom);
joinRoomButton.addEventListener('click', joinChatroom);


// --- Event Listener for Password Checkbox to show/hide password input ---
passwordCheckbox.addEventListener('change', function() {
    if (this.checked) {
        createRoomPasswordInput.style.display = 'block';
    } else {
        createRoomPasswordInput.style.display = 'none';
    }
});


// --- (displayMessage and formatTimestamp functions - no changes needed) ---
function displayMessage(messageData) {
    const messageDiv = document.createElement('div'); // Create a container for the message
    messageDiv.classList.add('message'); // Add class for styling

    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('message-username');
    usernameSpan.textContent = messageData.username + ":"; // Display username + colon

    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('message-timestamp');
    const formattedTime = formatTimestamp(messageData.timestamp); // Format the timestamp
    timestampSpan.textContent = formattedTime;

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');
    textDiv.textContent = messageData.text;

    messageDiv.appendChild(usernameSpan);    // Add username to message container
    messageDiv.appendChild(timestampSpan);   // Add timestamp to message container
    messageDiv.appendChild(textDiv);         // Add message text to container

    chatBox.appendChild(messageDiv);        // Add the whole message container to chat box
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}
function formatTimestamp(timestamp) {
    if (!timestamp) return "—"; // or handle null/undefined timestamps as needed

    const date = new Date(timestamp); // Firebase timestamps are in milliseconds
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`; // HH:MM format (you can customize the format)
}