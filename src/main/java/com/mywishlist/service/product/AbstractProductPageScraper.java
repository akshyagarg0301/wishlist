package com.mywishlist.service.product;

import java.util.List;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

abstract class AbstractProductPageScraper implements ProductPageScraper {
    protected String firstText(Document document, List<String> selectors) {
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

    protected String firstAttr(Document document, List<String> selectors, String attribute) {
        for (String selector : selectors) {
            Element element = document.selectFirst(selector);
            String value = element == null ? "" : element.attr(attribute).trim();
            if (!value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    protected String buildDescription(String price, List<String> bullets) {
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
}
