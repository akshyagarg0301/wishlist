package com.mywishlist.service;

import com.mywishlist.domain.Occasion;
import com.mywishlist.repository.OccasionRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OccasionService {
    private final OccasionRepository occasionRepository;
    private final UserService userService;

    public OccasionService(OccasionRepository occasionRepository, UserService userService) {
        this.occasionRepository = occasionRepository;
        this.userService = userService;
    }

    public Occasion create(String recipientId, String title, LocalDate eventDate, String imageUrl, boolean surpriseMode) {
        userService.get(recipientId);
        LocalDate revealAt = eventDate != null ? eventDate.plusDays(1) : null;
        Occasion occasion = new Occasion(title, eventDate, imageUrl, recipientId, surpriseMode, revealAt);
        return occasionRepository.save(occasion);
    }

    public List<Occasion> listForRecipient(String recipientId) {
        return occasionRepository.findByRecipientId(recipientId);
    }

    public Occasion get(String id) {
        return occasionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Occasion not found"));
    }

    public Occasion reveal(String id) {
        Occasion occasion = get(id);
        occasion.setRevealUnlocked(true);
        return occasionRepository.save(occasion);
    }

    public Occasion hide(String id) {
        Occasion occasion = get(id);
        occasion.setRevealUnlocked(false);
        return occasionRepository.save(occasion);
    }

    public boolean isRevealActive(Occasion occasion) {
        if (!occasion.isSurpriseMode()) {
            return true;
        }
        if (occasion.isRevealUnlocked()) {
            return true;
        }
        LocalDate revealAt = occasion.getRevealAt();
        return revealAt != null && !revealAt.isAfter(LocalDate.now());
    }
}
