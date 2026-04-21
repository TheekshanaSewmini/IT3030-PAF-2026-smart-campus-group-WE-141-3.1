package com.smartcampus.smart_campus.service;

import com.smartcampus.smart_campus.dtos.UserDto;
import com.smartcampus.smart_campus.entities.ForgotPassword;
import com.smartcampus.smart_campus.entities.User;
import com.smartcampus.smart_campus.records.MailBody;
import com.smartcampus.smart_campus.repo.ForgotPasswordRepository;
import com.smartcampus.smart_campus.repo.UserRepo;
import com.smartcampus.smart_campus.utils.EmailUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final ForgotPasswordRepository forgotPasswordRepository;
    private final EmailUtils emailUtils;

    // ================= CURRENT USER =================
    @Override
    public User getCurrentUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ================= DELETE ACCOUNT =================
    @Transactional
    @Override
    public void deleteAccount(User user, UserDto.DeleteAccountDto dto) {

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        userRepo.delete(user);
    }

    // ================= REQUEST DELETE OTP =================
    @Transactional
    @Override
    public void requestDeletion(User user) {

        int otp = new Random().nextInt(900000) + 100000;
        Date expiration = new Date(System.currentTimeMillis() + 10 * 60 * 1000);

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElse(new ForgotPassword());

        fp.setUser(user);
        fp.setOtp(otp);
        fp.setExpirationTime(expiration);
        fp.setLastSentAt(new Date());

        forgotPasswordRepository.save(fp);

        emailUtils.sendMail(new MailBody(
                user.getEmail(),
                "OTP for Account Deletion",
                "Your OTP is: " + otp + " (valid for 10 minutes)"
        ));
    }

    // ================= VERIFY + DELETE =================
    @Transactional
    @Override
    public void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto) {

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not requested"));

        if (!fp.getOtp().equals(Integer.parseInt(dto.otp()))) {
            throw new RuntimeException("Invalid OTP");
        }

        if (fp.getExpirationTime().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        userRepo.delete(user);
        forgotPasswordRepository.delete(fp);
    }

    // ================= UPDATE NAME =================
    @Transactional
    @Override
    public UserDto.UpdateNameDto updateName(User user, UserDto.UpdateNameDto dto) {

        user.setFirstname(dto.name());
        user.setLastName(dto.lastName());

        userRepo.save(user);

        return new UserDto.UpdateNameDto(
                user.getFirstname(),
                user.getLastName()
        );
    }

    // ================= UPDATE EMAIL =================
    @Transactional
    @Override
    public UserDto.UpdateEmailDto updateEmail(User user, UserDto.UpdateEmailDto dto) {

        String newEmail = dto.newEmail();

        if (userRepo.findByEmail(newEmail).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        int otp = new Random().nextInt(900000) + 100000;

        user.setTempEmail(newEmail);
        user.setVerifyCode(String.valueOf(otp));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        user.setLastOtpSentAt(new Date());

        userRepo.save(user);

        emailUtils.sendMail(new MailBody(
                newEmail,
                "Verify New Email",
                "Your OTP is: " + otp + " (valid for 5 minutes)"
        ));

        return new UserDto.UpdateEmailDto(newEmail);
    }

    // ================= VERIFY NEW EMAIL =================
    @Transactional
    @Override
    public void verifyNewEmail(User user, String otp) {

        if (user.getVerifyCode() == null) {
            throw new RuntimeException("OTP not found");
        }

        if (!user.getVerifyCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getVerifyCodeExpiry().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        user.setEmail(user.getTempEmail());
        user.setTempEmail(null);
        user.setVerifyCode(null);
        user.setVerifyCodeExpiry(null);

        userRepo.save(user);
    }

    // ================= UPDATE PASSWORD =================
    @Transactional
    @Override
    public void updatePassword(User user, UserDto.UpdatePasswordDto dto) {

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!dto.newPassword().equals(dto.confirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);
    }

    // ================= HOME =================
    @Override
    public UserDto.UserHomeDto getUserHome(Long userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserDto.UserHomeDto(
                "Welcome back, " + user.getFirstname() + "!",
                3,
                5
        );
    }

    // ================= PROFILE (FIXED - NO INTEREST) =================
    @Override
    public UserDto.UserProfileDto getProfile(Long userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserDto.UserProfileDto(
                user.getUserId(),
                user.getFirstname(),
                user.getEmail(),
                user.getLastName(),
                user.getRole(),
                user.getPhoneNumber(),
                user.getTempEmail(),
                user.getImageUrl(),
                user.getCoverImageUrl(),
                user.getYear(),
                user.getSemester()
        );
    }
}