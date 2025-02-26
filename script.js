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
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const chatBox = document.getElementById('chat-box');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  // Function to send a message
  function sendMessage() {
      const messageText = messageInput.value.trim();
      if (messageText) {
          // Push message to Firebase Realtime Database
          database.ref('messages').push({
              text: messageText,
              timestamp: firebase.database.ServerValue.TIMESTAMP // Add timestamp
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
  database.ref('messages').orderByChild('timestamp').limitToLast(50).on('child_added', (snapshot) => {
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