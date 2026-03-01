package com.mywishlist.config;

import com.mywishlist.service.sms.AwsSnsSmsSender;
import com.mywishlist.service.sms.NoopSmsSender;
import com.mywishlist.service.sms.SmsSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;

@Configuration
public class SmsConfig {
    @Value("${sms.provider:noop}")
    private String provider;

    @Value("${sms.aws.region:${AWS_REGION:}}")
    private String region;

    @Value("${sms.aws.sender-id:}")
    private String senderId;

    @Value("${sms.aws.entity-id:}")
    private String entityId;

    @Value("${sms.aws.template-id:}")
    private String templateId;

    @Bean
    public SmsSender smsSender() {
        if (!"aws_sns".equalsIgnoreCase(provider)) {
            return new NoopSmsSender();
        }
        SnsClient snsClient = SnsClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
        return new AwsSnsSmsSender(snsClient, senderId, entityId, templateId);
    }
}
