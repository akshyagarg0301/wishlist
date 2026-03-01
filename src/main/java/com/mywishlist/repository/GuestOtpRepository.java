package com.mywishlist.repository;

import com.mywishlist.domain.GuestOtp;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GuestOtpRepository extends MongoRepository<GuestOtp, String> {
    Optional<GuestOtp> findTopByPhoneOrderByExpiresAtDesc(String phone);
}
