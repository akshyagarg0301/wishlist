package com.mywishlist.api;

import com.mywishlist.api.dto.OccasionDtos.OccasionResponse;
import com.mywishlist.domain.Occasion;
import com.mywishlist.service.OccasionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/occasions")
public class OccasionPublicController {
    private final OccasionService occasionService;

    public OccasionPublicController(OccasionService occasionService) {
        this.occasionService = occasionService;
    }

    @GetMapping("/{occasionId}")
    public OccasionResponse get(@PathVariable String occasionId) {
        Occasion occasion = occasionService.get(occasionId);
        return toResponse(occasion);
    }

    @PostMapping("/{occasionId}/reveal")
    public OccasionResponse reveal(@PathVariable String occasionId) {
        Occasion occasion = occasionService.reveal(occasionId);
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
                occasion.getRevealAt()
        );
    }
}
