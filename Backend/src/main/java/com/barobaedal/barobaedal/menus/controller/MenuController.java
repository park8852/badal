package com.barobaedal.barobaedal.menus.controller;

import com.barobaedal.barobaedal.common.FileStorageService;
import com.barobaedal.barobaedal.common.JwtUtil;
import com.barobaedal.barobaedal.common.response.CommonResponse;
import com.barobaedal.barobaedal.common.response.ResponseType;
import com.barobaedal.barobaedal.members.dto.MemberDto;
import com.barobaedal.barobaedal.members.service.MemberService;
import com.barobaedal.barobaedal.menus.dto.MenuDto;
import com.barobaedal.barobaedal.menus.service.MenuService;
import com.barobaedal.barobaedal.stores.dto.StoreDto;
import com.barobaedal.barobaedal.stores.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final MemberService memberService;
    private final StoreService storeService;
    private final FileStorageService fileStorageService;
    private final JwtUtil jwtUtil;

    @PostMapping("/create")
    public CommonResponse<Object> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @ModelAttribute MenuDto menuDto
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
        Integer storeId = storeService.findStoreIdByMemberId(memberId);
        MemberDto memberDto = memberService.getMember(userid);
        menuDto.setStoreId(storeId);
        if (!memberDto.getUserid().equals(userid)) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("본인 상점에만 메뉴를 추가할 수 있습니다.")
                    .build();
        }
        if (menuDto.getThumbnailFile() != null && !menuDto.getThumbnailFile().isEmpty()) {
            String savedPath = fileStorageService.storeFile(menuDto.getThumbnailFile());
            menuDto.setThumbnail(savedPath);
        }
        menuService.createMenu(menuDto);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(menuDto)
                .message("메뉴 등록 완료")
                .build();
    }

    @GetMapping("/info/{id}")
    public CommonResponse<Object> getById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(menuService.getMenu(id))
                .message("메뉴 조회 완료")
                .build();
    }

    @GetMapping("/store/{storeId}")
    public CommonResponse<Object> getByStore(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int storeId
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(menuService.getMenusByStore(storeId))
                .message("상점에 대한 메뉴 조회 완료")
                .build();
    }

    @PostMapping("/info/{id}")
    public CommonResponse<Object> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id,
            @ModelAttribute MenuDto menu
    ) throws IOException {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        if (!memberService.getMemberRole(userid).equals("OWNER")) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("사업자만 수정할 수 있습니다.")
                    .build();
        }
        Integer storeId = storeService.findStoreIdByMemberId(memberId);
        StoreDto storeDto = storeService.getStore(storeId);
        MenuDto menuDto = menuService.getMenu(id);
        menu.setStoreId(id);
        if (!storeDto.getId().equals(menuDto.getStoreId())) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("본인 상점에만 메뉴를 수정할 수 있습니다.")
                    .build();
        }
        if (menu.getThumbnailFile() != null && !menu.getThumbnailFile().isEmpty()) {
            String savedPath = fileStorageService.storeFile(menu.getThumbnailFile());
            menu.setThumbnail(savedPath);
        }
        menuService.updateMenu(id, menu);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("메뉴 수정 완료")
                .build();
    }

    @GetMapping("/delete/{id}")
    public CommonResponse<Object> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        if (!memberService.getMemberRole(userid).equals("OWNER")) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("사업자만 삭제할 수 있습니다.")
                    .build();
        }
        Integer storeId = storeService.findStoreIdByMemberId(memberId);
        StoreDto storeDto = storeService.getStore(storeId);
        MenuDto menuDto = menuService.getMenu(id);
        if (!storeDto.getId().equals(menuDto.getStoreId())) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("본인 상점에만 메뉴를 삭제할 수 있습니다.")
                    .build();
        }
        menuService.deleteMenu(id);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("메뉴 삭제 완료")
                .build();
    }
}
