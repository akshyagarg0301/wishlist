package com.mywishlist.api.dto;

public class GuestDtos {
    public record GoogleVerifyRequest(String credential) {
    }

    public record GuestInfo(String name, String email) {
    }
}
