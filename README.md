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

For local development, set the extension's Giftly base URL to `http://localhost:8080` in the extension options page.

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
