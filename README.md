# MyWishlist

Spring Boot app where gift recipients manage their wishlist (items + occasions + images) and friends can view and mark items as purchased. Backed by MongoDB.

## Run
```bash
./gradlew bootRun
```

Open the UI at http://localhost:8080/

JWT config lives in `src/main/resources/application.properties`. Set `jwt.secret` to a long random string (32+ chars).

## Browser Extension
The repo now includes a Chrome extension scaffold in `browser-extension/`.

Flow:
1. Open an Amazon product page.
2. Use the extension popup.
3. It opens `import.html` on your Giftly backend with the product prefilled.
4. Pick an occasion and save the gift.

The extension now defaults to `https://wishlist-1-6omc.onrender.com`.

### Install For Testing
1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select the `browser-extension/` folder
5. Pin the extension in Chrome
6. Open an Amazon product page and click the extension icon

### Local Development
If you want the extension to target a local backend instead, open the extension settings and change the Giftly base URL to `http://localhost:8080`.

### Share With Other Users
For normal users, `Load unpacked` is not the right distribution model. Publish the extension to the Chrome Web Store.

High-level release flow:
1. Keep the files in `browser-extension/` as the extension package
2. Zip the contents of that folder
3. Create a Chrome Web Store developer account
4. Upload the zip as a new extension item
5. Add store screenshots, description, privacy details, and permissions explanation
6. Publish it so users can install it directly from the store

## Core Endpoints
All requests except `POST /api/users` and `POST /api/auth/login` require an `Authorization: Bearer <token>` header.

```bash
# Create users (recipient or friend)
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@example.com","password":"secret123"}'

# Sign in to get a JWT
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"secret123"}'

# Add an occasion for a recipient
curl -X POST http://localhost:8080/api/recipients/USER_ID/occasions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Birthday","eventDate":"2026-05-12","imageUrl":"https://example.com/bday.jpg"}'

# Add a gift item for a recipient
curl -X POST http://localhost:8080/api/recipients/USER_ID/gifts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Noise Cancelling Headphones","description":"Over-ear","imageUrl":"https://example.com/hp.jpg","purchaseLink":"https://store.example.com/hp","occasionId":"OCCASION_ID"}'

# Friend marks a gift as purchased
curl -X POST http://localhost:8080/api/gifts/GIFT_ID/purchase \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purchaserId":"FRIEND_ID"}'
```
