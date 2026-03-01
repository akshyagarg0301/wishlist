package com.mywishlist.repository;

import com.mywishlist.domain.GiftItem;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GiftItemRepository extends MongoRepository<GiftItem, String> {
    List<GiftItem> findByRecipientId(String recipientId);
    List<GiftItem> findByOccasionId(String occasionId);
}
