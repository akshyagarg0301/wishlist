package com.mywishlist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class ImportDtos {
    public record ImportPreviewRequest(@NotBlank String url) {
    }

    public record ImportPreviewResponse(
            String source,
            String name,
            String description,
            String imageUrl,
            String purchaseLink
    ) {
    }
}
