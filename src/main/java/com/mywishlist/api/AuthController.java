package com.mywishlist.api;

import com.mywishlist.api.dto.AuthDtos.LoginRequest;
import com.mywishlist.api.dto.AuthDtos.LoginResponse;
import com.mywishlist.api.dto.AuthDtos.MeResponse;
import com.mywishlist.domain.User;
import com.mywishlist.security.CurrentUserContext;
import com.mywishlist.security.JwtService;
import com.mywishlist.service.UserService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        User user = userService.getByEmail(request.email());
        if (!userService.matchesPassword(user, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("None")
                .secure(true)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        return new LoginResponse(user.getId(), user.getName(), user.getEmail(), token);
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("auth_token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .secure(true)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    @GetMapping("/me")
    public MeResponse me() {
        User user = userService.get(CurrentUserContext.getUserId());
        return new MeResponse(user.getId(), user.getName(), user.getEmail());
    }
}
