package com.mywishlist.service.sms;

public interface SmsSender {
    void sendOtp(String phone, String message);
}
