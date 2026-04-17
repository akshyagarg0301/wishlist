function firstText(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const value = node?.textContent?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function firstAttr(selectors, attribute) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const value = node?.getAttribute(attribute)?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function collectBullets() {
  return [...document.querySelectorAll("#feature-bullets li span.a-list-item, #feature-bullets li span")]
    .map((node) => node.textContent.trim())
    .filter((text) => text && text.length > 8)
    .slice(0, 5);
}

function extractProduct() {
  const title = firstText([
    "#productTitle",
    "#title span",
    "h1.a-size-large span"
  ]);
  if (!title) {
    return { supported: false };
  }

  const imageUrl = firstAttr(
    [
      "#landingImage",
      "#imgTagWrapperId img",
      "#main-image-container img"
    ],
    "src"
  ) || firstAttr(["#landingImage"], "data-old-hires");

  const price = firstText([
    ".apexPriceToPay .a-offscreen",
    "#corePrice_feature_div .a-offscreen",
    ".reinventPricePriceToPayMargin .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice"
  ]);

  const descriptionParts = [];
  if (price) {
    descriptionParts.push(`Price: ${price}`);
  }
  const bullets = collectBullets();
  if (bullets.length) {
    descriptionParts.push(bullets.join("\n"));
  }

  return {
    supported: true,
    source: "Amazon",
    title,
    imageUrl,
    purchaseLink: window.location.href.split("?")[0],
    description: descriptionParts.join("\n\n")
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "giftly:getProduct") {
    return;
  }
  sendResponse(extractProduct());
});
