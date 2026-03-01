package com.mywishlist.service.sms;

import java.util.HashMap;
import java.util.Map;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.MessageAttributeValue;
import software.amazon.awssdk.services.sns.model.PublishRequest;

public class AwsSnsSmsSender implements SmsSender {
    private final SnsClient snsClient;
    private final String senderId;
    private final String entityId;
    private final String templateId;

    public AwsSnsSmsSender(SnsClient snsClient, String senderId, String entityId, String templateId) {
        this.snsClient = snsClient;
        this.senderId = senderId;
        this.entityId = entityId;
        this.templateId = templateId;
    }

    @Override
    public void sendOtp(String phone, String message) {
        Map<String, MessageAttributeValue> attrs = new HashMap<>();
        attrs.put("AWS.SNS.SMS.SMSType", MessageAttributeValue.builder()
                .dataType("String")
                .stringValue("Transactional")
                .build());
        if (senderId != null && !senderId.isBlank()) {
            attrs.put("AWS.SNS.SMS.SenderID", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(senderId)
                    .build());
        }
        if (entityId != null && !entityId.isBlank()) {
            attrs.put("AWS.MM.SMS.EntityId", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(entityId)
                    .build());
        }
        if (templateId != null && !templateId.isBlank()) {
            attrs.put("AWS.MM.SMS.TemplateId", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(templateId)
                    .build());
        }
        snsClient.publish(PublishRequest.builder()
                .message(message)
                .phoneNumber(phone)
                .messageAttributes(attrs)
                .build());
    }
}
