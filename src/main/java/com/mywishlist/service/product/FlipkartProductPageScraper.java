package com.mywishlist.service.product;

import com.mywishlist.service.ProductImportService.ImportedProduct;
import java.util.List;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class FlipkartProductPageScraper extends AbstractProductPageScraper {
    @Override
    public boolean supportsHost(String host) {
        String normalizedHost = host.toLowerCase();
        return normalizedHost.equals("flipkart.com")
                || normalizedHost.startsWith("www.flipkart.com")
                || normalizedHost.contains(".flipkart.com");
    }

    @Override
    public ImportedProduct scrape(Document document, String normalizedUrl) {
        String title = firstText(document, List.of(
                "span.VU-ZEz",
                "span.B_NuCI",
                "h1.yhB1nd span",
                "meta[property=og:title]"
        ));
        if (title.isBlank()) {
            throw new IllegalStateException("This link does not look like a supported product page.");
        }

        String imageUrl = firstAttr(document, List.of(
                "img._396cs4",
                "img.DByuf4",
                "div._4WELSP img",
                "meta[property=og:image]"
        ), "src");
        if (imageUrl.isBlank()) {
            imageUrl = firstAttr(document, List.of("meta[property=og:image]"), "content");
        }

        String price = firstText(document, List.of(
                "div.Nx9bqj.CxhGGd",
                "div._30jeq3._16Jk6d",
                "div._25b18c ._30jeq3",
                "meta[property=product:price:amount]"
        ));

        List<String> bullets = document.select(
                        "div.xFVion li, div._2418kt li, div._1mXcCf li, ul._1xgFaf li, div._2418kt div")
                .stream()
                .map(Element::text)
                .map(String::trim)
                .filter(text -> !text.isBlank() && text.length() > 8)
                .distinct()
                .limit(5)
                .toList();

        return new ImportedProduct("Flipkart", title, buildDescription(price, bullets), imageUrl, normalizedUrl);
    }
}
