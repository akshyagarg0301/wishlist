package com.mywishlist.repository;

import com.mywishlist.domain.Vendor;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VendorRepository extends MongoRepository<Vendor, String> {
    Optional<Vendor> findByDomain(String domain);
}
