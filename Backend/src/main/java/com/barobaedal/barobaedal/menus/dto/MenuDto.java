package com.barobaedal.barobaedal.menus.dto;

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
public class MenuDto {
    private Integer id;
    private Integer storeId;
    private String title;
    private String content;
    private Integer price;
    private String thumbnail;

    @JsonIgnore
    private MultipartFile thumbnailFile;
}
