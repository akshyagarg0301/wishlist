const DEFAULT_APP_BASE_URL = "http://localhost:8080";

const stateMessage = document.getElementById("state-message");
const productCard = document.getElementById("product-card");
const productImage = document.getElementById("product-image");
const productTitle = document.getElementById("product-title");
const productDescription = document.getElementById("product-description");
const saveButton = document.getElementById("save-button");
const openOptionsButton = document.getElementById("open-options");

let product = null;

function setMessage(message) {
  stateMessage.textContent = message;
  stateMessage.classList.remove("hidden");
}

function renderProduct(data) {
  product = data;
  stateMessage.classList.add("hidden");
  productCard.classList.remove("hidden");
  saveButton.classList.remove("hidden");
  productTitle.textContent = data.title;
  productDescription.textContent = data.description || "No extra details detected.";

  if (data.imageUrl) {
    productImage.src = data.imageUrl;
    productImage.alt = data.title;
    productImage.classList.remove("hidden");
  } else {
    productImage.classList.add("hidden");
  }
}

async function getAppBaseUrl() {
  const result = await chrome.storage.sync.get({ appBaseUrl: DEFAULT_APP_BASE_URL });
  return result.appBaseUrl || DEFAULT_APP_BASE_URL;
}

function buildImportUrl(appBaseUrl, data) {
  const base = appBaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    name: data.title || "",
    description: data.description || "",
    imageUrl: data.imageUrl || "",
    purchaseLink: data.purchaseLink || "",
    source: data.source || ""
  });
  return `${base}/import.html?${params.toString()}`;
}

async function loadProduct() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setMessage("No active tab found.");
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "giftly:getProduct" }, (response) => {
    if (chrome.runtime.lastError) {
      setMessage("Open an Amazon product page to save an item.");
      return;
    }
    if (!response?.supported) {
      setMessage("This page does not look like an Amazon product page.");
      return;
    }
    renderProduct(response);
  });
}

saveButton.addEventListener("click", async () => {
  if (!product) {
    return;
  }
  const appBaseUrl = await getAppBaseUrl();
  chrome.tabs.create({ url: buildImportUrl(appBaseUrl, product) });
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

loadProduct().catch(() => {
  setMessage("Could not inspect this page.");
});
