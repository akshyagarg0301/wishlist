const API_BASE = "https://wishlist-1-6omc.onrender.com";
const authModal = document.getElementById("auth-modal");
const createModal = document.getElementById("create-modal");

const createUserBtn = document.getElementById("create-user");
const createUserResult = document.getElementById("create-user-result");
const loginBtn = document.getElementById("login-btn");
const loginResult = document.getElementById("login-result");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");

const createEventBtn = document.getElementById("create-event");
const eventTitleInput = document.getElementById("event-title");
const eventDateInput = document.getElementById("event-date");
const eventImageUpload = document.getElementById("event-image-upload");
const eventImagePreview = document.getElementById("event-image-preview");

const myEventCards = document.getElementById("my-event-cards");
const myEventEmpty = document.getElementById("my-event-empty");

const toastContainer = document.getElementById("toast-container");
const progressOverlay = document.getElementById("progress-overlay");
const progressMessage = document.getElementById("progress-message");
const confirmModal = document.getElementById("confirm-modal");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmCancelBtn = document.getElementById("confirm-cancel");
const confirmAcceptBtn = document.getElementById("confirm-accept");

if (eventDateInput) {
  eventDateInput.min = getTodayDateValue();
}

function showModal(modal) {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function showProgress(message = "Working...") {
  if (!progressOverlay) return;
  if (progressMessage) {
    progressMessage.textContent = message;
  }
  progressOverlay.classList.add("show");
  progressOverlay.setAttribute("aria-hidden", "false");
}

function updateProgress(message) {
  if (progressMessage) {
    progressMessage.textContent = message;
  }
}

function hideProgress() {
  if (!progressOverlay) return;
  progressOverlay.classList.remove("show");
  progressOverlay.setAttribute("aria-hidden", "true");
}

function resolveConfirmation(value) {
  hideModal(confirmModal);
  if (confirmResolver) {
    confirmResolver(value);
    confirmResolver = null;
  }
}

function confirmAction({
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
} = {}) {
  if (!confirmModal || !confirmAcceptBtn) {
    return Promise.resolve(window.confirm(message));
  }
  if (confirmTitle) {
    confirmTitle.textContent = title;
  }
  if (confirmMessage) {
    confirmMessage.textContent = message;
  }
  confirmAcceptBtn.textContent = confirmLabel;
  showModal(confirmModal);
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function setAuthResult(el, message, isError = false) {
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include", ...options });
  const text = await response.text();
  if (!response.ok) {
    let message = text || response.statusText;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed && parsed.error) {
        message = parsed.error;
      }
    } catch (err) {
      // Ignore invalid JSON.
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : null;
}

const authAction = document.getElementById("auth-action");
const openCreate2 = document.getElementById("open-create-2");
const getStarted = document.getElementById("get-started");
const closeAuth = document.getElementById("close-auth");
const closeCreate = document.getElementById("close-create");

let isLoggedIn = false;
let eventIndex = new Map();
let myEvents = [];
let confirmResolver = null;
const eventDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function updateAuthAction() {
  if (!authAction) return;
  authAction.textContent = isLoggedIn ? "Sign Out" : "Sign In";
}

function updateLoggedState() {
  document.querySelectorAll("[data-logged-out]").forEach((el) => {
    el.classList.toggle("hidden", isLoggedIn);
  });
  document.querySelectorAll("[data-logged-in]").forEach((el) => {
    el.classList.toggle("hidden", !isLoggedIn);
  });
  if (!isLoggedIn && myEventCards) {
    myEventCards.innerHTML = "";
  }
}

function showToast(message, type = "success") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`.trim();
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function uploadImageFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${API_BASE}/api/upload/image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text || "Upload failed"); });
      }
      return response.json();
    })
    .then(data => data.imageUrl);
}

function resolveImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}

function parseEventDate(value) {
  if (!value || typeof value !== "string") return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatEventDate(value) {
  const date = parseEventDate(value);
  return date ? eventDateFormatter.format(date) : "No date set";
}

function formatGiftCount(count) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return `${safeCount} gift${safeCount === 1 ? "" : "s"} planned`;
}

function formatDaysLeft(item) {
  if (item.expired) return "Expired";
  const daysUntil = item.daysUntilEvent;
  if (daysUntil == null || Number.isNaN(Number(daysUntil))) {
    return "Date pending";
  }
  if (Number(daysUntil) <= 0) {
    return Number(daysUntil) === 0 ? "Today" : "Expired";
  }
  return `${daysUntil} day${Number(daysUntil) === 1 ? "" : "s"} left`;
}

function getEventInitials(title) {
  if (!title) return "EV";
  const parts = title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "EV";
  return parts.map((part) => part[0]).join("").toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMyEvents(items) {
  if (!myEventCards) return;
  myEvents = [...items];
  eventIndex = new Map(items.map((item) => [item.id, item]));
  myEventCards.innerHTML = items
    .map(
      (item) => `
      <article class="event-card" data-event-id="${item.id}">
        <div class="event-main">
          <div class="event-avatar ${item.imageUrl ? "has-image" : ""}">
            <span class="event-avatar-fallback">${escapeHtml(getEventInitials(item.title))}</span>
            ${item.imageUrl
              ? `<img src="${escapeHtml(resolveImageUrl(item.imageUrl))}" alt="${escapeHtml(item.title)}" class="event-avatar-image" onerror="this.remove();this.parentElement.classList.remove('has-image');">`
              : ""}
          </div>
          <div class="event-summary">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="event-date">${escapeHtml(formatEventDate(item.eventDate))}</p>
          </div>
        </div>
        <div class="event-divider"></div>
        <div class="event-footer">
          <div class="event-stats">
            <p class="event-stat"><span class="event-stat-icon" aria-hidden="true">🎁</span><span>${escapeHtml(formatGiftCount(item.giftCount))}</span></p>
            <p class="event-stat"><span class="event-stat-icon" aria-hidden="true">⏳</span><span>${escapeHtml(formatDaysLeft(item))}</span></p>
          </div>
          <div class="actions">
            <button class="ghost danger small event-delete" data-action="delete-event" data-event-id="${item.id}">Delete</button>
          </div>
        </div>
      </article>`
    )
    .join("");
  if (myEventEmpty) {
    myEventEmpty.classList.toggle("hidden", items.length > 0);
  }
}

function appendEvent(item) {
  renderMyEvents([...myEvents, item]);
}

function resetCreateEventForm() {
  if (eventTitleInput) {
    eventTitleInput.value = "";
  }
  if (eventDateInput) {
    eventDateInput.value = "";
  }
  if (eventImageUpload) {
    eventImageUpload.value = "";
  }
  if (eventImagePreview) {
    eventImagePreview.innerHTML = "";
  }
}

async function refreshMyEvents() {
  if (!isLoggedIn || !myEventCards) return;
  try {
    const data = await request("/api/events", {
      headers: {},
    });
    renderMyEvents(data);
  } catch (err) {
    if (myEventEmpty) {
      myEventEmpty.textContent = err.message;
      myEventEmpty.classList.remove("hidden");
    }
  }
}

async function checkAuth() {
  try {
    await request("/api/auth/me");
    isLoggedIn = true;
  } catch (err) {
    isLoggedIn = false;
  }
  updateAuthAction();
  updateLoggedState();
  refreshMyEvents();
}

authAction?.addEventListener("click", async () => {
  if (isLoggedIn) {
    showProgress("Signing out...");
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // ignore logout errors
    } finally {
      hideProgress();
    }
    isLoggedIn = false;
    updateAuthAction();
    updateLoggedState();
    if (myEventEmpty) {
      myEventEmpty.textContent = "You have no events yet. Create one to get started.";
    }
    return;
  }
  showModal(authModal);
});
getStarted?.addEventListener("click", () => showModal(authModal));
openCreate2?.addEventListener("click", () => {
  showModal(createModal);
});


closeAuth?.addEventListener("click", () => hideModal(authModal));
closeCreate?.addEventListener("click", () => hideModal(createModal));
confirmCancelBtn?.addEventListener("click", () => resolveConfirmation(false));
confirmAcceptBtn?.addEventListener("click", () => resolveConfirmation(true));


// No preview needed for event image upload before adding

[authModal, createModal, confirmModal].forEach((modal) => {
  if (!modal) return;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      if (modal === confirmModal) {
        resolveConfirmation(false);
        return;
      }
      hideModal(modal);
    }
  });
});

function setAuthTab(tab) {
  authTabs.forEach((btn) => {
    const isActive = btn.dataset.authTab === tab;
    btn.classList.toggle("active", isActive);
  });
  authPanels.forEach((panel) => {
    panel.hidden = panel.dataset.authPanel !== tab;
  });
  setAuthResult(loginResult, "");
  setAuthResult(createUserResult, "");
}

authTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    setAuthTab(btn.dataset.authTab || "login");
  });
});

setAuthTab("login");
checkAuth();

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  loginResult.textContent = "";
  if (!email || !password) {
    setAuthResult(loginResult, "Email and password required.", true);
    return;
  }
  hideModal(authModal);
  showProgress("Signing in...");
  try {
    await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    isLoggedIn = true;
    updateAuthAction();
    updateLoggedState();
    await refreshMyEvents();
    showToast("Signed in.");
  } catch (err) {
    showModal(authModal);
    setAuthTab("login");
    setAuthResult(loginResult, err.message, true);
  } finally {
    hideProgress();
  }
});

createUserBtn.addEventListener("click", async () => {
  const email = document.getElementById("new-user-email").value.trim();
  const password = document.getElementById("new-user-password").value;
  setAuthResult(createUserResult, "");
  if (!email || !password) {
    setAuthResult(createUserResult, "Email and password required.", true);
    return;
  }
  hideModal(authModal);
  showProgress("Creating account...");
  try {
    await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: email.split("@")[0] || "User", email, password }),
    });
    document.getElementById("new-user-password").value = "";
    document.getElementById("login-email").value = email;
    setAuthTab("login");
    showToast("Account created. You can log in now.");
  } catch (err) {
    showModal(authModal);
    setAuthTab("signup");
    setAuthResult(createUserResult, err.message, true);
  } finally {
    hideProgress();
  }
});

createEventBtn.addEventListener("click", async () => {
  if (!isLoggedIn) {
    showToast("Please log in to create an event.", "error");
    return;
  }
  const title = document.getElementById("event-title").value.trim();
  const eventDate = document.getElementById("event-date").value;
  if (!title) {
    showToast("Event title required.", "error");
    return;
  }
  if (eventDate && eventDate < getTodayDateValue()) {
    showToast("Event date must be today or in the future.", "error");
    return;
  }
  hideModal(createModal);
  showProgress(eventImageUpload && eventImageUpload.files[0] ? "Uploading image..." : "Creating event...");
  try {
    let imageUrl = "";
    if (eventImageUpload && eventImageUpload.files[0]) {
      try {
        imageUrl = await uploadImageFile(eventImageUpload.files[0]);
      } catch (err) {
        imageUrl = "";
        showToast("Image upload failed. Using the default event image.", "error");
      }
      updateProgress("Creating event...");
    }
    const data = await request("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, eventDate: eventDate || null, imageUrl }),
    });
    appendEvent(data);
    resetCreateEventForm();
    showToast("Event added successfully.");
  } catch (err) {
    showModal(createModal);
    showToast(err.message, "error");
  } finally {
    hideProgress();
  }
});

myEventCards?.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest("[data-action='delete-event']");
  if (deleteBtn) {
    event.stopPropagation();
    const id = deleteBtn.dataset.eventId;
    if (!id) return;
    const confirmed = await confirmAction({
      title: "Delete event",
      message: "This event will be removed permanently.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    showProgress("Deleting event...");
    request(`/api/events/${id}`, { method: "DELETE" })
      .then(() => refreshMyEvents())
      .catch((err) => showToast(err.message, "error"))
      .finally(() => hideProgress());
    return;
  }
  const card = event.target.closest("[data-event-id]");
  if (!card) return;
  const id = card.dataset.eventId;
  window.location.href = `/event.html?eventId=${encodeURIComponent(id)}`;
});
