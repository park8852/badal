package com.barobaedal.barobaedal.members.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponseDto {
    private String token;
    private Integer storeId;
    private String role;
}