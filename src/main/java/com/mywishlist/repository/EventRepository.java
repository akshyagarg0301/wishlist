package com.mywishlist.repository;

import com.mywishlist.domain.Event;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface EventRepository extends MongoRepository<Event, String> {
    java.util.Optional<Event> findByIdAndDeletedFalse(String id);
    List<Event> findByRecipientIdAndDeletedFalse(String recipientId);
}
