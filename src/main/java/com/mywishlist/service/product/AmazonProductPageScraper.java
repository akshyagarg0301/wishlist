package com.mywishlist.service.product;

import com.mywishlist.service.ProductImportService.ImportedProduct;
import java.util.List;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class AmazonProductPageScraper extends AbstractProductPageScraper {
    @Override
    public boolean supportsHost(String host) {
        String normalizedHost = host.toLowerCase();
        return normalizedHost.equals("amzn.to")
                || normalizedHost.startsWith("amzn.")
                || normalizedHost.equals("amazon.com")
                || normalizedHost.startsWith("www.amazon.")
                || normalizedHost.startsWith("smile.amazon.")
                || normalizedHost.contains(".amazon.");
    }

    @Override
    public ImportedProduct scrape(Document document, String normalizedUrl) {
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

        return new ImportedProduct("Amazon", title, buildDescription(price, bullets), imageUrl, normalizedUrl);
    }
}
