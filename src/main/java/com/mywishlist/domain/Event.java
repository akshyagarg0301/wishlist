package com.mywishlist.domain;

import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("events")
@CompoundIndex(name = "event_recipient_deleted_idx", def = "{'recipientId': 1, 'deleted': 1}")
public class Event {
    @Id
    private String id;

    private String title;

    private LocalDate eventDate;

    private String imageUrl;

    @Indexed
    private String recipientId;

    @Indexed
    private boolean deleted;

    private boolean surpriseMode = true;

    private boolean revealUnlocked;

    private LocalDate revealAt;

    protected Event() {
    }

    public Event(String title, LocalDate eventDate, String imageUrl, String recipientId, boolean surpriseMode, LocalDate revealAt) {
        this.title = title;
        this.eventDate = eventDate;
        this.imageUrl = imageUrl;
        this.recipientId = recipientId;
        this.surpriseMode = surpriseMode;
        this.revealAt = revealAt;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public boolean isSurpriseMode() {
        return surpriseMode;
    }

    public boolean isRevealUnlocked() {
        return revealUnlocked;
    }

    public LocalDate getRevealAt() {
        return revealAt;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }

    public void setSurpriseMode(boolean surpriseMode) {
        this.surpriseMode = surpriseMode;
    }

    public void setRevealUnlocked(boolean revealUnlocked) {
        this.revealUnlocked = revealUnlocked;
    }

    public void setRevealAt(LocalDate revealAt) {
        this.revealAt = revealAt;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}
