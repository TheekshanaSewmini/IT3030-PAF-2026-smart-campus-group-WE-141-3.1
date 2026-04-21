package com.smartcampus.smart_campus.utils;

import com.smartcampus.smart_campus.records.MailBody;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailUtils {

    private final JavaMailSenderImpl javaMailSender;

    public EmailUtils(JavaMailSenderImpl javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendMail(MailBody mailBody) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(mailBody.to());
            helper.setFrom("no-reply@yourapp.com");
            helper.setSubject(mailBody.subject());
            helper.setText(mailBody.text(), true);

            javaMailSender.send(message);

            log.info("Email sent successfully to {}", mailBody.to());

        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", mailBody.to(), e.getMessage());
        }
    }
}

