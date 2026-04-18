package com.mywishlist.api;

import com.mywishlist.api.dto.GiftDtos.CreateGiftItemRequest;
import com.mywishlist.api.dto.GiftDtos.GiftItemResponse;
import com.mywishlist.api.dto.GiftDtos.GuestGiftActionRequest;
import com.mywishlist.api.dto.GiftDtos.PublicGiftItemResponse;
import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.Event;
import com.mywishlist.security.CurrentUserContext;
import com.mywishlist.service.GiftService;
import com.mywishlist.service.EventService;
import com.mywishlist.security.JwtService;
import com.mywishlist.service.UserService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class GiftController {
    private final GiftService giftService;
    private final EventService eventService;
    private final JwtService jwtService;
    private final UserService userService;

    public GiftController(GiftService giftService,
                          EventService eventService,
                          JwtService jwtService,
                          UserService userService) {
        this.giftService = giftService;
        this.eventService = eventService;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @PostMapping("/gifts")
    public GiftItemResponse create(@Valid @RequestBody CreateGiftItemRequest request) {
        GiftItem item = giftService.create(
                CurrentUserContext.getUserId(),
                request.name(),
                request.description(),
                request.imageUrl(),
                request.purchaseLink(),
                request.eventId()
        );
        return toOwnerResponse(item);
    }

    @GetMapping("/gifts")
    public List<GiftItemResponse> list() {
        return giftService.listForRecipient(CurrentUserContext.getUserId()).stream()
                .map(this::toOwnerResponse)
                .toList();
    }

    @DeleteMapping("/gifts/{giftId}")
    public void delete(@PathVariable String giftId) {
        giftService.delete(giftId, CurrentUserContext.getUserId());
    }

    @GetMapping("/events/{eventId}/gifts")
    public List<PublicGiftItemResponse> listByEvent(@PathVariable String eventId) {
        return giftService.listForEvent(eventId).stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @PostMapping("/gifts/{giftId}/purchase")
    public GiftItemResponse purchase(@PathVariable String giftId) {
        GiftItem item = giftService.purchase(giftId, CurrentUserContext.getUserId());
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
        String eventId = item.getEventId();
        String purchasedById = item.getPurchasedById();
        String buyerName = null;
        String buyerPhone = null;
        if (eventId != null) {
            Event event = eventService.get(eventId);
            boolean reveal = eventService.isRevealActive(event);
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
                eventId,
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
                item.getEventId()
        );
    }

    private void requireGuestToken(HttpServletRequest request, String name, String email) {
        String currentUserId = CurrentUserContext.getUserIdOrNull();
        if (currentUserId != null) {
            com.mywishlist.domain.User user = userService.get(currentUserId);
            if (email.equals(user.getEmail()) && name.equals(user.getName())) {
                return;
            }
        }
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
