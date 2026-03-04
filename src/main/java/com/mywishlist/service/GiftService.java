package com.mywishlist.service;

import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.GiftStatus;
import com.mywishlist.domain.Occasion;
import com.mywishlist.repository.GiftItemRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GiftService {
    private final GiftItemRepository giftItemRepository;
    private final UserService userService;
    private final OccasionService occasionService;

    public GiftService(GiftItemRepository giftItemRepository, UserService userService, OccasionService occasionService) {
        this.giftItemRepository = giftItemRepository;
        this.userService = userService;
        this.occasionService = occasionService;
    }

    public GiftItem create(String recipientId, String name, String description, String imageUrl, String purchaseLink, String occasionId) {
        userService.get(recipientId);
        if (occasionId != null) {
            Occasion occasion = occasionService.get(occasionId);
            if (!occasion.getRecipientId().equals(recipientId)) {
                throw new NotFoundException("Occasion does not belong to recipient");
            }
        }
        GiftItem item = new GiftItem(name, description, imageUrl, purchaseLink, recipientId, occasionId);
        return giftItemRepository.save(item);
    }

    public List<GiftItem> listForRecipient(String recipientId) {
        return giftItemRepository.findByRecipientId(recipientId);
    }

    public void delete(String giftId, String recipientId) {
        GiftItem gift = giftItemRepository.findById(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (!gift.getRecipientId().equals(recipientId)) {
            throw new NotFoundException("Gift item not found");
        }
        giftItemRepository.delete(gift);
    }

    public GiftItem purchase(String giftId, String purchaserId) {
        GiftItem gift = giftItemRepository.findById(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            return gift;
        }
        userService.get(purchaserId);
        gift.markPurchased(purchaserId, Instant.now());
        return giftItemRepository.save(gift);
    }

    public GiftItem reserveForGuest(String giftId, String guestName, String guestEmail) {
        GiftItem gift = giftItemRepository.findById(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            throw new IllegalStateException("Gift already purchased");
        }
        if (gift.getStatus() == GiftStatus.RESERVED
                && gift.getReservedByEmail() != null
                && !gift.getReservedByEmail().equals(guestEmail)) {
            throw new IllegalStateException("Gift already reserved");
        }
        gift.markReserved(guestName, guestEmail, Instant.now());
        return giftItemRepository.save(gift);
    }

    public GiftItem purchaseForGuest(String giftId, String guestName, String guestEmail) {
        GiftItem gift = giftItemRepository.findById(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            throw new IllegalStateException("Gift already purchased");
        }
        if (gift.getStatus() == GiftStatus.RESERVED
                && gift.getReservedByEmail() != null
                && !gift.getReservedByEmail().equals(guestEmail)) {
            throw new IllegalStateException("Gift already reserved");
        }
        gift.markPurchasedByGuest(guestName, guestEmail, Instant.now());
        return giftItemRepository.save(gift);
    }

    public List<GiftItem> listForOccasion(String occasionId) {
        return giftItemRepository.findByOccasionId(occasionId);
    }
}
