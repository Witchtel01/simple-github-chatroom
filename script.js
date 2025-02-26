// Import Firebase modules (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, serverTimestamp, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";

// Firebase configuration (Replace with your actual config from Firebase project settings)
const firebaseConfig = {
    apiKey: "AIzaSyB2W99M0O5ZzFqOilrVTyhjRCsvjxpZgI8",
    authDomain: "simple-github-chatroom-109.firebaseapp.com",
    projectId: "simple-github-chatroom-109",
    storageBucket: "simple-github-chatroom-109.firebasestorage.app",
    messagingSenderId: "207217285359",
    appId: "1:207217285359:web:76b6b4c2acd7cbdf16231a",
    measurementId: "G-NLHVVGCDH5"
  };
// Initialize Firebase App (Modular way)
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Get Realtime Database instance

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameInput = document.getElementById('username-input'); // Get username input

// Function to send a message
function sendMessage() {
    const messageText = messageInput.value.trim();
    const username = usernameInput.value.trim() || 'Anonymous'; // Get username, default to 'Anonymous' if empty

    if (messageText) {
        // Push message to Firebase Realtime Database with username and timestamp
        push(ref(database, 'messages'), {
            username: username,      // Add username
            text: messageText,
            timestamp: serverTimestamp()
        });
        messageInput.value = ''; // Clear input after sending
    }
}

// Event listener for send button
sendButton.addEventListener('click', sendMessage);

// Event listener for Enter key in input field
messageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Listen for new messages from Firebase
const messagesRef = query(ref(database, 'messages'), orderByChild('timestamp'), limitToLast(50));
onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    if (messageData) {
        displayMessage(messageData); // Pass the whole messageData object
    }
});

// Function to display a message in the chat box (now takes messageData)
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

// Function to format timestamp (you can customize this)
function formatTimestamp(timestamp) {
    if (!timestamp) return "—"; // or handle null/undefined timestamps as needed

    const date = new Date(timestamp); // Firebase timestamps are in milliseconds
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`; // HH:MM format (you can customize the format)
}