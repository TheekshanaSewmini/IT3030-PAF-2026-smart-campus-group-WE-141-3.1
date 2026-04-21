package com.smartcampus.smart_campus.controller;

import com.smartcampus.smart_campus.service.ForgotPasswordService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/forgotpass")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody Map<String, String> request, HttpServletResponse response) {
        return forgotPasswordService.sendOtp(request, response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(HttpServletRequest request, HttpServletResponse response) {
        return forgotPasswordService.resendOtp(request, response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody Map<String, String> request,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse response) {
        return forgotPasswordService.verifyOtp(request, httpRequest, response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(HttpServletRequest request,
                                                 HttpServletResponse response,
                                                 @RequestBody UserDto.ChangePassword dto) {
        return forgotPasswordService.changePassword(request, response, dto);
    }
}

