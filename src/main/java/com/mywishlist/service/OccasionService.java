package com.mywishlist.service;

import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.Occasion;
import com.mywishlist.repository.GiftItemRepository;
import com.mywishlist.repository.OccasionRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OccasionService {
    private final OccasionRepository occasionRepository;
    private final GiftItemRepository giftItemRepository;

    public OccasionService(OccasionRepository occasionRepository, GiftItemRepository giftItemRepository) {
        this.occasionRepository = occasionRepository;
        this.giftItemRepository = giftItemRepository;
    }

    public Occasion create(String recipientId, String title, LocalDate eventDate, String imageUrl, boolean surpriseMode) {
        validateEventDate(eventDate);
        LocalDate revealAt = eventDate != null ? eventDate.plusDays(1) : null;
        Occasion occasion = new Occasion(title, eventDate, imageUrl, recipientId, surpriseMode, revealAt);
        return occasionRepository.save(occasion);
    }

    public List<Occasion> listForRecipient(String recipientId) {
        return occasionRepository.findByRecipientIdAndDeletedFalse(recipientId);
    }

    public Occasion get(String id) {
        return occasionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Occasion not found"));
    }

    public void delete(String id, String recipientId) {
        Occasion occasion = get(id);
        assertOwner(occasion, recipientId);
        List<GiftItem> gifts = giftItemRepository.findByOccasionIdAndDeletedFalse(id);
        boolean hasPurchased = gifts.stream()
                .anyMatch(item -> item.getStatus() == com.mywishlist.domain.GiftStatus.PURCHASED);
        if (hasPurchased) {
            throw new IllegalStateException("Occasion has purchased gifts and cannot be deleted");
        }
        gifts.forEach(gift -> gift.setDeleted(true));
        if (!gifts.isEmpty()) {
            giftItemRepository.saveAll(gifts);
        }
        occasion.setDeleted(true);
        occasionRepository.save(occasion);
    }

    public Occasion reveal(String id, String recipientId) {
        Occasion occasion = get(id);
        assertOwner(occasion, recipientId);
        assertNotExpired(occasion);
        occasion.setRevealUnlocked(true);
        return occasionRepository.save(occasion);
    }

    public Occasion hide(String id, String recipientId) {
        Occasion occasion = get(id);
        assertOwner(occasion, recipientId);
        assertNotExpired(occasion);
        occasion.setRevealUnlocked(false);
        return occasionRepository.save(occasion);
    }

    public boolean isExpired(Occasion occasion) {
        LocalDate eventDate = occasion.getEventDate();
        return eventDate != null && eventDate.isBefore(LocalDate.now());
    }

    public void assertNotExpired(Occasion occasion) {
        if (isExpired(occasion)) {
            throw new IllegalStateException("Expired occasions can only be deleted");
        }
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

    private void assertOwner(Occasion occasion, String recipientId) {
        if (!occasion.getRecipientId().equals(recipientId)) {
            throw new NotFoundException("Occasion not found");
        }
    }

    private void validateEventDate(LocalDate eventDate) {
        if (eventDate != null && eventDate.isBefore(LocalDate.now())) {
            throw new IllegalStateException("Event date must be today or in the future");
        }
    }
}
