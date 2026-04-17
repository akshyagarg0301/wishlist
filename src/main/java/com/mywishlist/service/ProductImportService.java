package com.mywishlist.service;

import com.mywishlist.service.product.ProductPageScraper;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

@Service
public class ProductImportService {
    private static final String USER_AGENT =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    private final List<ProductPageScraper> scrapers;

    public ProductImportService(List<ProductPageScraper> scrapers) {
        this.scrapers = scrapers;
    }

    public boolean supports(String rawUrl) {
        try {
            URI uri = toSupportedUri(rawUrl);
            return resolveScraper(uri) != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public ImportedProduct previewProduct(String rawUrl) {
        URI uri = toSupportedUri(rawUrl);
        ProductPageScraper scraper = resolveScraper(uri);
        if (scraper == null) {
            throw new IllegalArgumentException("This product link is not supported yet.");
        }

        Document document = fetchDocument(uri.toString());
        String finalUrl = document.location().isBlank() ? uri.toString() : document.location();
        return scraper.scrape(document, stripQuery(finalUrl));
    }

    private ProductPageScraper resolveScraper(URI uri) {
        String host = uri.getHost();
        if (host == null) {
            return null;
        }
        return scrapers.stream()
                .filter(scraper -> scraper.supportsHost(host))
                .findFirst()
                .orElse(null);
    }

    private URI toSupportedUri(String rawUrl) {
        String value = rawUrl == null ? "" : rawUrl.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Product link is required.");
        }
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://" + value;
        }
        try {
            URI uri = new URI(value);
            if (uri.getHost() == null) {
                throw new IllegalArgumentException("Invalid product link.");
            }
            return uri;
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Invalid product link.");
        }
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
