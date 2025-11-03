package com.barobaedal.barobaedal.orders.dto;

import lombok.*;

import java.util.List;

@Getter
@AllArgsConstructor
public class SalesResponse {

    private Integer storeId;
    private String storeName;
    private List<MenuSales> menuSalesList; // 메뉴별 정산금
    private Integer totalAmount;               // 가게 총 정산금

    @Getter
    @AllArgsConstructor
    public static class MenuSales {
        private Integer menuId;
        private String menuName;
        private Integer count; 
        private Integer amount; // 해당 메뉴 총 정산금 (price * quantity)
    }
}