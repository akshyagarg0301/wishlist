package com.mywishlist.api;

import com.mywishlist.api.dto.OccasionDtos.CreateOccasionRequest;
import com.mywishlist.api.dto.OccasionDtos.OccasionResponse;
import com.mywishlist.domain.Occasion;
import com.mywishlist.service.OccasionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recipients/{recipientId}/occasions")
public class OccasionController {
    private final OccasionService occasionService;

    public OccasionController(OccasionService occasionService) {
        this.occasionService = occasionService;
    }

    @PostMapping
    public OccasionResponse create(@PathVariable String recipientId,
                                   @Valid @RequestBody CreateOccasionRequest request) {
        boolean surpriseMode = request.surpriseMode() == null || request.surpriseMode();
        Occasion occasion = occasionService.create(
                recipientId,
                request.title(),
                request.eventDate(),
                request.imageUrl(),
                surpriseMode
        );
        return toResponse(occasion);
    }

    @GetMapping
    public List<OccasionResponse> list(@PathVariable String recipientId) {
        return occasionService.listForRecipient(recipientId).stream()
                .map(this::toResponse)
                .toList();
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
                occasion.getRevealAt()
        );
    }
}
