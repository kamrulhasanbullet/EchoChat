const API_BASE = "http://localhost:3000";

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const messageDiv = document.getElementById("message");

loginTab.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  loginTab.classList.add("border-b-4", "border-blue-500", "text-blue-500");
  registerTab.classList.remove(
    "border-b-4",
    "border-blue-500",
    "text-blue-500",
  );
});

registerTab.addEventListener("click", () => {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerTab.classList.add("border-b-4", "border-blue-500", "text-blue-500");
  loginTab.classList.remove("border-b-4", "border-blue-500", "text-blue-500");
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  showMessage("Logging in...", "text-blue-400");

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include", 
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("✅ Login successful! Redirecting...", "text-green-400");
      setTimeout(() => (window.location.href = "chat.html"), 1200);
    } else {
      showMessage(data.error || "Login failed", "text-red-400");
    }
  } catch (err) {
    showMessage("Server error. Is backend running?", "text-red-400");
  }
});

// Register
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  showMessage("Creating account...", "text-blue-400");

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("✅ Account created! Please login.", "text-green-400");
      // Switch to login tab
      loginTab.click();
    } else {
      showMessage(data.error || "Registration failed", "text-red-400");
    }
  } catch (err) {
    showMessage("Server error", "text-red-400");
  }
});

function showMessage(text, color) {
  messageDiv.textContent = text;
  messageDiv.className = `mt-6 text-center text-sm font-medium ${color}`;
}
