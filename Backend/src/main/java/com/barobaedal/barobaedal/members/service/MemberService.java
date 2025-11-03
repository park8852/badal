package com.barobaedal.barobaedal.members.service;

import com.barobaedal.barobaedal.common.JwtUtil;
import com.barobaedal.barobaedal.members.dto.LoginResponseDto;
import com.barobaedal.barobaedal.members.dto.MemberDto;
import com.barobaedal.barobaedal.members.dto.RegisterRequestDto;
import com.barobaedal.barobaedal.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;

    public void register(RegisterRequestDto dto) {
        if (memberRepository.existsByUserid(dto.getUserid())) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
        memberRepository.insertMember(dto);
    }


    // generateToken() 파라미터 추가 가능? role
    public LoginResponseDto login(String userid, String userpw) {
        boolean valid = memberRepository.checkLogin(userid, userpw);
        if (valid) {
            String token = jwtUtil.generateToken(userid);
            return new LoginResponseDto(token, null, null);
        } else {
            return new LoginResponseDto(null, null, null);
        }
    }

    public void updateMember(MemberDto dto) {
        int result = memberRepository.updateMember(dto);
        if (result == 0) {
            throw new IllegalArgumentException("회원 정보를 수정할 수 없습니다. (userid 확인 필요)");
        }
    }

    public MemberDto getMember(String userid) {
        return memberRepository.getMember(userid);
    }

    public Integer getMemberId(String userid) {
        return memberRepository.getMemberId(userid);
    }

    public void updatePoint(String userid, int point) {
        memberRepository.updatePoint(userid, point);
    }

    public Integer getMemberPoint(String userid) {
        return memberRepository.getPoint(userid);
    }

    public String getMemberRole(String userid) {
        return memberRepository.getMemberRole(userid);
    }
}
