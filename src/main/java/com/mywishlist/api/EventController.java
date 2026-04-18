package com.mywishlist.api;

import com.mywishlist.api.dto.EventDtos.CreateEventRequest;
import com.mywishlist.api.dto.EventDtos.EventResponse;
import com.mywishlist.domain.Event;
import com.mywishlist.security.CurrentUserContext;
import com.mywishlist.service.EventService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public EventResponse create(@Valid @RequestBody CreateEventRequest request) {
        boolean surpriseMode = request.surpriseMode() == null || request.surpriseMode();
        Event event = eventService.create(
                CurrentUserContext.getUserId(),
                request.title(),
                request.eventDate(),
                request.imageUrl(),
                surpriseMode
        );
        return toResponse(event);
    }

    @GetMapping
    public List<EventResponse> list() {
        return eventService.listForRecipient(CurrentUserContext.getUserId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @DeleteMapping("/{eventId}")
    public void delete(@PathVariable String eventId) {
        eventService.delete(eventId, CurrentUserContext.getUserId());
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getEventDate(),
                event.getImageUrl(),
                event.getRecipientId(),
                event.isSurpriseMode(),
                event.isRevealUnlocked(),
                event.getRevealAt(),
                eventService.isExpired(event)
        );
    }
}
