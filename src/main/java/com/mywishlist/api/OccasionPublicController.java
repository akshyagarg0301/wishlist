package com.mywishlist.api;

import com.mywishlist.api.dto.OccasionDtos.OccasionPageGiftResponse;
import com.mywishlist.api.dto.OccasionDtos.OccasionPageResponse;
import com.mywishlist.api.dto.OccasionDtos.OccasionResponse;
import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.Occasion;
import com.mywishlist.domain.User;
import com.mywishlist.security.CurrentUserContext;
import com.mywishlist.security.JwtService;
import com.mywishlist.service.GiftService;
import com.mywishlist.service.OccasionService;
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
@RequestMapping("/api/occasions")
public class OccasionPublicController {
    private final OccasionService occasionService;
    private final GiftService giftService;
    private final UserService userService;
    private final JwtService jwtService;

    public OccasionPublicController(OccasionService occasionService,
                                    GiftService giftService,
                                    UserService userService,
                                    JwtService jwtService) {
        this.occasionService = occasionService;
        this.giftService = giftService;
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @GetMapping("/{occasionId}")
    public OccasionResponse get(@PathVariable String occasionId) {
        Occasion occasion = occasionService.get(occasionId);
        return toResponse(occasion);
    }

    @GetMapping("/{occasionId}/page")
    public OccasionPageResponse page(@PathVariable String occasionId, HttpServletRequest request) {
        Occasion occasion = occasionService.get(occasionId);
        String currentUserId = CurrentUserContext.getUserIdOrNull();
        boolean isOwner = currentUserId != null && currentUserId.equals(occasion.getRecipientId());
        GuestInfo guestInfo = resolveGuestInfo(request, currentUserId, isOwner);

        List<OccasionPageGiftResponse> gifts = (isOwner
                ? giftService.listForRecipient(occasion.getRecipientId()).stream()
                : giftService.listForOccasion(occasionId).stream())
                .filter(item -> occasionId.equals(item.getOccasionId()))
                .map(item -> toPageGiftResponse(item, isOwner))
                .toList();

        return new OccasionPageResponse(
                toResponse(occasion),
                isOwner,
                guestInfo != null,
                guestInfo != null ? guestInfo.name() : null,
                guestInfo != null ? guestInfo.email() : null,
                gifts
        );
    }

    @PostMapping("/{occasionId}/reveal")
    public OccasionResponse reveal(@PathVariable String occasionId) {
        Occasion occasion = occasionService.reveal(occasionId);
        return toResponse(occasion);
    }

    @PostMapping("/{occasionId}/hide")
    public OccasionResponse hide(@PathVariable String occasionId) {
        Occasion occasion = occasionService.hide(occasionId);
        return toResponse(occasion);
    }

    private OccasionResponse toResponse(Occasion occasion) {
        return new OccasionResponse(
                occasion.getId(),
                occasion.getTitle(),
                occasion.getEventDate(),
                occasion.getImageUrl(),
                occasion.getRecipientId(),
                occasion.isSurpriseMode(),
                occasion.isRevealUnlocked(),
                occasion.getRevealAt(),
                occasionService.isExpired(occasion)
        );
    }

    private OccasionPageGiftResponse toPageGiftResponse(GiftItem item, boolean isOwner) {
        String buyerName = null;
        String buyerPhone = null;
        if (isOwner && item.getOccasionId() != null) {
            Occasion occasion = occasionService.get(item.getOccasionId());
            boolean reveal = occasionService.isRevealActive(occasion);
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
        return new OccasionPageGiftResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getImageUrl(),
                item.getPurchaseLink(),
                item.getStatus().name(),
                item.getOccasionId(),
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
