package com.smartcampus.smart_campus.service;

import com.smartcampus.smart_campus.dtos.AuthResponse;
import com.smartcampus.smart_campus.dtos.UserDto;
import com.smartcampus.smart_campus.entities.User;
import com.smartcampus.smart_campus.enums.Role;
import com.smartcampus.smart_campus.enums.Token;
import com.smartcampus.smart_campus.records.LoginRequest;
import com.smartcampus.smart_campus.records.MailBody;
import com.smartcampus.smart_campus.repo.UserRepo;
import com.smartcampus.smart_campus.utils.EmailUtils;
import com.smartcampus.smart_campus.utils.JwtUtils;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceimpl implements AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailUtils emailUtils;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    // ================= EMAIL VALIDATION =================
    private boolean isValidEmail(String email) {
        return email != null && email.matches("^IT\\d+@my\\.sliit\\.lk$");
    }

    // ================= SIGN UP =================
    @Override
    public AuthResponse signUp(UserDto.RegisterRequest request) {

        if (!isValidEmail(request.email())) {
            return AuthResponse.builder()
                    .message("Invalid email! Example: IT23687882@my.sliit.lk")
                    .success(false)
                    .build();
        }

        if (request.phoneNumber() == null || request.phoneNumber().isBlank()) {
            return AuthResponse.builder()
                    .message("Phone number required")
                    .success(false)
                    .build();
        }

        Optional<User> existing = userRepo.findByEmail(request.email());

        if (existing.isPresent() && existing.get().getIsVerified()) {
            return AuthResponse.builder()
                    .message("Email already exists")
                    .success(false)
                    .build();
        }

        User user = existing.orElse(new User());

        user.setFirstname(request.firstname());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhoneNumber(request.phoneNumber());
        user.setTempEmail(request.tempEmail());

        user.setRole(request.role() != null ? request.role() : Role.USER);
        user.setYear(request.year());
        user.setSemester(request.semester());

        user.setIsVerified(false);

        int otp = (int) (Math.random() * 900000) + 100000;

        user.setVerifyCode(String.valueOf(otp));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 2 * 60 * 1000));

        User saved = userRepo.save(user);

        String emailTemplate = """
                <html>
                    <body>
                         <h1>Welcome, %s!</h1>
                        <p>Your OTP: <b>%s</b></p>
                        <p>Verify:</p>
                        <a href="http://localhost:5173/verify?email=%s&code=%s">
                            Click Here
                        </a>
                    </body>
                </html>
                """.formatted(
                saved.getFirstname(),
                saved.getVerifyCode(),
                saved.getEmail(),
                saved.getVerifyCode()
        );

        try {
            emailUtils.sendMail(new MailBody(
                    saved.getEmail(),
                    "Verify Account",
                    emailTemplate
            ));
        } catch (Exception e) {
            return AuthResponse.builder()
                    .message("Email failed")
                    .success(false)
                    .build();
        }

        return AuthResponse.builder()
                .message("User registered")
                .success(true)
                .email(saved.getEmail())
                .year(saved.getYear())
                .semester(saved.getSemester())
                .build();
    }

    @Override
    public AuthResponse signIn(LoginRequest request, HttpServletResponse response) {

        User user = userRepo.findByEmail(request.email()).orElse(null);

        if (user == null) {
            return AuthResponse.builder()
                    .message("Email or password is incorrect")
                    .success(false)
                    .build();
        }

        if (!user.getIsVerified()) {
            return AuthResponse.builder()
                    .message("Email not verified! Please verify first.")
                    .success(false)
                    .build();
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );
        } catch (Exception e) {
            return AuthResponse.builder()
                    .message("Email or password is incorrect")
                    .success(false)
                    .build();
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole());

        String accessToken = jwtUtils.generateToken(claims, user, response, Token.ACCESS);
        String refreshToken = jwtUtils.generateToken(claims, user, response, Token.REFRESH);

        user.setRefreshToken(refreshToken);
        userRepo.save(user);

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .email(user.getEmail())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole())
                .year(user.getYear())
                .semester(user.getSemester())
                .build();
    }

    // ================= VERIFY OTP =================
    @Override
    public AuthResponse verifyCode(String email, String code) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getIsVerified()) {
            return AuthResponse.builder()
                    .message("Already verified")
                    .success(false)
                    .build();
        }

        if (!user.getVerifyCode().equals(code)) {
            return AuthResponse.builder()
                    .message("Invalid OTP")
                    .success(false)
                    .build();
        }

        if (user.getVerifyCodeExpiry().before(new Date())) {
            return AuthResponse.builder()
                    .message("OTP expired")
                    .success(false)
                    .build();
        }

        user.setIsVerified(true);
        user.setVerifyCode(null);
        user.setVerifyCodeExpiry(null);

        userRepo.save(user);

        return AuthResponse.builder()
                .message("Verified successfully")
                .success(true)
                .build();
    }

    // ================= RESEND OTP =================
    @Override
    public AuthResponse resendOtp(String email) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int otp = (int) (Math.random() * 900000) + 100000;

        user.setVerifyCode(String.valueOf(otp));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 2 * 60 * 1000));

        userRepo.save(user);

        try {
            emailUtils.sendMail(new MailBody(
                    user.getEmail(),
                    "Resend OTP",
                    "Your OTP: " + otp
            ));
        } catch (Exception e) {
            return AuthResponse.builder()
                    .message("Email failed")
                    .success(false)
                    .build();
        }

        return AuthResponse.builder()
                .message("OTP sent")
                .success(true)
                .build();
    }
}
