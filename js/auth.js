const API_BASE = "http://localhost:5000";

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
  messageDiv.textContent = "";
});

registerTab.addEventListener("click", () => {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerTab.classList.add("border-b-4", "border-blue-500", "text-blue-500");
  loginTab.classList.remove("border-b-4", "border-blue-500", "text-blue-500");
  messageDiv.textContent = "";
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    return showMessage("Please fill in all fields", "text-red-400");
  }

  showMessage("Logging in...", "text-blue-400");
  setLoading(loginForm, true);

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // token এবং username save on localStorage
      localStorage.setItem("echoroom_token", data.token);
      localStorage.setItem("echoroom_username", data.username);

      showMessage("✅ Login successful! Redirecting...", "text-green-400");
      setTimeout(() => (window.location.href = "chat.html"), 1200);
    } else {
      showMessage(data.error || "Login failed", "text-red-400");
      setLoading(loginForm, false);
    }
  } catch (err) {
    showMessage("❌ Server error. Is backend running?", "text-red-400");
    setLoading(loginForm, false);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!username || !email || !password) {
    return showMessage("Please fill in all fields", "text-red-400");
  }

  if (password.length < 6) {
    return showMessage(
      "Password must be at least 6 characters",
      "text-red-400",
    );
  }

  showMessage("Creating account...", "text-blue-400");
  setLoading(registerForm, true);

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("✅ Account created! Please login.", "text-green-400");
      registerForm.reset();
      setTimeout(() => loginTab.click(), 1000);
    } else {
      showMessage(data.error || "Registration failed", "text-red-400");
    }
  } catch (err) {
    showMessage("❌ Server error. Is backend running?", "text-red-400");
  } finally {
    setLoading(registerForm, false);
  }
});

function showMessage(text, color) {
  messageDiv.textContent = text;
  messageDiv.className = `mt-6 text-center text-sm font-medium ${color}`;
}

function setLoading(form, isLoading) {
  const btn = form.querySelector("button[type='submit']");
  if (!btn) return;
  btn.disabled = isLoading;
  if (isLoading) btn.dataset.label = btn.textContent;
  btn.textContent = isLoading ? "Please wait..." : btn.dataset.label;
  btn.classList.toggle("opacity-60", isLoading);
  btn.classList.toggle("cursor-not-allowed", isLoading);
}

// Already logged in check
(async function checkAlreadyLoggedIn() {
  const token = localStorage.getItem("echoroom_token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) window.location.href = "chat.html";
  } catch {}
})();
