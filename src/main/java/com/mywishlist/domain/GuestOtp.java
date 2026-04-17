package com.mywishlist.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("guest_otps")
@CompoundIndex(name = "guest_otp_phone_expires_idx", def = "{'phone': 1, 'expiresAt': -1}")
public class GuestOtp {
    @Id
    private String id;

    private String name;

    private String phone;

    private String code;

    private Instant expiresAt;

    private Instant verifiedAt;

    protected GuestOtp() {
    }

    public GuestOtp(String name, String phone, String code, Instant expiresAt) {
        this.name = name;
        this.phone = phone;
        this.code = code;
        this.expiresAt = expiresAt;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getCode() {
        return code;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
