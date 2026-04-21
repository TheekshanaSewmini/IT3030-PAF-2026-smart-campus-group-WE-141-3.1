package com.smartcampus.smart_campus.service;

import com.smartcampus.smart_campus.records.MailBody;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

@Service
public class EmailService{


    private final JavaMailSender javaMailSender;


    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public  void sendSimpleMessasge(MailBody mailBody){


        SimpleMailMessage message= new SimpleMailMessage();
        message.setTo(mailBody.to());
        message.setFrom("anuradhawork123@gmail.com");
        message.setSubject(mailBody.subject());
        message.setText(mailBody.text());


        javaMailSender.send(message);
    }
}


