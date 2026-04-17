package com.mywishlist.api;

import com.mywishlist.api.dto.ImportDtos.ImportPreviewRequest;
import com.mywishlist.api.dto.ImportDtos.ImportPreviewResponse;
import com.mywishlist.service.ProductImportService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/imports")
public class ImportController {
    private final ProductImportService productImportService;

    public ImportController(ProductImportService productImportService) {
        this.productImportService = productImportService;
    }

    @PostMapping("/preview")
    public ImportPreviewResponse preview(@Valid @RequestBody ImportPreviewRequest request) {
        ProductImportService.ImportedProduct product = productImportService.previewProduct(request.url());
        return new ImportPreviewResponse(
                product.source(),
                product.name(),
                product.description(),
                product.imageUrl(),
                product.purchaseLink()
        );
    }
}
