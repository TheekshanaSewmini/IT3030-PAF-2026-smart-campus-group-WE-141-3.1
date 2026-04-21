package com.smartcampus.smart_campus.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartcampus.smart_campus.enums.RecoveryChannel;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "forgot_password")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "user")
public class ForgotPassword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer fid;

    @Column(nullable = false, length = 6)
    private Integer otp;

    @Column(nullable = false)
    private Date expirationTime;

    // Resend OTP tracking
    private Integer resendCount;
    private Date firstResendTime;

    @Enumerated(EnumType.STRING)
    private RecoveryChannel recoveryChannel;

    private Date blockUntil;
    private Date lastSentAt;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
}
