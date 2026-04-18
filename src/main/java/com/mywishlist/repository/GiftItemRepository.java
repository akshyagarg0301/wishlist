package com.mywishlist.repository;

import com.mywishlist.domain.GiftItem;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GiftItemRepository extends MongoRepository<GiftItem, String> {
    java.util.Optional<GiftItem> findByIdAndDeletedFalse(String id);
    List<GiftItem> findByRecipientIdAndDeletedFalse(String recipientId);
    List<GiftItem> findByEventIdAndDeletedFalse(String eventId);
}
