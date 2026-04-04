const API_BASE = "http://localhost:5000";
let ws = null;
let currentRoom = "general";
let username = "You";

// Auth headers helper
function authHeaders() {
  const token = localStorage.getItem("echoroom_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const currentRoomName = document.getElementById("currentRoomName");
const usernameDisplay = document.getElementById("usernameDisplay");
const roomList = document.getElementById("roomList");
const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
const sidebar = document.getElementById("sidebar");
const newRoomBtn = document.getElementById("newRoomBtn");

menuBtn.addEventListener("click", () =>
  sidebar.classList.remove("-translate-x-full"),
);
closeMenu.addEventListener("click", () =>
  sidebar.classList.add("-translate-x-full"),
);

async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/api/rooms`, {
      headers: authHeaders(),
    });
    if (res.status === 401) {
      localStorage.removeItem("echoroom_token");
      localStorage.removeItem("echoroom_username");
      window.location.href = "index.html";
      return false;
    }
    const rooms = await res.json();
    renderRooms(rooms);
    return true;
  } catch {
    window.location.href = "index.html";
    return false;
  }
}

function renderRooms(rooms) {
  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      room.roomId === currentRoom
        ? "sidebar-item-active group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-200 transition-all"
        : "group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all";
    a.innerHTML = `<span class="text-slate-600 group-hover:text-slate-400 font-semibold">#</span>
                   <span class="font-medium">${room.name}</span>`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      joinRoom(room.roomId, room.name, a);
      sidebar.classList.add("-translate-x-full");
    });
    roomList.appendChild(a);
  });
}

function joinRoom(roomId, roomName, clickedEl) {
  currentRoom = roomId;
  currentRoomName.innerHTML = `<span class="text-indigo-500">#</span> ${roomName}`;
  messagesDiv.innerHTML = "";

  if (ws?.readyState === 1) {
    ws.send(JSON.stringify({ type: "join", roomId }));
  }

  document.querySelectorAll("#roomList a").forEach((el) => {
    el.className =
      "group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all";
  });
  if (clickedEl) {
    clickedEl.className =
      "sidebar-item-active group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-200 transition-all";
  }
}

newRoomBtn.addEventListener("click", async () => {
  const roomName = prompt("New room name:");
  if (!roomName?.trim()) return;

  try {
    const res = await fetch(`${API_BASE}/api/rooms`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: roomName }),
    });
    const newRoom = await res.json();
    if (res.ok) {
      const rooms = await (
        await fetch(`${API_BASE}/api/rooms`, { headers: authHeaders() })
      ).json();
      renderRooms(rooms);
      joinRoom(newRoom.roomId, newRoom.name, null);
    } else {
      alert(newRoom.error || "Failed to create room");
    }
  } catch {
    alert("Server error");
  }
});

function connectWebSocket() {
  const token = localStorage.getItem("echoroom_token");
  ws = new WebSocket(`ws://localhost:5000?token=${token}`);

  ws.onopen = () => {
    console.log("✅ WebSocket Connected");
    ws.send(JSON.stringify({ type: "join", roomId: currentRoom }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "history") {
        messagesDiv.innerHTML = "";
        data.messages.forEach(addMessageToUI);
      } else if (data.type === "message") {
        addMessageToUI(data);
      }
    } catch {}
  };

  ws.onclose = () => {
    console.log("Reconnecting...");
    setTimeout(connectWebSocket, 3000);
  };
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addMessageToUI(data) {
  const isOwn = data.username === username;
  const time = data.createdAt ? formatTime(data.createdAt) : "Just now";
  const div = document.createElement("div");
  div.className = isOwn
    ? "flex items-start gap-4 max-w-3xl ml-auto flex-row-reverse message-animate"
    : "flex items-start gap-4 max-w-3xl message-animate";

  div.innerHTML = isOwn
    ? `<div class="space-y-1 text-right">
        <div class="flex items-center gap-3 justify-end">
          <span class="text-[10px] text-slate-500">${time}</span>
          <span class="text-sm font-bold">${data.username}</span>
        </div>
        <div class="chat-bubble-me p-4 rounded-2xl rounded-tr-none text-white">${data.message}</div>
      </div>`
    : `<img src="https://ui-avatars.com/api/?name=${data.username}&background=random&color=fff" class="w-10 h-10 rounded-2xl" alt="">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold">${data.username}</span>
          <span class="text-[10px] text-slate-500">${time}</span>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-300">${data.message}</div>
      </div>`;

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  if (!messageInput.value.trim() || ws?.readyState !== 1) return;
  ws.send(
    JSON.stringify({ type: "message", message: messageInput.value.trim() }),
  );
  messageInput.value = "";
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

window.onload = async () => {
  lucide.createIcons();

  if (!localStorage.getItem("echoroom_token")) {
    window.location.href = "index.html";
    return;
  }

  const savedName = localStorage.getItem("echoroom_username");
  if (savedName) {
    username = savedName;
    usernameDisplay.textContent = username;
  }

  const ok = await checkAuth();
  if (ok) {
    connectWebSocket();
    messageInput.focus();
  }
};
