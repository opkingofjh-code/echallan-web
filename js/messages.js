// ==========================================
// MESSAGES PAGE LOGIC
// ==========================================
requireAuth();

let allDevices = [];
let currentMessages = [];
let currentFilter = "all";
let currentDeviceId = "";

// ==========================================
// LOAD DEVICE LIST FOR DROPDOWN
// ==========================================
db.ref("device_info").on("value", (snap) => {
  const data = snap.val() || {};
  allDevices = Object.keys(data).map((id) => ({
    id: id,
    serial: data[id].serial_number || 0,
    name: "Device " + (data[id].serial_number || id.slice(-4))
  }));
  allDevices.sort((a, b) => (b.serial || 0) - (a.serial || 0));

  const sel = document.getElementById("deviceSelect");
  const oldVal = sel.value;
  sel.innerHTML = '<option value="">-- Select Device --</option>' +
    allDevices.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");

  if (oldVal && allDevices.find((d) => d.id === oldVal)) {
    sel.value = oldVal;
    loadMessages(oldVal);
  }
});

// ==========================================
// ON DEVICE CHANGE
// ==========================================
function onDeviceChange() {
  const id = document.getElementById("deviceSelect").value;
  if (!id) {
    currentMessages = [];
    currentDeviceId = "";
    renderMessages();
    return;
  }
  loadMessages(id);
}

// ==========================================
// LOAD MESSAGES FROM SMS_COMMANDS NODE
// ==========================================
function loadMessages(deviceId) {
  currentDeviceId = deviceId;
  document.getElementById("messageList").innerHTML =
    '<div class="loading">Loading messages...</div>';

  db.ref("sms_commands/" + deviceId).on("value", (snap) => {
    const data = snap.val() || {};
    currentMessages = Object.keys(data).map((k) => ({
      key: k,
      ...data[k]
    }));

    // Latest first
    currentMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    renderMessages();
  });
}

// ==========================================
// FILTER TABS
// ==========================================
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".filter-tabs button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  filterMessages();
}

// ==========================================
// SEARCH FILTER
// ==========================================
function filterMessages() {
  renderMessages();
}

// ==========================================
// RENDER MESSAGES
// ==========================================
function renderMessages() {
  const search = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  const listEl = document.getElementById("messageList");

  let msgs = currentMessages.slice();

  // Filter by type
  if (currentFilter === "sent") {
    msgs = msgs.filter((m) => m.direction === "out" || m.status === "sent");
  } else if (currentFilter === "incoming") {
    msgs = msgs.filter((m) => m.direction !== "out" && m.status !== "sent");
  }

  // Filter by search
  if (search) {
    msgs = msgs.filter((m) =>
      String(m.message || m.body || "").toLowerCase().includes(search) ||
      String(m.target_number || m.from || "").toLowerCase().includes(search)
    );
  }

  document.getElementById("msgCount").textContent = msgs.length + " messages";

  if (msgs.length === 0) {
    listEl.innerHTML = '<div class="empty-state" style="color:rgba(255,255,255,0.7);text-align:center;padding:40px 20px;">Koi message nahi mila.</div>';
    return;
  }

  listEl.innerHTML = msgs.map((m) => {
    const isSent = m.direction === "out" || m.status === "sent";
    const fromTo = m.target_number || m.from || "-";
    const body = m.message || m.body || "-";
    const sim = m.sim_slot ? "SIM " + m.sim_slot : "";

    return `
      <div class="msg-item ${isSent ? 'sent' : ''}">
        <div class="msg-header">
          <span>
            <span class="msg-tag ${isSent ? 'tag-out' : 'tag-in'}">
              ${isSent ? '📤 SENT' : '📩 RECEIVED'}
            </span>
            ${sim ? `· ${sim}` : ""}
          </span>
          <span>${formatTime(m.timestamp)}</span>
        </div>
        <div style="font-size:12px;color:#800000;font-weight:700;margin-bottom:6px;">
          ${isSent ? "To" : "From"}: ${escapeHtml(fromTo)}
        </div>
        <div class="msg-body">${escapeHtml(body)}</div>
      </div>
    `;
  }).join("");
}

// ==========================================
// MODAL CONTROLS (agar future mein chahiye)
// ==========================================
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}
