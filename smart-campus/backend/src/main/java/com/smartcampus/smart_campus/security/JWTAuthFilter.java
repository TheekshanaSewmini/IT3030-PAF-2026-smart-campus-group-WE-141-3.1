package com.smartcampus.smart_campus.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class JWTAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveToken(request);

        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        authenticate(token, request);

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        String cookieToken = jwtUtils.getTokenFromCookie(request, Token.ACCESS);

        return (cookieToken != null && !cookieToken.isBlank()) ? cookieToken : null;
    }

    private void authenticate(String token, HttpServletRequest request) {

        String username;

        try {
            username = jwtUtils.extractUsername(token);
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return;
        }

        if (username == null) {
            return;
        }

        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtUtils.validateToken(token, userDetails)) {
                log.warn("JWT validation failed for user: {}", username);
                return;
            }

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);

            log.debug("Authenticated user: {}", username);

        } catch (Exception e) {
            log.warn("Authentication error for user: {}", username);
        }
    }
}

