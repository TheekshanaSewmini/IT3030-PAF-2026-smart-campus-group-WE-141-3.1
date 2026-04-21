package com.smartcampus.smart_campus.service;

import com.smartcampus.smart_campus.dtos.AuthResponse;
import com.smartcampus.smart_campus.dtos.UserDto;
import com.smartcampus.smart_campus.records.LoginRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    AuthResponse signUp(UserDto.RegisterRequest registerRequest);

    AuthResponse signIn(LoginRequest loginRequest, HttpServletResponse response);

    AuthResponse verifyCode(String email, String verifyCode);

    AuthResponse resendOtp(String email);
}

