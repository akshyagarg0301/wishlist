package com.mywishlist.api;

import com.mywishlist.api.dto.EventDtos.EventPageGiftResponse;
import com.mywishlist.api.dto.EventDtos.EventPageResponse;
import com.mywishlist.api.dto.EventDtos.EventResponse;
import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.Event;
import com.mywishlist.domain.User;
import com.mywishlist.security.CurrentUserContext;
import com.mywishlist.security.JwtService;
import com.mywishlist.service.GiftService;
import com.mywishlist.service.EventService;
import com.mywishlist.service.UserService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventPublicController {
    private final EventService eventService;
    private final GiftService giftService;
    private final UserService userService;
    private final JwtService jwtService;

    public EventPublicController(EventService eventService,
                                    GiftService giftService,
                                    UserService userService,
                                    JwtService jwtService) {
        this.eventService = eventService;
        this.giftService = giftService;
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @GetMapping("/{eventId}")
    public EventResponse get(@PathVariable String eventId) {
        Event event = eventService.get(eventId);
        return toResponse(event);
    }

    @GetMapping("/{eventId}/page")
    public EventPageResponse page(@PathVariable String eventId, HttpServletRequest request) {
        Event event = eventService.get(eventId);
        String currentUserId = CurrentUserContext.getUserIdOrNull();
        boolean isOwner = currentUserId != null && currentUserId.equals(event.getRecipientId());
        GuestInfo guestInfo = resolveGuestInfo(request, currentUserId, isOwner);

        List<EventPageGiftResponse> gifts = (isOwner
                ? giftService.listForRecipient(event.getRecipientId()).stream()
                : giftService.listForEvent(eventId).stream())
                .filter(item -> eventId.equals(item.getEventId()))
                .map(item -> toPageGiftResponse(item, isOwner))
                .toList();

        return new EventPageResponse(
                toResponse(event),
                isOwner,
                guestInfo != null,
                guestInfo != null ? guestInfo.name() : null,
                guestInfo != null ? guestInfo.email() : null,
                gifts
        );
    }

    @PostMapping("/{eventId}/reveal")
    public EventResponse reveal(@PathVariable String eventId) {
        Event event = eventService.reveal(eventId, CurrentUserContext.getUserId());
        return toResponse(event);
    }

    @PostMapping("/{eventId}/hide")
    public EventResponse hide(@PathVariable String eventId) {
        Event event = eventService.hide(eventId, CurrentUserContext.getUserId());
        return toResponse(event);
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getEventDate(),
                event.getImageUrl(),
                event.getRecipientId(),
                event.isSurpriseMode(),
                event.isRevealUnlocked(),
                event.getRevealAt(),
                eventService.isExpired(event),
                eventService.getGiftCountForEvent(event.getId()),
                eventService.getDaysUntil(event)
        );
    }

    private EventPageGiftResponse toPageGiftResponse(GiftItem item, boolean isOwner) {
        String buyerName = null;
        String buyerPhone = null;
        if (isOwner && item.getEventId() != null) {
            Event event = eventService.get(item.getEventId());
            boolean reveal = eventService.isRevealActive(event);
            if (reveal) {
                if ("RESERVED".equals(item.getStatus().name())) {
                    buyerName = item.getReservedByName();
                    buyerPhone = item.getReservedByEmail();
                } else {
                    buyerName = item.getPurchasedByName();
                    buyerPhone = item.getPurchasedByEmail();
                }
            }
        }
        return new EventPageGiftResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getImageUrl(),
                item.getPurchaseLink(),
                item.getStatus().name(),
                item.getEventId(),
                buyerName,
                buyerPhone,
                item.getPurchasedAt()
        );
    }

    private GuestInfo resolveGuestInfo(HttpServletRequest request, String currentUserId, boolean isOwner) {
        if (currentUserId != null && !isOwner) {
            User user = userService.get(currentUserId);
            return new GuestInfo(user.getName(), user.getEmail());
        }
        String token = readCookie(request, "guest_token");
        if (token == null) {
            return null;
        }
        try {
            Claims claims = jwtService.parseClaims(token);
            if (!"guest".equals(claims.get("type"))) {
                return null;
            }
            return new GuestInfo(
                    claims.get("name", String.class),
                    claims.get("email", String.class)
            );
        } catch (JwtException ex) {
            return null;
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

    private record GuestInfo(String name, String email) {
    }
}
