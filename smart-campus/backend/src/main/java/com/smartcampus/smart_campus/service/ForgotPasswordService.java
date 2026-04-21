package com.smartcampus.smart_campus.service;

import com.smartcampus.smart_campus.dtos.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface ForgotPasswordService {

    ResponseEntity<String> sendOtp(Map<String, String> request, HttpServletResponse response);

    ResponseEntity<String> resendOtp(HttpServletRequest request, HttpServletResponse response);

    ResponseEntity<String> verifyOtp(Map<String, String> request, HttpServletRequest requestObj, HttpServletResponse response);

    ResponseEntity<String> changePassword(HttpServletRequest request, HttpServletResponse response, UserDto.ChangePassword dto);
}

