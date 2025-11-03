package com.barobaedal.barobaedal.members.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberDto {
    private String userid;
    private String name;
    private String birth;
    private String phone;
    private String email;
    private String address;
    private Integer point;
}