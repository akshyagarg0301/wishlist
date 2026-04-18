const API_BASE = "https://wishlist-1-6omc.onrender.com";
const authModal = document.getElementById("auth-modal");
const createModal = document.getElementById("create-modal");

const createUserBtn = document.getElementById("create-user");
const createUserResult = document.getElementById("create-user-result");
const loginBtn = document.getElementById("login-btn");
const loginResult = document.getElementById("login-result");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");

const createOccasionBtn = document.getElementById("create-occasion");
const occasionTitleInput = document.getElementById("occasion-title");
const occasionDateInput = document.getElementById("occasion-date");
const occasionImageUpload = document.getElementById("occasion-image-upload");
const occasionImagePreview = document.getElementById("occasion-image-preview");

const myOccasionCards = document.getElementById("my-occasion-cards");
const myOccasionEmpty = document.getElementById("my-occasion-empty");

const toastContainer = document.getElementById("toast-container");

if (occasionDateInput) {
  occasionDateInput.min = getTodayDateValue();
}

function showModal(modal) {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
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
let occasionIndex = new Map();
let myOccasions = [];

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

function renderMyOccasions(items) {
  if (!myOccasionCards) return;
  myOccasions = [...items];
  occasionIndex = new Map(items.map((item) => [item.id, item]));
  myOccasionCards.innerHTML = items
    .map(
      (item, index) => `
      <article class="wishlist-card" data-occasion-id="${item.id}">
        <div class="wishlist-cover">
          ${item.imageUrl ? `<img src="${resolveImageUrl(item.imageUrl)}" alt="${item.title}" class="occasion-image">` : `<div class="cover-${["a", "b", "c"][index % 3]}"></div>`}
        </div>
        <div class="wishlist-body">
          <span class="pill">${item.expired ? "Expired" : "Occasion"}</span>
          <h3>${item.title}</h3>
          <div class="meta">
            <span>${item.eventDate || "No date"}${item.expired ? " · Expired" : ""}</span>
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

function appendOccasion(item) {
  renderMyOccasions([...myOccasions, item]);
}

function resetCreateOccasionForm() {
  if (occasionTitleInput) {
    occasionTitleInput.value = "";
  }
  if (occasionDateInput) {
    occasionDateInput.value = "";
  }
  if (occasionImageUpload) {
    occasionImageUpload.value = "";
  }
  if (occasionImagePreview) {
    occasionImagePreview.innerHTML = "";
  }
}

async function refreshMyOccasions() {
  if (!isLoggedIn || !myOccasionCards) return;
  try {
    const data = await request("/api/occasions", {
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
    await request("/api/auth/me");
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


// No preview needed for occasion image upload before adding

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
  if (!isLoggedIn) {
    showToast("Please log in to create an occasion.", "error");
    return;
  }
  const title = document.getElementById("occasion-title").value.trim();
  const eventDate = document.getElementById("occasion-date").value;
  
  // Handle image upload if file is selected
  let imageUrl = "";
  if (occasionImageUpload && occasionImageUpload.files[0]) {
    try {
      showToast("Uploading image...", "success");
      imageUrl = await uploadImageFile(occasionImageUpload.files[0]);
    } catch (err) {
      showToast("Failed to upload image: " + err.message, "error");
      return;
    }
  }
  
  if (!title) {
    showToast("Occasion title required.", "error");
    return;
  }
  if (eventDate && eventDate < getTodayDateValue()) {
    showToast("Event date must be today or in the future.", "error");
    return;
  }
  try {
    const data = await request("/api/occasions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, eventDate: eventDate || null, imageUrl }),
    });
    appendOccasion(data);
    resetCreateOccasionForm();
    hideModal(createModal);
    showToast("Occasion added successfully.");
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
    request(`/api/occasions/${id}`, { method: "DELETE" })
      .then(() => refreshMyOccasions())
      .catch((err) => showToast(err.message, "error"));
    return;
  }
  const card = event.target.closest("[data-occasion-id]");
  if (!card) return;
  const id = card.dataset.occasionId;
  window.location.href = `/occasion.html?occasionId=${encodeURIComponent(id)}`;
});
