const API_BASE = "https://wishlist-1-6omc.onrender.com";
const toastContainer = document.getElementById("toast-container");
const titleEl = document.getElementById("occasion-title");
const dateEl = document.getElementById("occasion-date");
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

let recipientId = "";
let occasionId = "";
let isOwner = false;
let guestVerified = false;
let occasionData = null;
let guestName = "";
let guestEmail = "";
let googlePromptShown = false;

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
  if (!items.length) {
    ownerGiftList.innerHTML = "";
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
      return `
      <a class="gift-card-link" href="${item.purchaseLink || "#"}" target="_blank" rel="noopener noreferrer" ${item.purchaseLink ? "" : "aria-disabled=\"true\""}>
        <div class="gift-card ${item.status === "PURCHASED" ? "purchased" : ""}">
          <div class="gift-thumb gold"></div>
          <div class="gift-info">
            <h4>${item.name}</h4>
            <p>${item.description || "No description"}</p>
            <div class="hint">${buyerLabel}</div>
          </div>
          <div class="price">${item.status}</div>
        </div>
      </a>`;
    })
    .join("");
}

function renderGuestGifts(items) {
  if (!guestGiftList || !guestGiftEmpty) return;
  if (!items.length) {
    guestGiftList.innerHTML = "";
    guestGiftEmpty.classList.remove("hidden");
    return;
  }
  guestGiftEmpty.classList.add("hidden");
  guestGiftList.innerHTML = items
    .map(
      (item) => `
      <div class="gift-card ${item.status === "PURCHASED" ? "purchased" : ""}" data-link="${item.purchaseLink || ""}">
        <div class="gift-thumb gold"></div>
        <div class="gift-info">
          <h4>${item.name}</h4>
          <p>${item.description || "No description"}</p>
          <div class="actions">
            <button class="ghost small" data-action="reserve" data-gift-id="${item.id}" ${item.status !== "AVAILABLE" || !guestVerified ? "disabled" : ""}>Reserve</button>
            <button class="primary small" data-action="purchase" data-gift-id="${item.id}" ${item.status === "PURCHASED" || !guestVerified ? "disabled" : ""}>Mark Purchased</button>
          </div>
        </div>
        <div class="price">${item.status}</div>
      </div>`
    )
    .join("");
}

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

async function loadOccasion() {
  occasionData = await request(`/api/occasions/${occasionId}`);
  titleEl.textContent = occasionData.title;
  dateEl.textContent = occasionData.eventDate || "No date";
  if (occasionData.surpriseMode) {
    revealHint.textContent = "Surprise mode is ON. Buyers stay hidden until reveal.";
    revealBuyersBtn.classList.remove("hidden");
  } else {
    revealHint.textContent = "Surprise mode is OFF. Buyers show immediately.";
    revealBuyersBtn.classList.add("hidden");
  }
}

async function loadGifts() {
  if (isOwner) {
    const gifts = await request(`/api/recipients/${recipientId}/gifts`);
    const filtered = gifts.filter((gift) => gift.occasionId === occasionId);
    renderOwnerGifts(filtered);
    return;
  }
  const gifts = await request(`/api/occasions/${occasionId}/gifts`);
  renderGuestGifts(gifts);
}

newGiftBtn?.addEventListener("click", () => {
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
    await request(`/api/recipients/${recipientId}/gifts`, {
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
    showToast("Gift Item added successfully.");
    giftName.value = "";
    giftDescription.value = "";
    giftImage.value = "";
    giftLink.value = "";
    hideModal(giftModal);
    await loadGifts();
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
    await loadGifts();
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
    const data = await request(`/api/occasions/${occasionId}/reveal`, { method: "POST" });
    occasionData = data;
    showToast("Buyers revealed.");
    await loadGifts();
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
    try {
      const me = await request("/api/auth/me");
      recipientId = me.userId;
      isOwner = true;
    } catch (err) {
      isOwner = false;
    }
    if (!isOwner) {
      try {
        const guest = await request("/api/guests/me");
        if (guest && guest.name) {
          guestName = guest.name;
          guestEmail = guest.email;
          guestVerified = true;
        }
      } catch (err) {
        // ignore
      }
    }
    await loadOccasion();
    ownerControls.classList.toggle("hidden", !isOwner);
    newGiftBtn.classList.toggle("hidden", !isOwner);
    ownerGiftList.classList.toggle("hidden", !isOwner);
    ownerGiftEmpty.classList.toggle("hidden", !isOwner);
    shareSection?.classList.toggle("hidden", !isOwner);
    guestGiftList.classList.toggle("hidden", isOwner);
    guestGiftEmpty.classList.toggle("hidden", isOwner);
    await loadGifts();
    initGoogleSignIn();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function initGoogleSignIn() {
  if (!googleSignInEl || !window.google) return;
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
        await loadGifts();
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
