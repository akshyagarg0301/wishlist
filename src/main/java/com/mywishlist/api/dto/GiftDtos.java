package com.mywishlist.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class GiftDtos {
    public record CreateGiftItemRequest(
            @Size(max = 150) String name,
            @Size(max = 1000) String description,
            String imageUrl,
            String purchaseLink,
            String eventId
    ) {
    }

    public record GiftItemResponse(
            String id,
            String name,
            String description,
            String imageUrl,
            String purchaseLink,
            String status,
            String recipientId,
            String eventId,
            String purchasedById,
            String buyerName,
            String buyerPhone,
            Instant purchasedAt
    ) {
    }

    public record GuestGiftActionRequest(@NotBlank String guestName, @NotBlank String guestEmail) {
    }

    public record PublicGiftItemResponse(
            String id,
            String name,
            String description,
            String imageUrl,
            String purchaseLink,
            String status,
            String eventId
    ) {
    }
}
