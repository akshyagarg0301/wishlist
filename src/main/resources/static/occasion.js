const API_BASE = "https://wishlist-1-6omc.onrender.com";
const toastContainer = document.getElementById("toast-container");
const occasionPillEl = document.getElementById("occasion-pill");
const titleEl = document.getElementById("occasion-title");
const dateEl = document.getElementById("occasion-date");
const expiredNoteEl = document.getElementById("expired-note");
const newGiftBtn = document.getElementById("new-gift-btn");
const ownerControls = document.getElementById("owner-controls");
const revealBuyersBtn = document.getElementById("reveal-buyers");
const revealHint = document.getElementById("reveal-hint");
const guestControls = document.getElementById("guest-controls");
const guestAuthModal = document.getElementById("guest-auth-modal");
const closeGuestAuth = document.getElementById("close-guest-auth");
const googleSignInEl = document.getElementById("google-signin");
const giftModal = document.getElementById("gift-modal");
const shareSection = document.getElementById("share-section");
const shareLinkInput = document.getElementById("occasion-share-link");
const copyShareBtn = document.getElementById("copy-share-link");
const shareWhatsappBtn = document.getElementById("share-whatsapp");
const closeGift = document.getElementById("close-gift");
const ownerGiftList = document.getElementById("owner-gift-list");
const ownerGiftEmpty = document.getElementById("owner-gift-empty");
const guestGiftList = document.getElementById("guest-gift-list");
const guestGiftEmpty = document.getElementById("guest-gift-empty");
const giftName = document.getElementById("gift-name");
const giftDescription = document.getElementById("gift-description");
const giftImage = document.getElementById("gift-image");
const giftLink = document.getElementById("gift-link");
const createGiftBtn = document.getElementById("create-gift");

let occasionId = "";
let isOwner = false;
let guestVerified = false;
let occasionData = null;
let guestName = "";
let guestEmail = "";
let googlePromptShown = false;
let ownerGiftItems = [];
let guestGiftItems = [];

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

