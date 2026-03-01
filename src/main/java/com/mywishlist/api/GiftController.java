package com.mywishlist.api;

import com.mywishlist.api.dto.GiftDtos.CreateGiftItemRequest;
import com.mywishlist.api.dto.GiftDtos.GiftItemResponse;
import com.mywishlist.api.dto.GiftDtos.GuestGiftActionRequest;
import com.mywishlist.api.dto.GiftDtos.PublicGiftItemResponse;
import com.mywishlist.api.dto.GiftDtos.PurchaseGiftRequest;
import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.Occasion;
import com.mywishlist.service.GiftService;
import com.mywishlist.service.OccasionService;
import com.mywishlist.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class GiftController {
    private final GiftService giftService;
    private final OccasionService occasionService;
    private final JwtService jwtService;

    public GiftController(GiftService giftService, OccasionService occasionService, JwtService jwtService) {
        this.giftService = giftService;
        this.occasionService = occasionService;
        this.jwtService = jwtService;
    }

    @PostMapping("/recipients/{recipientId}/gifts")
    public GiftItemResponse create(@PathVariable String recipientId,
                                   @Valid @RequestBody CreateGiftItemRequest request) {
        GiftItem item = giftService.create(
                recipientId,
                request.name(),
                request.description(),
                request.imageUrl(),
                request.purchaseLink(),
                request.occasionId()
        );
        return toOwnerResponse(item);
    }

    @GetMapping("/recipients/{recipientId}/gifts")
    public List<GiftItemResponse> list(@PathVariable String recipientId) {
        return giftService.listForRecipient(recipientId).stream()
                .map(this::toOwnerResponse)
                .toList();
    }

    @GetMapping("/occasions/{occasionId}/gifts")
    public List<PublicGiftItemResponse> listByOccasion(@PathVariable String occasionId) {
        return giftService.listForOccasion(occasionId).stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @PostMapping("/gifts/{giftId}/purchase")
    public GiftItemResponse purchase(@PathVariable String giftId,
                                     @Valid @RequestBody PurchaseGiftRequest request) {
        GiftItem item = giftService.purchase(giftId, request.purchaserId());
        return toOwnerResponse(item);
    }

    @PostMapping("/gifts/{giftId}/reserve")
    public PublicGiftItemResponse reserve(@PathVariable String giftId,
                                          HttpServletRequest request,
                                          @Valid @RequestBody GuestGiftActionRequest body) {
        requireGuestToken(request, body.guestName(), body.guestEmail());
        GiftItem item = giftService.reserveForGuest(giftId, body.guestName(), body.guestEmail());
        return toPublicResponse(item);
    }

    @PostMapping("/gifts/{giftId}/purchase-guest")
    public PublicGiftItemResponse purchaseGuest(@PathVariable String giftId,
                                                HttpServletRequest request,
                                                @Valid @RequestBody GuestGiftActionRequest body) {
        requireGuestToken(request, body.guestName(), body.guestEmail());
        GiftItem item = giftService.purchaseForGuest(giftId, body.guestName(), body.guestEmail());
        return toPublicResponse(item);
    }

    private GiftItemResponse toOwnerResponse(GiftItem item) {
        String occasionId = item.getOccasionId();
        String purchasedById = item.getPurchasedById();
        String buyerName = null;
        String buyerPhone = null;
        if (occasionId != null) {
            Occasion occasion = occasionService.get(occasionId);
            boolean reveal = occasionService.isRevealActive(occasion);
            if (reveal) {
                if (item.getStatus().name().equals("RESERVED")) {
                    buyerName = item.getReservedByName();
                    buyerPhone = item.getReservedByEmail();
                } else {
                    buyerName = item.getPurchasedByName();
                    buyerPhone = item.getPurchasedByEmail();
                }
            }
        }
        return new GiftItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getImageUrl(),
                item.getPurchaseLink(),
                item.getStatus().name(),
                item.getRecipientId(),
                occasionId,
                purchasedById,
                buyerName,
                buyerPhone,
                item.getPurchasedAt()
        );
    }

    private PublicGiftItemResponse toPublicResponse(GiftItem item) {
        return new PublicGiftItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getImageUrl(),
                item.getPurchaseLink(),
                item.getStatus().name(),
                item.getOccasionId()
        );
    }

    private void requireGuestToken(HttpServletRequest request, String name, String email) {
        String token = readCookie(request, "guest_token");
        if (token == null) {
            throw new IllegalStateException("Guest verification required");
        }
        try {
            Claims claims = jwtService.parseClaims(token);
            if (!"guest".equals(claims.get("type"))) {
                throw new IllegalStateException("Guest verification required");
            }
            String claimEmail = claims.get("email", String.class);
            String claimName = claims.get("name", String.class);
            if (!email.equals(claimEmail) || !name.equals(claimName)) {
                throw new IllegalStateException("Guest verification mismatch");
            }
        } catch (JwtException ex) {
            throw new IllegalStateException("Guest verification required");
        }
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
