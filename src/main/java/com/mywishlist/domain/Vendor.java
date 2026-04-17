package com.mywishlist.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("vendors")
public class Vendor {
    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String domain;

    private String tagId;

    protected Vendor() {
    }

    public Vendor(String name, String domain, String tagId) {
        this.name = name;
        this.domain = domain;
        this.tagId = tagId;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDomain() {
        return domain;
    }

    public String getTagId() {
        return tagId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public void setTagId(String tagId) {
        this.tagId = tagId;
    }
}
