package com.mywishlist.api;

import com.mywishlist.api.dto.UserDtos.CreateUserRequest;
import com.mywishlist.api.dto.UserDtos.UserResponse;
import com.mywishlist.domain.User;
import com.mywishlist.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.create(request.name(), request.email(), request.password());
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    @GetMapping
    public List<UserResponse> list() {
        return userService.list().stream()
                .map(user -> new UserResponse(user.getId(), user.getName(), user.getEmail()))
                .toList();
    }
}
