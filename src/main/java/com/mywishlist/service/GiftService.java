package com.mywishlist.service;

import com.mywishlist.domain.GiftItem;
import com.mywishlist.domain.GiftStatus;
import com.mywishlist.domain.Occasion;
import com.mywishlist.repository.GiftItemRepository;
import com.mywishlist.repository.VendorRepository;
import java.time.Instant;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class GiftService {
    private static final Logger log = LoggerFactory.getLogger(GiftService.class);
    private final GiftItemRepository giftItemRepository;
    private final UserService userService;
    private final OccasionService occasionService;
    private final VendorRepository vendorRepository;

    public GiftService(GiftItemRepository giftItemRepository,
                       UserService userService,
                       OccasionService occasionService,
                       VendorRepository vendorRepository) {
        this.giftItemRepository = giftItemRepository;
        this.userService = userService;
        this.occasionService = occasionService;
        this.vendorRepository = vendorRepository;
    }

    public GiftItem create(String recipientId, String name, String description, String imageUrl, String purchaseLink, String occasionId) {
        userService.get(recipientId);
        if (occasionId != null) {
            Occasion occasion = occasionService.get(occasionId);
            if (!occasion.getRecipientId().equals(recipientId)) {
                throw new NotFoundException("Occasion does not belong to recipient");
            }
            occasionService.assertNotExpired(occasion);
        }
        String normalizedLink = appendVendorTag(purchaseLink);
        GiftItem item = new GiftItem(name, description, imageUrl, normalizedLink, recipientId, occasionId);
        return giftItemRepository.save(item);
    }

    public List<GiftItem> listForRecipient(String recipientId) {
        return giftItemRepository.findByRecipientIdAndDeletedFalse(recipientId);
    }

    public void delete(String giftId, String recipientId) {
        GiftItem gift = giftItemRepository.findByIdAndDeletedFalse(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (!gift.getRecipientId().equals(recipientId)) {
            throw new NotFoundException("Gift item not found");
        }
        if (gift.getOccasionId() != null) {
            Occasion occasion = occasionService.get(gift.getOccasionId());
            occasionService.assertNotExpired(occasion);
        }
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            throw new IllegalStateException("Purchased gifts cannot be deleted");
        }
        gift.setDeleted(true);
        giftItemRepository.save(gift);
    }

    public GiftItem purchase(String giftId, String purchaserId) {
        GiftItem gift = giftItemRepository.findByIdAndDeletedFalse(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            return gift;
        }
        userService.get(purchaserId);
        gift.markPurchased(purchaserId, Instant.now());
        return giftItemRepository.save(gift);
    }

    public GiftItem reserveForGuest(String giftId, String guestName, String guestEmail) {
        GiftItem gift = giftItemRepository.findByIdAndDeletedFalse(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            throw new IllegalStateException("Gift already purchased");
        }
        if (gift.getStatus() == GiftStatus.RESERVED
                && gift.getReservedByEmail() != null
                && !gift.getReservedByEmail().equals(guestEmail)) {
            throw new IllegalStateException("Gift already reserved");
        }
        gift.markReserved(guestName, guestEmail, Instant.now());
        return giftItemRepository.save(gift);
    }

    public GiftItem purchaseForGuest(String giftId, String guestName, String guestEmail) {
        GiftItem gift = giftItemRepository.findByIdAndDeletedFalse(giftId)
                .orElseThrow(() -> new NotFoundException("Gift item not found"));
        if (gift.getStatus() == GiftStatus.PURCHASED) {
            throw new IllegalStateException("Gift already purchased");
        }
        if (gift.getStatus() == GiftStatus.RESERVED
                && gift.getReservedByEmail() != null
                && !gift.getReservedByEmail().equals(guestEmail)) {
            throw new IllegalStateException("Gift already reserved");
        }
        gift.markPurchasedByGuest(guestName, guestEmail, Instant.now());
        return giftItemRepository.save(gift);
    }

    public List<GiftItem> listForOccasion(String occasionId) {
        occasionService.get(occasionId);
        return giftItemRepository.findByOccasionIdAndDeletedFalse(occasionId);
    }

    private String appendVendorTag(String purchaseLink) {
        if (purchaseLink == null || purchaseLink.isBlank()) {
            log.warn("Purchase link is null/blank; skipping tag append.");
            return purchaseLink;
        }
        String normalized = normalizeUrl(purchaseLink);
        log.info("purchase link:{}" , normalized);
        String domain = extractDomain(normalized);
        if (domain == null) {
            log.warn("Could not parse domain from purchase link: {}", normalized);
            return purchaseLink;
        }
        log.info("domain link:{}" , domain);
        return vendorRepository.findByDomain(domain)
                .filter(vendor -> vendor.getTagId() != null && !vendor.getTagId().isBlank())
                .map(vendor -> appendQueryParam(normalized, "tag", vendor.getTagId()))
                .orElseGet(() -> {
                    log.warn("No tagId configured for vendor domain: {}", domain);
                    return normalized;
                });
    }

    private String extractDomain(String url) {
        try {
            URI uri = new URI(url);
            String host = uri.getHost();
            if (host == null) {
                return null;
            }
            return host.startsWith("www.") ? host.substring(4) : host;
        } catch (URISyntaxException ex) {
            return null;
        }
    }

    private String normalizeUrl(String url) {
        String trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return "https://" + trimmed;
    }

    private String appendQueryParam(String url, String key, String value) {
        try {
            URI uri = new URI(url);
            Map<String, String> params = parseQuery(uri.getRawQuery());
            params.put(key, value);
            String newQuery = buildQuery(params);
            URI updated = new URI(
                    uri.getScheme(),
                    uri.getAuthority(),
                    uri.getPath(),
                    newQuery,
                    uri.getFragment()
            );
            return updated.toString();
        } catch (URISyntaxException ex) {
            return url;
        }
    }

    private Map<String, String> parseQuery(String query) {
        Map<String, String> params = new LinkedHashMap<>();
        if (query == null || query.isBlank()) {
            return params;
        }
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx > -1) {
                String k = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                String v = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                params.put(k, v);
            } else {
                params.put(URLDecoder.decode(pair, StandardCharsets.UTF_8), "");
            }
        }
        return params;
    }

    private String buildQuery(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (sb.length() > 0) {
                sb.append("&");
            }
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            sb.append("=");
            sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }
}
