package com.barobaedal.barobaedal.orders.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderDayRequest {
    private String startDay;
    private String endDay;
}
