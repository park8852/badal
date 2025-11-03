package com.barobaedal.barobaedal.members.controller;

import com.barobaedal.barobaedal.common.JwtUtil;
import com.barobaedal.barobaedal.common.response.CommonResponse;
import com.barobaedal.barobaedal.common.response.ResponseType;
import com.barobaedal.barobaedal.members.dto.*;
import com.barobaedal.barobaedal.members.service.MemberService;
import com.barobaedal.barobaedal.stores.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final StoreService storeService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public CommonResponse<Object> signUp(@RequestBody RegisterRequestDto dto) {
        try {
            memberService.register(dto);
            return CommonResponse.builder()
                    .responseType(ResponseType.SUCCESS)
                    .data(null)
                    .message("회원가입 완료")
                    .build();
        } catch (Exception e) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("이미 존재하는 아이디입니다.")
                    .build();
        }
    }


    @GetMapping("/info")
    public CommonResponse<Object> getMember(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String userid = jwtUtil.auth(authHeader);
        MemberDto member = memberService.getMember(userid);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(member)
                .message("회원정보 불러오기 완료")
                .build();
    }

    @PostMapping("/info")
    public CommonResponse<Object> updateMember(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody MemberDto dto
    ) {
        String userid = jwtUtil.auth(authHeader);
        dto.setUserid(userid);
        memberService.updateMember(dto);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("회원 수정 완료")
                .build();
    }

    @PostMapping("/login")
    public CommonResponse<Object> login(@RequestBody LoginRequestDto request) {
        LoginResponseDto response = memberService.login(request.getUserid(), request.getUserpw());
        Integer MemberId = memberService.getMemberId(request.getUserid());
        Integer storeId = storeService.findStoreIdByMemberId(MemberId);
        String role = memberService.getMemberRole(request.getUserid());
        response.setStoreId(storeId);
        response.setRole(role);
        if (response.getToken() != null) {
            return CommonResponse.builder()
                    .responseType(ResponseType.SUCCESS)
                    .data(response)
                    .message("로그인 완료")
                    .build();
        } else {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("로그인 실패")
                    .build();
        }
    }

    // TBD
    @PostMapping("/logout")
    public CommonResponse<Object> logout(@RequestHeader("Authorization") String authorization) {
        // 간단 구현: 실제로는 JWT 블랙리스트에 토큰 저장 후 인증 필터에서 차단 처리해야 함
        // 여기서는 클라이언트가 토큰을 삭제하도록 권고하는 방식
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("로그아웃 완료")
                .build();
    }

    @PostMapping("/point/add")
    public CommonResponse<Object> addPoint(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody PointDto pointDto
    ) {
        String userid = jwtUtil.auth(authHeader);
        Integer userPoint = memberService.getMemberPoint(userid);
        int setPoint = userPoint + pointDto.getPoint();
        memberService.updatePoint(userid, setPoint);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("포인트 충전 완료")
                .build();
    }

    @GetMapping("/point/info")
    public CommonResponse<Object> infoPoint(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String userid = jwtUtil.auth(authHeader);
        Integer userPoint = memberService.getMemberPoint(userid);
        PointDto pointDto = new PointDto();
        pointDto.setPoint(userPoint);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(pointDto)
                .message("포인트 조회 완료")
                .build();
    }

    @PostMapping("/point/info")
    public CommonResponse<Object> setPoint(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody PointDto pointDto
    ) {
        String userid = jwtUtil.auth(authHeader);
        memberService.updatePoint(userid, pointDto.getPoint());
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("포인트 수정 완료")
                .build();
    }
}