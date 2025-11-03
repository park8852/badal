package com.barobaedal.barobaedal.stores.controller;

import com.barobaedal.barobaedal.common.FileStorageService;
import com.barobaedal.barobaedal.common.JwtUtil;
import com.barobaedal.barobaedal.common.response.CommonResponse;
import com.barobaedal.barobaedal.common.response.ResponseType;
import com.barobaedal.barobaedal.members.service.MemberService;
import com.barobaedal.barobaedal.stores.dto.StoreDto;
import com.barobaedal.barobaedal.stores.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/store")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final MemberService memberService;
    private final FileStorageService fileStorageService;
    private final JwtUtil jwtUtil;

    // 상점 등록
    @PostMapping("/create")
    public CommonResponse<Object> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @ModelAttribute StoreDto dto
    ) throws IOException {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        if (!memberService.getMemberRole(userid).equals("OWNER")) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("사업자만 등록할 수 있습니다.")
                    .build();
        }
        dto.setMemberId(memberId);
        dto.setCreatedAt(LocalDate.now(ZoneId.of("Asia/Seoul")).toString());
        if (dto.getThumbnailFile() != null && !dto.getThumbnailFile().isEmpty()) {
            String savedPath = fileStorageService.storeFile(dto.getThumbnailFile());
            dto.setThumbnail(savedPath);
        }
        Integer storeId = storeService.createStore(dto);
        dto.setId(storeId);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(dto)
                .message("상점 등록 완료")
                .build();
    }

    // 모든 상점 조회
    @GetMapping("/all")
    public CommonResponse<Object> findAll(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(storeService.getAllStores())
                .message("모든 상점 조회 완료")
                .build();
    }

    // 상점 조회
    @GetMapping("/info/{id}")
    public CommonResponse<Object> getInfo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(storeService.getStore(id))
                .message("상점 조회 완료")
                .build();
    }

    // 상점 수정
    @PostMapping("/info")
    public CommonResponse<Object> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @ModelAttribute StoreDto dto
    ) throws IOException {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        Integer storeOwnerId = storeService.findMemberIdByStoreId(memberId);
        if (!memberService.getMemberRole(userid).equals("OWNER")) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("사업자만 수정할 수 있습니다.")
                    .build();
        }
        if (!memberId.equals(storeOwnerId))
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("본인 상점만 수정할 수 있습니다.")
                    .build();
        dto.setMemberId(memberId);
        if (dto.getThumbnailFile() != null && !dto.getThumbnailFile().isEmpty()) {
            String savedPath = fileStorageService.storeFile(dto.getThumbnailFile());
            dto.setThumbnail(savedPath);
        }
        storeService.updateByMemberId(memberId, dto);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("상점 수정 완료")
                .build();
    }

    // 상점 삭제
    @GetMapping("/delete/{id}")
    public CommonResponse<Object> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        String userid = jwtUtil.auth(authHeader);
        if (!memberService.getMemberRole(userid).equals("ADMIN")) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("관리자만 삭제할 수 있습니다.")
                    .build();
        }
        storeService.deleteStore(id);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("상점 삭제 완료")
                .build();
    }

    // 상점명 검색
    @GetMapping("/search")
    public CommonResponse<Object> searchByName(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("name") String name
    ) {
        jwtUtil.auth(authHeader);
        List<StoreDto> results = storeService.searchStoresByName(name);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(results)
                .message("상점명 검색 완료")
                .build();
    }
}