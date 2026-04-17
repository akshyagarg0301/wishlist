const DEFAULT_APP_BASE_URL = "https://wishlist-1-6omc.onrender.com";
const LEGACY_LOCAL_APP_BASE_URL = "http://localhost:8080";

const appBaseUrlInput = document.getElementById("app-base-url");
const saveSettingsButton = document.getElementById("save-settings");
const saveStatus = document.getElementById("save-status");

function normalizeAppBaseUrl(value) {
  const normalized = (value || "").trim().replace(/\/$/, "");
  if (!normalized || normalized === LEGACY_LOCAL_APP_BASE_URL) {
    return DEFAULT_APP_BASE_URL;
  }
  return normalized;
}

async function init() {
  const result = await chrome.storage.sync.get({ appBaseUrl: DEFAULT_APP_BASE_URL });
  const appBaseUrl = normalizeAppBaseUrl(result.appBaseUrl);
  appBaseUrlInput.value = appBaseUrl;

  if (appBaseUrl !== result.appBaseUrl) {
    await chrome.storage.sync.set({ appBaseUrl });
  }
}

saveSettingsButton.addEventListener("click", async () => {
  const appBaseUrl = normalizeAppBaseUrl(appBaseUrlInput.value);
  appBaseUrlInput.value = appBaseUrl;
  await chrome.storage.sync.set({ appBaseUrl });
  saveStatus.textContent = "Saved.";
  saveStatus.classList.remove("hidden");
});

init();
