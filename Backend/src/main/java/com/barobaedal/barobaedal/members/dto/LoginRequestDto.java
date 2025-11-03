package com.barobaedal.barobaedal.members.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDto {
    private String userid;
    private String userpw;
}