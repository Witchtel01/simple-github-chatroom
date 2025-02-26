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

// Function to send a message
function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText) {
        // Push message to Firebase Realtime Database (Modular way)
        push(ref(database, 'messages'), { // Use ref() to create a database reference
            text: messageText,
            timestamp: serverTimestamp() // Use serverTimestamp() for timestamp
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

// Listen for new messages from Firebase (Modular way)
const messagesRef = query(ref(database, 'messages'), orderByChild('timestamp'), limitToLast(50)); // Create a query
onChildAdded(messagesRef, (snapshot) => { // Use onChildAdded with the query
    const messageData = snapshot.val();
    if (messageData) {
        displayMessage(messageData.text);
    }
});

// Function to display a message in the chat box
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom for new messages
}