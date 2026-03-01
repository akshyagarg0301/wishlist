package com.mywishlist.service.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NoopSmsSender implements SmsSender {
    private static final Logger log = LoggerFactory.getLogger(NoopSmsSender.class);

    @Override
    public void sendOtp(String phone, String message) {
        log.info("SMS not configured. Would send to {}: {}", phone, message);
    }
}
