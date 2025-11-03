package com.barobaedal.barobaedal.stores.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreDto {
    private Integer id;
    private Integer memberId;
    private String category;
    private String name;
    private String address;
    private String phone;
    private Integer openH;
    private Integer openM;
    private Integer closedH;
    private Integer closedM;
    private String thumbnail;
    private String createdAt;

    @JsonIgnore
    private MultipartFile thumbnailFile;
}