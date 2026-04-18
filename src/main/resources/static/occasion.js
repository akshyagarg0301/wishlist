const API_BASE = "https://wishlist-1-6omc.onrender.com";
const toastContainer = document.getElementById("toast-container");
const occasionPillEl = document.getElementById("occasion-pill");
const titleEl = document.getElementById("occasion-title");
const dateEl = document.getElementById("occasion-date");
const occasionBannerMedia = document.getElementById("occasion-banner-media");
const occasionBannerImage = document.getElementById("occasion-banner-image");
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
const giftImageUpload = document.getElementById("gift-image-upload");
const imagePreview = document.getElementById("image-preview");
const giftLink = document.getElementById("gift-link");
const createGiftBtn = document.getElementById("create-gift");
const progressOverlay = document.getElementById("progress-overlay");
const progressMessage = document.getElementById("progress-message");
const confirmModal = document.getElementById("confirm-modal");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmCancelBtn = document.getElementById("confirm-cancel");
const confirmAcceptBtn = document.getElementById("confirm-accept");

let occasionId = "";
let isOwner = false;
let guestVerified = false;
let occasionData = null;
let guestName = "";
let guestEmail = "";
let googlePromptShown = false;
let ownerGiftItems = [];
let guestGiftItems = [];
let giftPreviewInFlight = false;
let confirmResolver = null;

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

function getGiftStatusMeta(status) {
  switch (status) {
    case "PURCHASED":
      return { label: "Purchased", className: "purchased" };
    case "RESERVED":
      return { label: "Reserved", className: "reserved" };
    default:
      return { label: "Available", className: "available" };
  }
}

function renderStatusBadge(status) {
  const meta = getGiftStatusMeta(status);
  return `<span class="status-badge ${meta.className}">${meta.label}</span>`;
}

function getOwnerGiftHint(item) {
  if (item.status === "AVAILABLE") {
    return "Ready to be picked by a guest.";
  }
  if (item.buyerName) {
    return `Buyer: ${item.buyerName}`;
  }
  return "Buyer hidden";
}

function getGuestGiftHint(status) {
  if (status === "RESERVED") {
    return "Someone has already reserved this gift.";
  }
  if (status === "PURCHASED") {
    return "This gift has already been purchased.";
  }
  return "";
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
      const link = ensureAbsoluteUrl(item.purchaseLink);
      
      // Limit description to 100 words
      const description = item.description || "No description";
      const limitedDescription = description.split(' ').slice(0, 100).join(' ') + (description.split(' ').length > 100 ? '...' : '');
      
      return `
      <a class="gift-card-link" href="${link || "#"}" target="_blank" rel="noopener noreferrer" ${link ? "" : "aria-disabled=\"true\""}>
        <div class="gift-card ${item.status === "PURCHASED" ? "purchased" : ""}">
          ${renderGiftThumb(item)}
          <div class="gift-info">
            <h4>${item.name}</h4>
            <p>${limitedDescription}</p>
            <div class="gift-meta">
              <span class="hint">${getOwnerGiftHint(item)}</span>
            </div>
            ${
              isOccasionExpired()
                ? ""
                : `<div class="actions">
                     <button class="ghost small danger" data-action="delete-gift" data-gift-id="${item.id}">Delete</button>
                   </div>`
            }
          </div>
          ${renderStatusBadge(item.status)}
        </div>
      </a>`;
    })
    .join("");
}

