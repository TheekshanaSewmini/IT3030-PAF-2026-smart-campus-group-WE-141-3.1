package com.smartcampus.smart_campus.service;

import com.smartcampus.smart_campus.dtos.UserDto;
import com.smartcampus.smart_campus.entities.ForgotPassword;
import com.smartcampus.smart_campus.entities.User;
import com.smartcampus.smart_campus.enums.Token;
import com.smartcampus.smart_campus.records.MailBody;
import com.smartcampus.smart_campus.repo.ForgotPasswordRepository;
import com.smartcampus.smart_campus.repo.UserRepo;
import com.smartcampus.smart_campus.utils.EmailUtils;
import com.smartcampus.smart_campus.utils.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ForgotPasswordServiceImpl implements ForgotPasswordService {

    private final UserRepo userRepo;
    private final ForgotPasswordRepository forgotRepo;
    private final EmailUtils emailUtils;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    // ================= SEND OTP =================
    @Override
    public ResponseEntity<String> sendOtp(Map<String, String> request, HttpServletResponse response) {

        String email = request.get("email");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ForgotPassword fp = forgotRepo.findByUser(user).orElse(new ForgotPassword());

        int otp = generateOtp();

        fp.setUser(user);
        fp.setOtp(otp);
        fp.setExpirationTime(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        fp.setResendCount(0);
        fp.setLastSentAt(new Date());

        forgotRepo.save(fp);

        emailUtils.sendMail(new MailBody(
                user.getEmail(),
                "Forgot Password OTP",
                "Your OTP is: " + otp
        ));

        addCookie(response, user.getEmail());

        return ResponseEntity.ok("OTP sent successfully");
    }

    // ================= RESEND OTP =================
    @Override
    public ResponseEntity<String> resendOtp(HttpServletRequest request, HttpServletResponse response) {

        String email = getEmailFromCookie(request);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ForgotPassword fp = forgotRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not requested"));

        if (fp.getResendCount() >= 3) {
            return ResponseEntity.badRequest().body("Max resend limit reached");
        }

        int otp = generateOtp();

        fp.setOtp(otp);
        fp.setExpirationTime(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        fp.setResendCount(fp.getResendCount() + 1);

        forgotRepo.save(fp);

        emailUtils.sendMail(new MailBody(
                user.getEmail(),
                "Resend OTP",
                "Your new OTP: " + otp
        ));

        return ResponseEntity.ok("OTP resent (" + fp.getResendCount() + "/3)");
    }

    // ================= VERIFY OTP =================
    @Override
    public ResponseEntity<String> verifyOtp(
            Map<String, String> request,
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {

        String email = getEmailFromCookie(httpRequest);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ForgotPassword fp = forgotRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        int otp = Integer.parseInt(request.get("otp"));

        if (!Objects.equals(fp.getOtp(), otp))
            return ResponseEntity.badRequest().body("Invalid OTP");

        if (fp.getExpirationTime().before(new Date()))
            return ResponseEntity.badRequest().body("OTP expired");

        jwtUtils.generateToken(Map.of(), user, response, Token.VERIFY);

        return ResponseEntity.ok("OTP verified successfully");
    }

    // ================= CHANGE PASSWORD =================
    @Override
    public ResponseEntity<String> changePassword(
            HttpServletRequest request,
            HttpServletResponse response,
            UserDto.ChangePassword dto
    ) {

        String token = jwtUtils.getTokenFromCookie(request, Token.VERIFY);

        if (token == null)
            return ResponseEntity.badRequest().body("Unauthorized");

        String email = jwtUtils.extractUsername(token);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!dto.password().equals(dto.repeatPassword()))
            return ResponseEntity.badRequest().body("Passwords do not match");

        user.setPassword(passwordEncoder.encode(dto.password()));
        userRepo.save(user);

        forgotRepo.findByUser(user).ifPresent(forgotRepo::delete);

        jwtUtils.removeToken(response, Token.VERIFY);

        return ResponseEntity.ok("Password changed successfully");
    }

    // ================= HELPERS =================

    private int generateOtp() {
        return new Random().nextInt(900000) + 100000;
    }

    private void addCookie(HttpServletResponse response, String email) {
        Cookie cookie = new Cookie("forgotEmail", email);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(10 * 60);
        response.addCookie(cookie);
    }

    private String getEmailFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;

        for (Cookie c : request.getCookies()) {
            if ("forgotEmail".equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}

