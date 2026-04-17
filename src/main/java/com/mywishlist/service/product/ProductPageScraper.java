package com.mywishlist.service.product;

import com.mywishlist.service.ProductImportService.ImportedProduct;
import org.jsoup.nodes.Document;

public interface ProductPageScraper {
    boolean supportsHost(String host);

    ImportedProduct scrape(Document document, String normalizedUrl);
}
