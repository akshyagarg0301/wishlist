package com.mywishlist.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;

@Component
public class SecurityHeadersFilter extends HttpFilter {
    @Override
    protected void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
        chain.doFilter(request, response);
    }
}
