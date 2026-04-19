package com.mywishlist.service;

import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.Event;
import com.mywishlist.repository.GiftItemRepository;
import com.mywishlist.repository.EventRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class EventService {
    private final EventRepository eventRepository;
    private final GiftItemRepository giftItemRepository;

    public EventService(EventRepository eventRepository, GiftItemRepository giftItemRepository) {
        this.eventRepository = eventRepository;
        this.giftItemRepository = giftItemRepository;
    }

    public Event create(String recipientId, String title, LocalDate eventDate, String imageUrl, boolean surpriseMode) {
        validateEventDate(eventDate);
        LocalDate revealAt = eventDate != null ? eventDate.plusDays(1) : null;
        Event event = new Event(title, eventDate, imageUrl, recipientId, surpriseMode, revealAt);
        return eventRepository.save(event);
    }

    public List<Event> listForRecipient(String recipientId) {
        return eventRepository.findByRecipientIdAndDeletedFalse(recipientId);
    }

    public Map<String, Long> getGiftCountsForRecipient(String recipientId) {
        return giftItemRepository.findByRecipientIdAndDeletedFalse(recipientId).stream()
                .filter(item -> item.getEventId() != null && !item.getEventId().isBlank())
                .collect(Collectors.groupingBy(GiftItem::getEventId, Collectors.counting()));
    }

    public int getGiftCountForEvent(String eventId) {
        return giftItemRepository.findByEventIdAndDeletedFalse(eventId).size();
    }

    public Event get(String id) {
        return eventRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Event not found"));
    }

    public void delete(String id, String recipientId) {
        Event event = get(id);
        assertOwner(event, recipientId);
        List<GiftItem> gifts = giftItemRepository.findByEventIdAndDeletedFalse(id);
        boolean hasPurchased = gifts.stream()
                .anyMatch(item -> item.getStatus() == com.mywishlist.domain.GiftStatus.PURCHASED);
        if (hasPurchased) {
            throw new IllegalStateException("Event has purchased gifts and cannot be deleted");
        }
        gifts.forEach(gift -> gift.setDeleted(true));
        if (!gifts.isEmpty()) {
            giftItemRepository.saveAll(gifts);
        }
        event.setDeleted(true);
        eventRepository.save(event);
    }

    public Event reveal(String id, String recipientId) {
        Event event = get(id);
        assertOwner(event, recipientId);
        assertNotExpired(event);
        event.setRevealUnlocked(true);
        return eventRepository.save(event);
    }

    public Event hide(String id, String recipientId) {
        Event event = get(id);
        assertOwner(event, recipientId);
        assertNotExpired(event);
        event.setRevealUnlocked(false);
        return eventRepository.save(event);
    }

    public boolean isExpired(Event event) {
        LocalDate eventDate = event.getEventDate();
        return eventDate != null && eventDate.isBefore(LocalDate.now());
    }

    public Long getDaysUntil(Event event) {
        LocalDate eventDate = event.getEventDate();
        if (eventDate == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), eventDate);
    }

    public void assertNotExpired(Event event) {
        if (isExpired(event)) {
            throw new IllegalStateException("Expired events can only be deleted");
        }
    }

    public boolean isRevealActive(Event event) {
        if (!event.isSurpriseMode()) {
            return true;
        }
        if (event.isRevealUnlocked()) {
            return true;
        }
        LocalDate revealAt = event.getRevealAt();
        return revealAt != null && !revealAt.isAfter(LocalDate.now());
    }

    private void assertOwner(Event event, String recipientId) {
        if (!event.getRecipientId().equals(recipientId)) {
            throw new NotFoundException("Event not found");
        }
    }

    private void validateEventDate(LocalDate eventDate) {
        if (eventDate != null && eventDate.isBefore(LocalDate.now())) {
            throw new IllegalStateException("Event date must be today or in the future");
        }
    }
}
