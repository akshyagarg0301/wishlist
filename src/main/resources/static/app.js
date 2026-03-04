const API_BASE = "https://wishlist-1-6omc.onrender.com";
const activeUserEl = document.getElementById("active-user");
const authModal = document.getElementById("auth-modal");
const createModal = document.getElementById("create-modal");

const createUserBtn = document.getElementById("create-user");
const createUserResult = document.getElementById("create-user-result");
const loginBtn = document.getElementById("login-btn");
const loginResult = document.getElementById("login-result");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");

const createOccasionBtn = document.getElementById("create-occasion");

const myOccasionCards = document.getElementById("my-occasion-cards");
const myOccasionEmpty = document.getElementById("my-occasion-empty");

const toastContainer = document.getElementById("toast-container");

function showModal(modal) {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function setActiveUser(id) {
  const trimmed = (id || "").trim();
  localStorage.setItem("activeUserId", trimmed);
  if (activeUserEl) {
    activeUserEl.textContent = trimmed ? trimmed : "Not set";
  }
}

function getActiveUserId() {
  return localStorage.getItem("activeUserId") || "";
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

setActiveUser(getActiveUserId());

const authAction = document.getElementById("auth-action");
const openCreate2 = document.getElementById("open-create-2");
const getStarted = document.getElementById("get-started");
const closeAuth = document.getElementById("close-auth");
const closeCreate = document.getElementById("close-create");

let isLoggedIn = false;
let occasionIndex = new Map();

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
  if (!isLoggedIn && myOccasionCards) {
    myOccasionCards.innerHTML = "";
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

function renderMyOccasions(items) {
  if (!myOccasionCards) return;
  occasionIndex = new Map(items.map((item) => [item.id, item]));
  const covers = ["cover-a", "cover-b", "cover-c"];
  myOccasionCards.innerHTML = items
    .map(
      (item, index) => `
      <article class="wishlist-card" data-occasion-id="${item.id}">
        <div class="wishlist-cover ${covers[index % covers.length]}"></div>
        <div class="wishlist-body">
          <span class="pill">Occasion</span>
          <h3>${item.title}</h3>
          <div class="meta">
            <span>${item.eventDate || "No date"}</span>
          </div>
          <div class="progress"><span style="width: 0%"></span></div>
          <div class="actions">
            <button class="ghost small danger" data-action="delete-occasion" data-occasion-id="${item.id}">Delete</button>
          </div>
        </div>
      </article>`
    )
    .join("");
  if (myOccasionEmpty) {
    myOccasionEmpty.classList.toggle("hidden", items.length > 0);
  }
}

async function refreshMyOccasions() {
  if (!isLoggedIn || !myOccasionCards) return;
  const recipientId = getActiveUserId();
  if (!recipientId) return;
  try {
    const data = await request(`/api/recipients/${recipientId}/occasions`, {
      headers: {},
    });
    renderMyOccasions(data);
  } catch (err) {
    if (myOccasionEmpty) {
      myOccasionEmpty.textContent = err.message;
      myOccasionEmpty.classList.remove("hidden");
    }
  }
}

async function checkAuth() {
  try {
    const data = await request("/api/auth/me");
    setActiveUser(data.userId);
    isLoggedIn = true;
  } catch (err) {
    isLoggedIn = false;
  }
  updateAuthAction();
  updateLoggedState();
  refreshMyOccasions();
}

authAction?.addEventListener("click", async () => {
  if (isLoggedIn) {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // ignore logout errors
    }
    isLoggedIn = false;
    setActiveUser("");
    updateAuthAction();
    updateLoggedState();
    if (myOccasionEmpty) {
      myOccasionEmpty.textContent = "You have no wishlists yet. Create one to get started.";
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

[authModal, createModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
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
  try {
    const data = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setActiveUser(data.userId);
    setAuthResult(loginResult, "Login successful.");
    isLoggedIn = true;
    updateAuthAction();
    updateLoggedState();
    refreshMyOccasions();
    hideModal(authModal);
  } catch (err) {
    setAuthResult(loginResult, err.message, true);
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
  try {
    const data = await request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: email.split("@")[0] || "User", email, password }),
    });
    setAuthResult(createUserResult, "Account created. You can log in now.");
    setAuthTab("login");
  } catch (err) {
    setAuthResult(createUserResult, err.message, true);
  }
});

createOccasionBtn.addEventListener("click", async () => {
  const recipientId = getActiveUserId();
  if (!recipientId) {
    showToast("Please log in to create an occasion.", "error");
    return;
  }
  const title = document.getElementById("occasion-title").value.trim();
  const eventDate = document.getElementById("occasion-date").value;
  const imageUrl = document.getElementById("occasion-image").value.trim();
  if (!title) {
    showToast("Occasion title required.", "error");
    return;
  }
  try {
    const data = await request(`/api/recipients/${recipientId}/occasions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, eventDate: eventDate || null, imageUrl }),
    });
    showToast("Occasion added successfully.");
    await refreshMyOccasions();
  } catch (err) {
    showToast(err.message, "error");
  }
});

myOccasionCards?.addEventListener("click", (event) => {
  const deleteBtn = event.target.closest("[data-action='delete-occasion']");
  if (deleteBtn) {
    event.stopPropagation();
    const id = deleteBtn.dataset.occasionId;
    if (!id) return;
    if (!confirm("Delete this occasion?")) return;
    request(`/api/recipients/${getActiveUserId()}/occasions/${id}`, { method: "DELETE" })
      .then(() => refreshMyOccasions())
      .catch((err) => showToast(err.message, "error"));
    return;
  }
  const card = event.target.closest("[data-occasion-id]");
  if (!card) return;
  const id = card.dataset.occasionId;
  window.location.href = `/occasion.html?occasionId=${encodeURIComponent(id)}`;
});
