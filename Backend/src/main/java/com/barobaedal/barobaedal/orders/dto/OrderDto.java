package com.barobaedal.barobaedal.orders.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderDto {
    private Integer id;
    private Integer memberId;
    private Integer storeId;
    private Integer menuId;
    private Integer quantity;
    private Integer totalPrice;
    private String createdAt;
}