function renderGiftThumb(item) {
  if (!item.imageUrl) {
    return `
      <div class="gift-thumb gift-thumb-fallback" aria-hidden="true">
        <span class="gift-thumb-icon">🎁</span>
      </div>`;
  }
  return `<div class="gift-thumb"><img src="${resolveImageUrl(item.imageUrl)}" alt="${item.name}"></div>`;
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
      (item) => {
        // Limit description to 100 words
        const description = item.description || "No description";
        const limitedDescription = description.split(' ').slice(0, 100).join(' ') + (description.split(' ').length > 100 ? '...' : '');
        
        return `
      <div class="gift-card ${item.status === "PURCHASED" ? "purchased" : ""}" data-link="${ensureAbsoluteUrl(item.purchaseLink) || ""}" data-status="${item.status}">
        ${renderGiftThumb(item)}
        <div class="gift-info">
          <h4>${item.name}</h4>
          <p>${limitedDescription}</p>
          ${
            item.status === "AVAILABLE"
              ? `<div class="actions">
                   <button class="ghost small" data-action="reserve" data-gift-id="${item.id}" ${!guestVerified ? "disabled" : ""}>Reserve</button>
                   <button class="primary small" data-action="purchase" data-gift-id="${item.id}" ${!guestVerified ? "disabled" : ""}>Mark Purchased</button>
                 </div>`
              : `<div class="gift-meta">
                   <span class="hint">${getGuestGiftHint(item.status)}</span>
                 </div>`
          }
        </div>
        ${renderStatusBadge(item.status)}
      </div>`
      }
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

function resolveImageUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_BASE}${url}`;
  }
  return `${API_BASE}/${url}`;
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
  if (giftImageUpload) {
    giftImageUpload.value = "";
  }
  if (imagePreview) {
    imagePreview.innerHTML = "";
  }
  if (giftLink) {
    giftLink.value = "";
  }
}

function handleImageUpload() {
  const file = giftImageUpload.files[0];
  if (!file) {
    imagePreview.innerHTML = "";
    return;
  }

  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    showToast("Please select an image file", "error");
    giftImageUpload.value = "";
    imagePreview.innerHTML = "";
    return;
  }

  // Check file size (limit to 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast("Image file too large (max 5MB)", "error");
    giftImageUpload.value = "";
    imagePreview.innerHTML = "";
    return;
  }

  // Display preview
  const reader = new FileReader();
  reader.onload = function(e) {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 100%;">`;
  };
  reader.readAsDataURL(file);
}

async function previewProductFromLink(url) {
  return request("/api/imports/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

async function uploadImageFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/api/upload/image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Upload failed");
  }
  const data = await response.json();
  return data.imageUrl;
}

function looksLikeProductLink(value) {
  if (!value) {
    return false;
  }
  try {
    const normalized = value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
    const url = new URL(normalized);
    return Boolean(url.hostname && url.hostname.includes("."));
  } catch (err) {
    return false;
  }
}

async function autofillGiftFromLink() {
  const purchaseLink = giftLink?.value.trim() || "";
  setFieldError(giftLink, false);
  if (!purchaseLink) {
    return;
  }
  if (giftPreviewInFlight) {
    return;
  }
  giftPreviewInFlight = true;
  try {
    const product = await previewProductFromLink(purchaseLink);
    if (giftName && !giftName.value.trim()) {
      giftName.value = product.name || "";
    }
    if (giftDescription && !giftDescription.value.trim()) {
      giftDescription.value = product.description || "";
    }
    if (imagePreview && !giftImageUpload?.files?.length && product.imageUrl) {
      imagePreview.innerHTML = `<img src="${product.imageUrl}" alt="Preview" style="max-width: 100%; max-height: 100%;">`;
    }
    if (giftLink && product.purchaseLink) {
      giftLink.value = product.purchaseLink;
    }
  } catch (err) {
  } finally {
    giftPreviewInFlight = false;
  }
}

confirmCancelBtn?.addEventListener("click", () => resolveConfirmation(false));
confirmAcceptBtn?.addEventListener("click", () => resolveConfirmation(true));

[giftModal, guestAuthModal, confirmModal].forEach((modal) => {
  if (!modal) return;
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    if (modal === guestAuthModal && !guestVerified) {
      showToast("Google sign-in is required to continue.", "error");
      return;
    }
    if (modal === confirmModal) {
      resolveConfirmation(false);
      return;
    }
    hideModal(modal);
  });
});

