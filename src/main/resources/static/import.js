const occasionSelect = document.getElementById("import-occasion-select");
const sourceUrlInput = document.getElementById("import-source-url");
const loadLinkButton = document.getElementById("import-load-link");
const nameInput = document.getElementById("import-name");
const descriptionInput = document.getElementById("import-description");
const imageUrlInput = document.getElementById("import-image-url");
const purchaseLinkInput = document.getElementById("import-purchase-link");
const imagePreview = document.getElementById("import-image-preview");
const imageFallback = document.getElementById("import-image-fallback");
const sourcePill = document.getElementById("import-source-pill");
const titlePreview = document.getElementById("import-title-preview");
const linkPreview = document.getElementById("import-link-preview");
const authMessage = document.getElementById("import-auth-message");
const saveButton = document.getElementById("import-save");
const openOccasionButton = document.getElementById("import-open-occasion");
const resultMessage = document.getElementById("import-result");

let occasions = [];
let createdOccasionId = "";

function setResult(message, isError = false) {
  resultMessage.textContent = message;
  resultMessage.classList.remove("hidden");
  resultMessage.classList.toggle("error", isError);
}

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: "include", ...options });
  const text = await response.text();
  if (!response.ok) {
    let message = text || response.statusText;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed?.error) {
        message = parsed.error;
      }
    } catch (err) {
      // Ignore invalid JSON.
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : null;
}

function readProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("source") || "Product",
    name: params.get("name") || "",
    description: params.get("description") || "",
    imageUrl: params.get("imageUrl") || "",
    purchaseLink: params.get("purchaseLink") || ""
  };
}

function renderProductPreview(product) {
  sourcePill.textContent = product.source;
  titlePreview.textContent = product.name || "Imported product";
  linkPreview.textContent = product.purchaseLink || "";
  sourceUrlInput.value = product.purchaseLink || "";
  nameInput.value = product.name;
  descriptionInput.value = product.description;
  imageUrlInput.value = product.imageUrl;
  purchaseLinkInput.value = product.purchaseLink;

  if (product.imageUrl) {
    imagePreview.src = product.imageUrl;
    imagePreview.alt = product.name || "Product image";
    imagePreview.classList.remove("hidden");
    imageFallback.classList.add("hidden");
  } else {
    imagePreview.classList.add("hidden");
    imageFallback.classList.remove("hidden");
  }
}

async function previewProductFromLink(url) {
  return request("/api/imports/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
}

function renderOccasions() {
  const activeOccasions = occasions.filter((occasion) => !occasion.expired);
  if (!activeOccasions.length) {
    occasionSelect.innerHTML = `<option value="">No active occasions available</option>`;
    occasionSelect.disabled = true;
    saveButton.disabled = true;
    return;
  }

  occasionSelect.innerHTML = activeOccasions
    .map((occasion) => `<option value="${occasion.id}">${occasion.title}</option>`)
    .join("");
  occasionSelect.disabled = false;
  saveButton.disabled = false;
}

async function loadOccasions() {
  try {
    occasions = await request("/api/occasions");
    authMessage.classList.add("hidden");
    renderOccasions();
  } catch (err) {
    authMessage.textContent = "Sign in to Giftly first, then reopen this import page.";
    authMessage.classList.remove("hidden");
    occasionSelect.disabled = true;
    saveButton.disabled = true;
  }
}

async function loadProductFromLink() {
  const url = sourceUrlInput.value.trim();
  if (!url) {
    setResult("Amazon product link is required.", true);
    return;
  }

  loadLinkButton.disabled = true;
  try {
    const product = await previewProductFromLink(url);
    renderProductPreview(product);
    setResult("Product details loaded.");
  } catch (err) {
    setResult(err.message, true);
  } finally {
    loadLinkButton.disabled = false;
  }
}

saveButton.addEventListener("click", async () => {
  const occasionId = occasionSelect.value;
  const payload = {
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim(),
    imageUrl: imageUrlInput.value.trim(),
    purchaseLink: purchaseLinkInput.value.trim(),
    occasionId
  };

  if (!payload.name || !payload.purchaseLink || !occasionId) {
    setResult("Name, purchase link, and occasion are required.", true);
    return;
  }

  saveButton.disabled = true;
  try {
    const gift = await request("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    createdOccasionId = gift.occasionId || occasionId;
    openOccasionButton.classList.remove("hidden");
    setResult("Product saved successfully.");
  } catch (err) {
    setResult(err.message, true);
  } finally {
    saveButton.disabled = false;
  }
});

loadLinkButton.addEventListener("click", () => {
  loadProductFromLink();
});

openOccasionButton.addEventListener("click", () => {
  if (!createdOccasionId) {
    return;
  }
  window.location.href = `/occasion.html?occasionId=${encodeURIComponent(createdOccasionId)}`;
});

const initialProduct = readProductFromUrl();
renderProductPreview(initialProduct);
if (initialProduct.purchaseLink && !initialProduct.name && !initialProduct.imageUrl && !initialProduct.description) {
  loadProductFromLink();
}
loadOccasions();
