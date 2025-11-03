package com.barobaedal.barobaedal.boards.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BoardDto {
    private Integer id;
    private String category;
    private Integer memberId;
    private String userid;
    private String title;
    private String content;
    private String createdAt;
}