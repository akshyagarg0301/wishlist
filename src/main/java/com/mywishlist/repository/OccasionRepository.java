package com.mywishlist.repository;

import com.mywishlist.domain.Occasion;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OccasionRepository extends MongoRepository<Occasion, String> {
    java.util.Optional<Occasion> findByIdAndDeletedFalse(String id);
    List<Occasion> findByRecipientIdAndDeletedFalse(String recipientId);
}
