package com.mywishlist.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserDtos {
    public record CreateUserRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 200) String email,
            @NotBlank @Size(min = 6, max = 200) String password
    ) {
    }

    public record UserResponse(String id, String name, String email) {
    }
}
