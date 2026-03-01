package com.mywishlist.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(
            @NotBlank @Email @Size(max = 200) String email,
            @NotBlank @Size(min = 6, max = 200) String password
    ) {
    }

    public record LoginResponse(String userId, String name, String email, String token) {
    }

    public record MeResponse(String userId, String name, String email) {
    }
}
