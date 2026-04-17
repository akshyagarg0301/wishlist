const DEFAULT_APP_BASE_URL = "http://localhost:8080";

const appBaseUrlInput = document.getElementById("app-base-url");
const saveSettingsButton = document.getElementById("save-settings");
const saveStatus = document.getElementById("save-status");

async function init() {
  const result = await chrome.storage.sync.get({ appBaseUrl: DEFAULT_APP_BASE_URL });
  appBaseUrlInput.value = result.appBaseUrl || DEFAULT_APP_BASE_URL;
}

saveSettingsButton.addEventListener("click", async () => {
  const value = appBaseUrlInput.value.trim().replace(/\/$/, "");
  await chrome.storage.sync.set({ appBaseUrl: value || DEFAULT_APP_BASE_URL });
  saveStatus.textContent = "Saved.";
  saveStatus.classList.remove("hidden");
});

init();
