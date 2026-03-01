package com.mywishlist.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class OccasionDtos {
    public record CreateOccasionRequest(
            @NotBlank @Size(max = 150) String title,
            LocalDate eventDate,
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
            LocalDate revealAt
    ) {
    }
}
