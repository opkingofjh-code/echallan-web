// ==========================================
// LOGIN PAGE LOGIC (auth.js)
// ==========================================

// Agar already logged in hai → seedha dashboard pe bhej
auth.onAuthStateChanged((user) => {
  if (user) {
    // Check karo current page index.html hai ya nahi
    const path = window.location.pathname;
    if (path.endsWith("index.html") || path.endsWith("/") || path === "") {
      window.location.href = "dashboard.html";
    }
  }
});

// Login form handler
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn = document.getElementById("loginBtn");
    const err = document.getElementById("errorMsg");

    // Reset
    err.textContent = "";
    btn.textContent = "LOGGING IN...";
    btn.disabled = true;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      // Success → onAuthStateChanged automatically dashboard pe bhej dega
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);

      let msg = "Login failed!";
      switch (error.code) {
        case "auth/wrong-password":
          msg = "Galat password!";
          break;
        case "auth/user-not-found":
          msg = "User nahi mila!";
          break;
        case "auth/invalid-email":
          msg = "Invalid email!";
          break;
        case "auth/too-many-requests":
          msg = "Bahut attempts. Thodi der baad try karo.";
          break;
        case "auth/network-request-failed":
          msg = "Internet check karo!";
          break;
        case "auth/invalid-credential":
          msg = "Email ya password galat hai!";
          break;
        default:
          msg = error.message;
      }
      err.textContent = msg;

      btn.textContent = "LOGIN";
      btn.disabled = false;
    }
  });
}
