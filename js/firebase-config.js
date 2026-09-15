// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// Project: echallen-a0522
// Web App: echallan-web

const firebaseConfig = {
  apiKey: "AIzaSyD1AeL4BdWAVpSAMH3KFzyJa4-ycmqUfjo",
  authDomain: "echallen-a0522.firebaseapp.com",
  databaseURL: "https://echallen-a0522-default-rtdb.firebaseio.com",
  projectId: "echallen-a0522",
  storageBucket: "echallen-a0522.firebasestorage.app",
  messagingSenderId: "1098097878799",
  appId: "1:1098097878799:web:99c2f19672da064013807a"
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

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

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

function isDeviceOnline(lastSeen) {
  if (!lastSeen) return false;
  return (Date.now() - lastSeen) < (5 * 60 * 1000);
}

function shortDeviceName(deviceId) {
  if (!deviceId) return "----";
  return String(deviceId).slice(-4);
}
