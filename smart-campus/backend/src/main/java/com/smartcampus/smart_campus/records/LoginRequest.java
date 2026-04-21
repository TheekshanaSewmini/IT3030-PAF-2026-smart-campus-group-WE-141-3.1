package com.smartcampus.smart_campus.records;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @Email(message = "please provide valid email") String email,
        @NotBlank(message = "password is required ") String password) {

}


