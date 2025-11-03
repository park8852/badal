package com.barobaedal.barobaedal.orders.controller;

import com.barobaedal.barobaedal.common.JwtUtil;
import com.barobaedal.barobaedal.common.response.CommonResponse;
import com.barobaedal.barobaedal.common.response.ResponseType;
import com.barobaedal.barobaedal.members.service.MemberService;
import com.barobaedal.barobaedal.menus.dto.MenuDto;
import com.barobaedal.barobaedal.menus.service.MenuService;
import com.barobaedal.barobaedal.orders.dto.OrderDayRequest;
import com.barobaedal.barobaedal.orders.dto.OrderDto;
import com.barobaedal.barobaedal.orders.dto.SalesRequest;
import com.barobaedal.barobaedal.orders.dto.SalesResponse;
import com.barobaedal.barobaedal.orders.service.OrderService;
import com.barobaedal.barobaedal.stores.dto.StoreDto;
import com.barobaedal.barobaedal.stores.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final MemberService memberService;
    private final StoreService storeService;
    private final MenuService menuService;
    private final JwtUtil jwtUtil;

    // CREATE
    @PostMapping("/create")
    public CommonResponse<Object> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody OrderDto order
    ) {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        MenuDto menuDto = menuService.getMenu(order.getMenuId());
        StoreDto storeDto = storeService.getStore(order.getStoreId());
        if (!menuDto.getStoreId().equals(storeDto.getId())) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("상점에 있는 메뉴만 주문할 수 있습니다.")
                    .build();
        }
        order.setMemberId(memberId);
        order.setTotalPrice(menuDto.getPrice() * order.getQuantity());
        order.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Seoul"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        orderService.createOrder(order);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("주문 등록 완료")
                .build();
    }

    // READ ALL
    @GetMapping("/list")
    public CommonResponse<Object> list(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(orderService.getAllOrders())
                .message("모든 주문 정보 조회 완료")
                .build();
    }

    // READ ONE
    @GetMapping("/{id}")
    public CommonResponse<Object> get(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(orderService.getOrderById(id))
                .message("주문 정보 조회 완료")
                .build();
    }

    // 특정 사용자의 주문들
    @GetMapping("/member")
    public CommonResponse<Object> getByMember(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(orderService.getOrdersByMemberId(memberId))
                .message("사용자에 대한 주문 정보 조회 완료")
                .build();
    }

    // 특정 상점의 주문들
    @GetMapping("/store/{id}")
    public CommonResponse<Object> getByStore(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        jwtUtil.auth(authHeader);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(orderService.getOrdersByStoreId(id))
                .message("상점에 대한 주문 정보 조회 완료")
                .build();
    }

    @PostMapping("/day")
    public CommonResponse<Object> getByDay(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody OrderDayRequest day
    ) {
        String userid = jwtUtil.auth(authHeader);
        Integer memberId = memberService.getMemberId(userid);
        Integer storeId = storeService.findStoreIdByMemberId(memberId);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(orderService.getOrdersByDay(storeId, day.getStartDay(), day.getEndDay()))
                .message("기간 내 주문 정보 조회 완료")
                .build();
    }

    // UPDATE
    @PostMapping("/update")
    public CommonResponse<Object> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody OrderDto order
    ) {
        // 검증로직 필요함
        orderService.updateOrder(order);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("주문 정보 수정 완료")
                .build();
    }

    // DELETE
    @GetMapping("/delete/{id}")
    public CommonResponse<Object> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int id
    ) {
        orderService.deleteOrder(id);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(null)
                .message("주문 정보 삭제 완료")
                .build();
    }

    @PostMapping("/sales")
    public CommonResponse<Object> sales(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SalesRequest salesRequest
    ) {
        String userid = jwtUtil.auth(authHeader);
        if (!memberService.getMemberRole(userid).equals("ADMIN")) {
            return CommonResponse.builder()
                    .responseType(ResponseType.ERROR)
                    .data(null)
                    .message("관리자만 조회할 수 있습니다.")
                    .build();
        }
        int storeId = salesRequest.getStoreId();
        String month = salesRequest.getMonth();
        SalesResponse response = orderService.getSalesByStoreAndMonth(storeId, month);
        return CommonResponse.builder()
                .responseType(ResponseType.SUCCESS)
                .data(response)
                .message("해당 달 주문 정보 조회 완료")
                .build();
    }
}