package com.mywishlist.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class EventDtos {
    public record CreateEventRequest(
            @NotBlank @Size(max = 150) String title,
            @FutureOrPresent LocalDate eventDate,
            String imageUrl,
            Boolean surpriseMode
    ) {
    }

    public record EventResponse(
            String id,
            String title,
            LocalDate eventDate,
            String imageUrl,
            String recipientId,
            boolean surpriseMode,
            boolean revealUnlocked,
            LocalDate revealAt,
            boolean expired,
            int giftCount,
            Long daysUntilEvent
    ) {
    }

    public record EventPageGiftResponse(
            String id,
            String name,
            String description,
            String imageUrl,
            String purchaseLink,
            String status,
            String eventId,
            String buyerName,
            String buyerPhone,
            Instant purchasedAt
    ) {
    }

    public record EventPageResponse(
            EventResponse event,
            boolean owner,
            boolean guestVerified,
            String guestName,
            String guestEmail,
            List<EventPageGiftResponse> gifts
    ) {
    }
}
