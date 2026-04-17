package com.mywishlist.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class OccasionDtos {
    public record CreateOccasionRequest(
            @NotBlank @Size(max = 150) String title,
            @FutureOrPresent LocalDate eventDate,
            String imageUrl,
            Boolean surpriseMode
    ) {
    }

    public record OccasionResponse(
            String id,
            String title,
            LocalDate eventDate,
            String imageUrl,
            String recipientId,
            boolean surpriseMode,
            boolean revealUnlocked,
            LocalDate revealAt,
            boolean expired
    ) {
    }

    public record OccasionPageGiftResponse(
            String id,
            String name,
            String description,
            String imageUrl,
            String purchaseLink,
            String status,
            String occasionId,
            String buyerName,
            String buyerPhone,
            Instant purchasedAt
    ) {
    }

    public record OccasionPageResponse(
            OccasionResponse occasion,
            boolean owner,
            boolean guestVerified,
            String guestName,
            String guestEmail,
            List<OccasionPageGiftResponse> gifts
    ) {
    }
}
