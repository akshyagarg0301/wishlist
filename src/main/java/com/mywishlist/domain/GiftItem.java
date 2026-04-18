package com.mywishlist.domain;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("gift_items")
@CompoundIndexes({
        @CompoundIndex(name = "gift_recipient_deleted_idx", def = "{'recipientId': 1, 'deleted': 1}"),
        @CompoundIndex(name = "gift_event_deleted_idx", def = "{'eventId': 1, 'deleted': 1}")
})
public class GiftItem {
    @Id
    private String id;

    private String name;

    private String description;

    private String imageUrl;

    private String purchaseLink;

    private GiftStatus status = GiftStatus.AVAILABLE;

    private String recipientId;

    private String eventId;

    @Indexed
    private boolean deleted;

    private String purchasedById;

    private String reservedByName;

    private String reservedByEmail;

    private Instant reservedAt;

    private String purchasedByName;

    private String purchasedByEmail;

    private Instant purchasedAt;

    protected GiftItem() {
    }

    public GiftItem(String name, String description, String imageUrl, String purchaseLink, String recipientId, String eventId) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.purchaseLink = purchaseLink;
        this.recipientId = recipientId;
        this.eventId = eventId;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getPurchaseLink() {
        return purchaseLink;
    }

    public GiftStatus getStatus() {
        return status;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public String getEventId() {
        return eventId;
    }

    public String getPurchasedById() {
        return purchasedById;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public String getReservedByName() {
        return reservedByName;
    }

    public String getReservedByEmail() {
        return reservedByEmail;
    }

    public Instant getReservedAt() {
        return reservedAt;
    }

    public String getPurchasedByName() {
        return purchasedByName;
    }

    public String getPurchasedByEmail() {
        return purchasedByEmail;
    }

    public Instant getPurchasedAt() {
        return purchasedAt;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setPurchaseLink(String purchaseLink) {
        this.purchaseLink = purchaseLink;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public void markReserved(String name, String email, Instant reservedAt) {
        this.reservedByName = name;
        this.reservedByEmail = email;
        this.reservedAt = reservedAt;
        this.status = GiftStatus.RESERVED;
    }

    public void markPurchased(String purchaserId, Instant purchasedAt) {
        this.purchasedById = purchaserId;
        this.purchasedAt = purchasedAt;
        this.status = GiftStatus.PURCHASED;
    }

    public void markPurchasedByGuest(String name, String email, Instant purchasedAt) {
        this.purchasedByName = name;
        this.purchasedByEmail = email;
        this.purchasedAt = purchasedAt;
        this.status = GiftStatus.PURCHASED;
    }
}