function showModal(modal) {
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function setFieldError(input, hasError) {
  if (!input) return;
  input.classList.toggle("input-error", hasError);
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
      // ignore
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : null;
}

function renderOwnerGifts(items) {
  if (!ownerGiftList || !ownerGiftEmpty) return;
  ownerGiftItems = [...items];
  if (!items.length) {
    ownerGiftList.innerHTML = "";
    ownerGiftEmpty.textContent = isOccasionExpired()
      ? "This occasion is expired. It can only be deleted."
      : "No gifts added yet. Click \"+ New Gift\" to add your first item.";
    ownerGiftEmpty.classList.remove("hidden");
    return;
  }
  ownerGiftEmpty.classList.add("hidden");
  ownerGiftList.innerHTML = items
    .map((item) => {
      const buyerLabel =
        item.status === "AVAILABLE"
          ? "Available"
          : item.buyerName
            ? `Buyer: ${item.buyerName}`
            : "Buyer hidden";
      const link = ensureAbsoluteUrl(item.purchaseLink);
      return `
      <a class="gift-card-link" href="${link || "#"}" target="_blank" rel="noopener noreferrer" ${link ? "" : "aria-disabled=\"true\""}>
        <div class="gift-card ${item.status === "PURCHASED" ? "purchased" : ""}">
          <div class="gift-thumb gold"></div>
          <div class="gift-info">
            <h4>${item.name}</h4>
            <p>${item.description || "No description"}</p>
            <div class="hint">${buyerLabel}</div>
            ${
              isOccasionExpired()
                ? ""
                : `<div class="actions">
                    <button class="ghost small danger" data-action="delete-gift" data-gift-id="${item.id}">Delete</button>
                  </div>`
            }
          </div>
          <div class="price">${item.status}</div>
        </div>
      </a>`;
    })
    .join("");
}

function renderGuestGifts(items) {
  if (!guestGiftList || !guestGiftEmpty) return;
  guestGiftItems = [...items];
  if (!items.length) {
    guestGiftList.innerHTML = "";
    guestGiftEmpty.classList.remove("hidden");
    return;
  }
  guestGiftEmpty.classList.add("hidden");
  guestGiftList.innerHTML = items
    .map(
      (item) => `
      <div class="gift-card ${item.status === "PURCHASED" ? "purchased" : ""}" data-link="${ensureAbsoluteUrl(item.purchaseLink) || ""}" data-status="${item.status}">
        <div class="gift-thumb gold"></div>
        <div class="gift-info">
          <h4>${item.name}</h4>
          <p>${item.description || "No description"}</p>
          ${
            item.status === "AVAILABLE"
              ? `<div class="actions">
                  <button class="ghost small" data-action="reserve" data-gift-id="${item.id}" ${!guestVerified ? "disabled" : ""}>Reserve</button>
                  <button class="primary small" data-action="purchase" data-gift-id="${item.id}" ${!guestVerified ? "disabled" : ""}>Mark Purchased</button>
                </div>`
              : `<div class="hint">This item is ${item.status.toLowerCase()}.</div>`
          }
        </div>
        <div class="price">${item.status}</div>
      </div>`
    )
    .join("");
}

function ensureAbsoluteUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function appendOwnerGift(item) {
  renderOwnerGifts([...ownerGiftItems, item]);
}

function resetGiftForm() {
  if (giftName) {
    giftName.value = "";
  }
  if (giftDescription) {
    giftDescription.value = "";
  }
  if (giftImage) {
    giftImage.value = "";
  }
  if (giftLink) {
    giftLink.value = "";
  }
}

ownerGiftList?.addEventListener("click", (event) => {
  const deleteBtn = event.target.closest("[data-action='delete-gift']");
  if (!deleteBtn) return;
  event.preventDefault();
  if (isOccasionExpired()) {
    showToast("Expired occasions can only be deleted", "error");
    return;
  }
  const giftId = deleteBtn.dataset.giftId;
  if (!giftId) return;
  if (!confirm("Delete this gift item?")) return;
  request(`/api/gifts/${giftId}`, { method: "DELETE" })
    .then(() => loadOccasionPage())
    .catch((err) => showToast(err.message, "error"));
});

function showGuestAuth() {
  if (!guestAuthModal) return;
  guestAuthModal.classList.add("show");
  guestAuthModal.setAttribute("aria-hidden", "false");
}

function hideGuestAuth() {
  if (!guestAuthModal) return;
  guestAuthModal.classList.remove("show");
  guestAuthModal.setAttribute("aria-hidden", "true");
}

function isRevealActive() {
  if (!occasionData) return false;
  if (!occasionData.surpriseMode) return true;
  if (occasionData.revealUnlocked) return true;
  if (occasionData.revealAt) {
    const revealDate = new Date(occasionData.revealAt);
    const today = new Date();
    return revealDate <= today;
  }
  return false;
}

function isOccasionExpired() {
  return Boolean(occasionData?.expired);
}

function applyOccasionPage(pageData) {
  occasionData = pageData.occasion;
  isOwner = Boolean(pageData.owner);
  guestVerified = Boolean(pageData.guestVerified);
  guestName = pageData.guestName || "";
  guestEmail = pageData.guestEmail || "";

  if (occasionPillEl) {
    occasionPillEl.textContent = occasionData.expired ? "Expired" : "Occasion";
  }
  titleEl.textContent = occasionData.title;
  dateEl.textContent = `${occasionData.eventDate || "No date"}${occasionData.expired ? " · Expired" : ""}`;
  const canEditOccasion = isOwner && !occasionData?.expired;
  expiredNoteEl?.classList.toggle("hidden", !occasionData.expired || !isOwner);
  ownerControls.classList.toggle("hidden", !canEditOccasion);
  newGiftBtn.classList.toggle("hidden", !canEditOccasion);
  ownerGiftList.classList.toggle("hidden", !isOwner);
  ownerGiftEmpty.classList.toggle("hidden", !isOwner);
  shareSection?.classList.toggle("hidden", !isOwner);
  guestGiftList.classList.toggle("hidden", isOwner);
  guestGiftEmpty.classList.toggle("hidden", isOwner);
  if (occasionData.surpriseMode) {
    revealHint.textContent = "Surprise mode is ON. Buyers stay hidden until reveal.";
    revealBuyersBtn.classList.remove("hidden");
  } else {
    revealHint.textContent = "Surprise mode is OFF. Buyers show immediately.";
    revealBuyersBtn.classList.add("hidden");
  }
  if (occasionData.surpriseMode) {
    const icon = "<span class=\"icon-eye\" aria-hidden=\"true\"></span>";
    revealBuyersBtn.innerHTML = isRevealActive()
      ? `Hide buyers ${icon}`
      : `Reveal buyers ${icon}`;
  }

  if (isOwner) {
    renderOwnerGifts(pageData.gifts || []);
  } else {
    renderGuestGifts(pageData.gifts || []);
  }
}

async function loadOccasionPage() {
  const pageData = await request(`/api/occasions/${occasionId}/page`);
  applyOccasionPage(pageData);
}

newGiftBtn?.addEventListener("click", () => {
  if (isOccasionExpired()) {
    showToast("Expired occasions can only be deleted", "error");
    return;
  }
  showModal(giftModal);
  giftName?.focus();
});

closeGift?.addEventListener("click", () => hideModal(giftModal));

giftModal?.addEventListener("click", (event) => {
  if (event.target === giftModal) {
    hideModal(giftModal);
  }
});

createGiftBtn?.addEventListener("click", async () => {
  if (isOccasionExpired()) {
    showToast("Expired occasions can only be deleted", "error");
    return;
  }
  const name = giftName.value.trim();
  const description = giftDescription.value.trim();
  const imageUrl = giftImage.value.trim();
  const purchaseLink = giftLink.value.trim();
  setFieldError(giftName, false);
  setFieldError(giftLink, false);
  if (!name) {
    setFieldError(giftName, true);
    showToast("Gift name required.", "error");
    return;
  }
  if (!purchaseLink) {
    setFieldError(giftLink, true);
    showToast("Purchase link required.", "error");
    return;
  }
  try {
    const data = await request("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        imageUrl,
        purchaseLink,
        occasionId,
      }),
    });
    appendOwnerGift(data);
    resetGiftForm();
    hideModal(giftModal);
    showToast("Gift Item added successfully.");
  } catch (err) {
    showToast(err.message, "error");
  }
});

