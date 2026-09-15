// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// Project: echallen-a0522
// Web App: echallan-web

const firebaseConfig = {
  apiKey: "AIzaSyD1AeL4BdWAvpSAMH3KFzyJa4-ycmqUfjo",
  authDomain: "echallen-a0522.firebaseapp.com",
  databaseURL: "https://echallen-a0522-default-rtdb.firebaseio.com",
  projectId: "echallen-a0522",
  storageBucket: "echallen-a0522.firebasestorage.app",
  messagingSenderId: "1098097878799",
  appId: "1:1098097878799:web:99c2f19672da864013807a"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global references
const auth = firebase.auth();
const db = firebase.database();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Protect page — agar login nahi hai toh index.html pe bhejo
function requireAuth() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      const el = document.getElementById("userEmail");
      if (el) el.textContent = user.email;
    }
  });
}

// Logout
function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

// Format timestamp to readable date
function formatTime(ts) {
  if (!ts) return "N/A";
  if (typeof ts === "string") return ts;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Escape HTML for safe display
function escapeHtml(s) {
  if (s === undefined || s === null) return "-";
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// Device online check (last_seen < 5 minutes)
function isDeviceOnline(lastSeen) {
  if (!lastSeen) return false;
  return (Date.now() - lastSeen) < (5 * 60 * 1000);
}

// Short device name (last 4 chars of deviceId)
function shortDeviceName(deviceId) {
  if (!deviceId) return "----";
  return String(deviceId).slice(-4);
}
