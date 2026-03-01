package com.mywishlist.service;

import com.mywishlist.domain.User;
import com.mywishlist.repository.UserRepository;
import java.util.List;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User create(String name, String email, String rawPassword) {
        String trimmedEmail = email == null ? "" : email.trim();
        String normalizedEmail = trimmedEmail.toLowerCase();
        if (userRepository.findByEmail(trimmedEmail).isPresent()
                || userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new DuplicateKeyException("User already exists with this email.");
        }
        String hash = passwordEncoder.encode(rawPassword);
        User user = new User(name, normalizedEmail, hash);
        return userRepository.save(user);
    }

    public List<User> list() {
        return userRepository.findAll();
    }

    public User get(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public User getByEmail(String email) {
        String trimmedEmail = email == null ? "" : email.trim();
        String normalizedEmail = trimmedEmail.toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .or(() -> userRepository.findByEmail(trimmedEmail))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public boolean matchesPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }
}
