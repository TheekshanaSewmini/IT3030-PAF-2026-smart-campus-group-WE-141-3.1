package com.smartcampus.smart_campus.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.smartcampus.smart_campus.enums.Token;
import com.smartcampus.smart_campus.utils.JwtUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

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

        String path = request.getServletPath();
        String method = request.getMethod();

        log.debug("JWTAuthFilter: {} {} - Authorization header present: {}, Cookies: {}",
                method, path, request.getHeader("Authorization") != null, request.getCookies() != null ? request.getCookies().length : 0);

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.debug("Authentication already set in context for {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveToken(request);

        if (token == null || token.isBlank()) {
            log.debug("No JWT token found for {} {}", method, path);
            filterChain.doFilter(request, response);
            return;
        }

        log.debug("JWT token found for {} {}, attempting authentication", method, path);
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

        try {
            String username = jwtUtils.extractUsername(token);
            log.debug("Extracted username from JWT: {}", username);
            if (username == null) {
                log.warn("Username extraction returned null");
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            log.debug("Loaded user details for username: {}", username);

            if (!jwtUtils.validateToken(token, userDetails)) {
                log.warn("JWT token validation failed for user: {}", username);
                return;
            }

            log.debug("JWT token validation successful for user: {}", username);

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
            log.debug("Authentication set in security context for user: {}", username);

        } catch (Exception e) {
            log.warn("JWT error: {} - {}", e.getClass().getName(), e.getMessage());
        }
    }
}

