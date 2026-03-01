package com.mywishlist.service;

import com.mywishlist.domain.GuestOtp;
import com.mywishlist.repository.GuestOtpRepository;
import com.mywishlist.service.sms.SmsSender;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;

@Service
public class GuestOtpService {
    private final GuestOtpRepository guestOtpRepository;
    private final SmsSender smsSender;
    private final SecureRandom random = new SecureRandom();

    public GuestOtpService(GuestOtpRepository guestOtpRepository, SmsSender smsSender) {
        this.guestOtpRepository = guestOtpRepository;
        this.smsSender = smsSender;
    }

    public GuestOtp requestOtp(String name, String phone) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);
        GuestOtp otp = new GuestOtp(name, phone, code, expiresAt);
        GuestOtp saved = guestOtpRepository.save(otp);
        String message = "Your Giftly verification code is " + code + ". It expires in 10 minutes.";
        smsSender.sendOtp(phone, message);
        return saved;
    }

    public GuestOtp verifyOtp(String phone, String code) {
        GuestOtp otp = guestOtpRepository.findTopByPhoneOrderByExpiresAtDesc(phone)
                .orElseThrow(() -> new NotFoundException("OTP not found"));
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("OTP expired");
        }
        if (!otp.getCode().equals(code)) {
            throw new IllegalStateException("Invalid OTP");
        }
        otp.setVerifiedAt(Instant.now());
        return guestOtpRepository.save(otp);
    }
}