guestGiftList?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const giftId = button.dataset.giftId;
  const guestNameValue = guestName;
  const guestEmailValue = guestEmail;
  try {
    if (action === "reserve") {
      await request(`/api/gifts/${giftId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: guestNameValue, guestEmail: guestEmailValue }),
      });
      showToast("Gift reserved.");
    } else if (action === "purchase") {
      await request(`/api/gifts/${giftId}/purchase-guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: guestNameValue, guestEmail: guestEmailValue }),
      });
      showToast("Gift marked purchased.");
    }
    await loadOccasionPage();
  } catch (err) {
    showToast(err.message, "error");
  }
});

closeGuestAuth?.addEventListener("click", () => hideGuestAuth());

guestAuthModal?.addEventListener("click", (event) => {
  if (event.target === guestAuthModal) {
    if (!guestVerified) {
      showToast("Google sign-in is required to continue.", "error");
      return;
    }
    hideGuestAuth();
  }
});

guestGiftList?.addEventListener("click", (event) => {
  const card = event.target.closest(".gift-card");
  if (!card || event.target.closest("button")) return;
  const link = card.dataset.link;
  if (link) {
    window.open(link, "_blank", "noopener,noreferrer");
  }
});

revealBuyersBtn?.addEventListener("click", async () => {
  try {
    if (!occasionData?.surpriseMode) {
      return;
    }
    if (isOccasionExpired()) {
      showToast("Expired occasions can only be deleted", "error");
      return;
    }
    if (isRevealActive() && !occasionData.revealUnlocked) {
      showToast("Auto reveal is active. Buyers cannot be hidden now.", "error");
      return;
    }
    const endpoint = isRevealActive() ? "hide" : "reveal";
    await request(`/api/occasions/${occasionId}/${endpoint}`, { method: "POST" });
    showToast(endpoint === "reveal" ? "Buyers revealed." : "Buyers hidden.");
    await loadOccasionPage();
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function init() {
  const params = new URLSearchParams(window.location.search);
  occasionId = params.get("occasionId") || "";
  if (!occasionId) {
    showToast("Missing occasion.", "error");
    return;
  }
  try {
    const shareUrl = `${window.location.origin}/occasion.html?occasionId=${encodeURIComponent(occasionId)}`;
    if (shareLinkInput) {
      shareLinkInput.value = shareUrl;
    }
    await loadOccasionPage();
    initGoogleSignIn();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function initGoogleSignIn() {
  if (!googleSignInEl || !window.google) return;
  if (isOwner) return;
  window.google.accounts.id.initialize({
    client_id: "1056769002846-h3rquevl5imgn20srtmp1thebmibdj3p.apps.googleusercontent.com",
    callback: async (response) => {
      try {
        const data = await request("/api/guests/google/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        guestName = data.name;
        guestEmail = data.email;
        guestVerified = true;
        hideGuestAuth();
        showToast("Signed in.");
        renderGuestGifts(guestGiftItems);
      } catch (err) {
        showToast(err.message, "error");
      }
    },
  });
  window.google.accounts.id.renderButton(googleSignInEl, {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
  });
  if (!guestVerified && !googlePromptShown) {
    googlePromptShown = true;
    showGuestAuth();
    window.google.accounts.id.prompt();
  }
}

copyShareBtn?.addEventListener("click", async () => {
  if (!shareLinkInput) return;
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    showToast("Link copied.");
  } catch (err) {
    shareLinkInput.select();
    showToast("Copy failed. Please copy manually.", "error");
  }
});

shareWhatsappBtn?.addEventListener("click", () => {
  if (!shareLinkInput) return;
  const text = `Here’s the gift list for our occasion. You can reserve or purchase a gift here: ${shareLinkInput.value}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
});

init();
