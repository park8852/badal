package com.barobaedal.barobaedal.members.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDto {
    private String userid;
    private String userpw;
    private String name;
    private String birth;
    private String phone;
    private String email;
    private String address;
    private String role;
    private String created_at;
}
