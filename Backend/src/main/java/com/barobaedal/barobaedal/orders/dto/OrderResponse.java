package com.barobaedal.barobaedal.orders.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private int id;
    private int memberId;
    private int storeId;
    private int menuId;
    private int quantity;
    private int totalPrice;
    private String createdAt;

    // 고객 정보
    private String customerName;
    private String customerPhone;
    private String customerAddress;

    // 상점 정보
    private String storeName;
    private String storeAddress;

    // 메뉴 정보
    private String menuTitle;

    // 기타
    private String paymentMethod;
}