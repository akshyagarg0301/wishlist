package com.mywishlist.api;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.mywishlist.api.dto.GuestDtos.GuestInfo;
import com.mywishlist.api.dto.GuestDtos.GoogleVerifyRequest;
import com.mywishlist.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Collections;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/guests")
public class GuestAuthController {
    private final JwtService jwtService;
    private final String googleClientId = "1056769002846-h3rquevl5imgn20srtmp1thebmibdj3p.apps.googleusercontent.com";

    public GuestAuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/google/verify")
    public GuestInfo verifyGoogle(@Valid @RequestBody GoogleVerifyRequest request, HttpServletResponse response) {
        GoogleIdToken.Payload payload = verifyToken(request.credential());
        String name = payload.get("name") != null ? payload.get("name").toString() : "Guest";
        String email = payload.getEmail();
        String token = jwtService.generateGuestToken(name, email);
        ResponseCookie cookie = ResponseCookie.from("guest_token", token)
                .httpOnly(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("None")
                .secure(true)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        return new GuestInfo(name, email);
    }

    @GetMapping("/me")
    public GuestInfo me(HttpServletRequest request) {
        String token = readCookie(request, "guest_token");
        if (token == null) {
            return null;
        }
        try {
            Claims claims = jwtService.parseClaims(token);
            if (!"guest".equals(claims.get("type"))) {
                return null;
            }
            String name = claims.get("name", String.class);
            String email = claims.get("email", String.class);
            return new GuestInfo(name, email);
        } catch (JwtException ex) {
            return null;
        }
    }

    private GoogleIdToken.Payload verifyToken(String credential) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
            }
            return idToken.getPayload();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
