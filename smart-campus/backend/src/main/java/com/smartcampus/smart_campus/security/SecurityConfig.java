package com.smartcampus.smart_campus.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsUtils;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JWTAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration crf = new CorsConfiguration();
                crf.setAllowedOriginPatterns(List.of("http://localhost:*"));
                crf.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
                crf.setAllowedHeaders(List.of("*"));
                crf.setAllowCredentials(true);
                return crf;
            }))
            .csrf(AbstractHttpConfigurer::disable)

            .authorizeHttpRequests(auth -> auth
                    // Allow preflight requests
                    .requestMatchers(request -> CorsUtils.isPreFlightRequest(request)).permitAll()

                    .requestMatchers("/auth/me", "/auth/logout").authenticated()
                    .requestMatchers(
                            "/auth/**",
                            "/forgotpass/**",
                            "/login/**"
                    ).permitAll()

                    .anyRequest().authenticated()
            )

            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .exceptionHandling(ex -> ex
                    // Return 401 for missing/invalid authentication so frontend refresh flow can trigger.
                    .authenticationEntryPoint((request, response, exception) ->
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                    .accessDeniedHandler((request, response, exception) ->
                            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden"))
            )

            .authenticationProvider(authenticationProvider)

            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
