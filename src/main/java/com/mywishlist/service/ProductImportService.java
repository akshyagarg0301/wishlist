package com.mywishlist.service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

@Service
public class ProductImportService {
    private static final String USER_AGENT =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    public boolean supports(String rawUrl) {
        try {
            String normalizedUrl = normalizeAndValidateUrl(rawUrl);
            URI uri = new URI(normalizedUrl);
            return uri.getHost() != null && isSupportedProductHost(uri.getHost());
        } catch (IllegalArgumentException | URISyntaxException ex) {
            return false;
        }
    }

    public ImportedProduct previewProduct(String rawUrl) {
        String normalizedUrl = normalizeAndValidateUrl(rawUrl);
        Document document = fetchDocument(normalizedUrl);

        String title = firstText(document, List.of(
                "#productTitle",
                "#title span",
                "h1.a-size-large span",
                "meta[property=og:title]"
        ));
        if (title.isBlank()) {
            throw new IllegalStateException("This link does not look like a supported product page.");
        }

        String imageUrl = firstAttr(document, List.of(
                "#landingImage",
                "#imgTagWrapperId img",
                "#main-image-container img"
        ), "src");
        if (imageUrl.isBlank()) {
            imageUrl = firstAttr(document, List.of("#landingImage"), "data-old-hires");
        }
        if (imageUrl.isBlank()) {
            imageUrl = firstAttr(document, List.of("meta[property=og:image]"), "content");
        }

        String price = firstText(document, List.of(
                ".apexPriceToPay .a-offscreen",
                "#corePrice_feature_div .a-offscreen",
                ".reinventPricePriceToPayMargin .a-offscreen",
                "#priceblock_ourprice",
                "#priceblock_dealprice",
                "meta[property=product:price:amount]"
        ));

        List<String> bullets = document.select("#feature-bullets li span.a-list-item, #feature-bullets li span").stream()
                .map(Element::text)
                .map(String::trim)
                .filter(text -> !text.isBlank() && text.length() > 8)
                .distinct()
                .limit(5)
                .toList();

        String description = buildDescription(price, bullets);
        String purchaseLink = stripQuery(document.location().isBlank() ? normalizedUrl : document.location());

        return new ImportedProduct("Amazon", title, description, imageUrl, purchaseLink);
    }

    private Document fetchDocument(String url) {
        try {
            return Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .referrer("https://www.google.com/")
                    .timeout((int) Duration.ofSeconds(15).toMillis())
                    .followRedirects(true)
                    .get();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not fetch product details from this link.");
        }
    }

    private String normalizeAndValidateUrl(String rawUrl) {
        String value = rawUrl == null ? "" : rawUrl.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Product link is required.");
        }
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://" + value;
        }
        try {
            URI uri = new URI(value);
            String host = uri.getHost();
            if (host == null || !isSupportedProductHost(host)) {
                throw new IllegalArgumentException("This product link is not supported yet.");
            }
            return uri.toString();
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Invalid product link.");
        }
    }

    private boolean isSupportedProductHost(String host) {
        String normalizedHost = host.toLowerCase();
        return normalizedHost.equals("amzn.to")
                || normalizedHost.startsWith("amzn.")
                || normalizedHost.equals("amazon.com")
                || normalizedHost.startsWith("www.amazon.")
                || normalizedHost.startsWith("smile.amazon.")
                || normalizedHost.contains(".amazon.");
    }

    private String firstText(Document document, List<String> selectors) {
        for (String selector : selectors) {
            Element element = document.selectFirst(selector);
            if (element == null) {
                continue;
            }
            String value = "meta".equalsIgnoreCase(element.tagName())
                    ? element.attr("content").trim()
                    : element.text().trim();
            if (!value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String firstAttr(Document document, List<String> selectors, String attribute) {
        for (String selector : selectors) {
            Element element = document.selectFirst(selector);
            String value = element == null ? "" : element.attr(attribute).trim();
            if (!value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String buildDescription(String price, List<String> bullets) {
        StringBuilder description = new StringBuilder();
        if (!price.isBlank()) {
            description.append("Price: ").append(price);
        }
        if (!bullets.isEmpty()) {
            if (description.length() > 0) {
                description.append("\n\n");
            }
            description.append(String.join("\n", bullets));
        }
        return description.toString();
    }

    private String stripQuery(String rawUrl) {
        try {
            URI uri = new URI(rawUrl);
            return new URI(uri.getScheme(), uri.getAuthority(), uri.getPath(), null, null).toString();
        } catch (URISyntaxException ex) {
            return rawUrl;
        }
    }

    public record ImportedProduct(
            String source,
            String name,
            String description,
            String imageUrl,
            String purchaseLink
    ) {
    }
}