ownerGiftList?.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest("[data-action='delete-gift']");
  if (!deleteBtn) return;
  event.preventDefault();
  if (isOccasionExpired()) {
    showToast("Expired occasions can only be deleted", "error");
    return;
  }
  const giftId = deleteBtn.dataset.giftId;
  if (!giftId) return;
  const confirmed = await confirmAction({
    title: "Delete gift",
    message: "This gift item will be removed permanently.",
    confirmLabel: "Delete",
  });
  if (!confirmed) return;
  showProgress("Deleting gift...");
  request(`/api/gifts/${giftId}`, { method: "DELETE" })
    .then(() => loadOccasionPage())
    .catch((err) => showToast(err.message, "error"))
    .finally(() => hideProgress());
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
  if (occasionBannerMedia && occasionBannerImage) {
    if (occasionData.imageUrl) {
      occasionBannerImage.src = resolveImageUrl(occasionData.imageUrl);
      occasionBannerImage.alt = occasionData.title;
      occasionBannerMedia.classList.remove("hidden");
    } else {
      occasionBannerImage.removeAttribute("src");
      occasionBannerMedia.classList.add("hidden");
    }
  }
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

createGiftBtn?.addEventListener("click", async () => {
  if (isOccasionExpired()) {
    showToast("Expired occasions can only be deleted", "error");
    return;
  }
  const name = giftName.value.trim();
  const description = giftDescription.value.trim();
  const purchaseLink = giftLink.value.trim();
  setFieldError(giftLink, false);
  if (!purchaseLink) {
    setFieldError(giftLink, true);
    showToast("Purchase link required.", "error");
    return;
  }
  hideModal(giftModal);
  showProgress(giftImageUpload && giftImageUpload.files[0] ? "Uploading image..." : "Adding gift...");
  try {
    let imageUrl = "";
    if (giftImageUpload && giftImageUpload.files[0]) {
      imageUrl = await uploadImageFile(giftImageUpload.files[0]);
      updateProgress("Adding gift...");
    }
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
    showToast("Gift Item added successfully.");
  } catch (err) {
    showModal(giftModal);
    showToast(err.message, "error");
  } finally {
    hideProgress();
  }
});

giftLink?.addEventListener("blur", () => {
  const value = giftLink.value.trim();
  if (!looksLikeProductLink(value)) {
    return;
  }
  if (giftName?.value.trim() || giftDescription?.value.trim() || giftImageUpload?.files?.length) {
    return;
  }
  autofillGiftFromLink();
});

giftLink?.addEventListener("paste", () => {
    window.setTimeout(() => {
      const value = giftLink.value.trim();
      if (!looksLikeProductLink(value)) {
        return;
      }
      // Only check name and description for autofill since we only allow uploads now
      if (giftName?.value.trim() || giftDescription?.value.trim()) {
        return;
      }
      autofillGiftFromLink();
    }, 0);
  });

  // Handle image upload
  giftImageUpload?.addEventListener("change", handleImageUpload);

guestGiftList?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const giftId = button.dataset.giftId;
  const guestNameValue = guestName;
  const guestEmailValue = guestEmail;
  const actionMessage = action === "reserve" ? "Reserving gift..." : "Marking gift as purchased...";
  showProgress(actionMessage);
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
  } finally {
    hideProgress();
  }
});

closeGuestAuth?.addEventListener("click", () => hideGuestAuth());

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
    showProgress(endpoint === "reveal" ? "Revealing buyers..." : "Hiding buyers...");
    await request(`/api/occasions/${occasionId}/${endpoint}`, { method: "POST" });
    showToast(endpoint === "reveal" ? "Buyers revealed." : "Buyers hidden.");
    await loadOccasionPage();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideProgress();
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
      showProgress("Signing in...");
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
      } finally {
        hideProgress();
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
