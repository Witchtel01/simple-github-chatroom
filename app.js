// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2W99M0O5ZzFqOilrVTyhjRCsvjxpZgI8",
  authDomain: "simple-github-chatroom-109.firebaseapp.com",
  databaseURL: "https://simple-github-chatroom-109-default-rtdb.firebaseio.com",
  projectId: "simple-github-chatroom-109",
  storageBucket: "simple-github-chatroom-109.firebasestorage.app",
  messagingSenderId: "207217285359",
  appId: "1:207217285359:web:76b6b4c2acd7cbdf16231a",
  measurementId: "G-NLHVVGCDH5"
};
// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables for encryption and chat configuration
let encryptionKey = null;
let currentRoom = "";
let displayName = "";

// Event listener for joining the chat
document.getElementById("joinBtn").addEventListener("click", async () => {
  displayName = document.getElementById("displayName").value.trim();
  const roomId = document.getElementById("roomId").value.trim();
  const passphrase = document.getElementById("passphrase").value;

  if (!displayName || !roomId || !passphrase) {
    alert("Please fill in all fields.");
    return;
  }

  currentRoom = roomId;
  // Derive an AES-GCM key from the passphrase and room ID (used as salt)
  encryptionKey = await deriveKey(passphrase, roomId);

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("chatScreen").style.display = "flex";
  document.getElementById("roomTitle").textContent = roomId;

  loadMessages();
});

// Event listener for sending a message
document.getElementById("sendBtn").addEventListener("click", async () => {
  const messageInput = document.getElementById("messageInput");
  const plainText = messageInput.value.trim();
  if (!plainText) return;

  // Encrypt the message using the derived key
  const encryptedMessage = await encryptMessage(plainText, encryptionKey);

  // Save the encrypted message to Firestore under the current room
  await addDoc(collection(db, "rooms", currentRoom, "messages"), {
    sender: displayName,
    encryptedMessage: encryptedMessage,
    timestamp: serverTimestamp(),
  });
  messageInput.value = "";
});

// Send message on enter
document.getElementById("messageInput").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const messageInput = document.getElementById("messageInput");
    const plainText = messageInput.value.trim();
    if (!plainText) return;
    
    // Encrypt the message using the derived key
    const encryptedMessage = await encryptMessage(plainText, encryptionKey);
    
    // Save the encrypted message to Firestore under the current room
    await addDoc(collection(db, "rooms", currentRoom, "messages"), {
      sender: displayName,
      encryptedMessage: encryptedMessage,
      timestamp: serverTimestamp()
    });
    
    messageInput.value = "";
  }
});

// Listen for new messages in the current room and decrypt them for display
function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  const q = query(
    collection(db, "rooms", currentRoom, "messages"),
    orderBy("timestamp")
  );

  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(async (doc) => {
      const data = doc.data();
      let decryptedText = "";
      try {
        decryptedText = await decryptMessage(
          data.encryptedMessage,
          encryptionKey
        );
      } catch (e) {
        decryptedText = "[Unable to decrypt message]";
      }
      const messageElem = document.createElement("div");
      // Use different classes for your messages vs. others
      if (data.sender === displayName) {
        messageElem.classList.add("message", "mine");
      } else {
        messageElem.classList.add("message", "theirs");
      }
      messageElem.innerHTML = `<div class="sender">${data.sender}</div><div class="text">${decryptedText}</div>`;
      messagesDiv.appendChild(messageElem);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  });
}

// Utility: Derive an AES-GCM key from a passphrase and salt (room ID)
async function deriveKey(passphrase, saltText) {
  const enc = new TextEncoder();
  const salt = enc.encode(saltText);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Utility: Encrypt a plain text message using AES-GCM
async function encryptMessage(plainText, key) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(plainText)
  );

  // Prepend the IV to the ciphertext so it can be used during decryption
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength);

  // Return the combined data as a Base64 string
  return btoa(String.fromCharCode(...combined));
}

// Utility: Decrypt an encrypted message (Base64 string) using AES-GCM
async function decryptMessage(ciphertextB64, key) {
  const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipherText = combined.slice(12);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    cipherText
  );
  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
