package com.barobaedal.barobaedal.orders.service;

import com.barobaedal.barobaedal.orders.dto.OrderDto;
import com.barobaedal.barobaedal.orders.dto.OrderResponse;
import com.barobaedal.barobaedal.orders.dto.SalesResponse;
import com.barobaedal.barobaedal.orders.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    public void createOrder(OrderDto order) {
        orderRepository.save(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllOrders();
    }

    public OrderResponse getOrderById(int id) {
        return orderRepository.findById(id);
    }

    public List<OrderResponse> getOrdersByMemberId(int memberId) {
        return orderRepository.findByMemberId(memberId);
    }

    public List<OrderResponse> getOrdersByStoreId(int storeId) {
        return orderRepository.findByStoreId(storeId);
    }

    public void updateOrder(OrderDto order) {
        orderRepository.update(order);
    }

    public void deleteOrder(int id) {
        orderRepository.delete(id);
    }

    public List<OrderResponse> getOrdersByDay(int storeId, String startDay, String endDay) {
        return orderRepository.findOrdersByDateRange(storeId, startDay, endDay);
    }

    public SalesResponse getSalesByStoreAndMonth(int storeId, String month) {
        return orderRepository.findSalesByStoreAndMonth(storeId, month);
    }
}