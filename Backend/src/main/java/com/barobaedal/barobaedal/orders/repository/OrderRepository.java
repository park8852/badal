package com.barobaedal.barobaedal.orders.repository;

import com.barobaedal.barobaedal.orders.dto.OrderDto;
import com.barobaedal.barobaedal.orders.dto.OrderResponse;
import com.barobaedal.barobaedal.orders.dto.SalesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class OrderRepository {

    private final JdbcTemplate jdbcTemplate;

    // 주문 생성
    public int save(OrderDto order) {
        String sql = "INSERT INTO orders (member_id, store_id, menu_id, quantity, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                order.getMemberId(),
                order.getStoreId(),
                order.getMenuId(),
                order.getQuantity(),
                order.getTotalPrice(),
                order.getCreatedAt());
    }

    // 특정 주문 읽기
    public OrderResponse findById(int id) {
        String sql = """
                SELECT 
                    o.id,
                    o.member_id,
                    o.store_id,
                    o.menu_id,
                    o.quantity,
                    o.total_price,
                    o.created_at,
                    m.name AS customer_name,
                    m.phone AS customer_phone,
                    m.address AS customer_address,
                    s.name AS store_name,
                    s.address AS store_address,
                    mn.title AS menu_title,
                    '선결제' AS payment_method
                FROM orders o
                JOIN members m ON o.member_id = m.id
                JOIN stores s ON o.store_id = s.id
                JOIN menus mn ON o.menu_id = mn.id
                WHERE o.id = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, orderResponseRowMapper(), id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }


    // 특정 사용자의 주문 읽기
    public List<OrderResponse> findByMemberId(int memberId) {
        String sql = """
                SELECT 
                    o.id,
                    o.member_id,
                    o.store_id,
                    o.menu_id,
                    o.quantity,
                    o.total_price,
                    o.created_at,
                    m.name AS customer_name,
                    m.phone AS customer_phone,
                    m.address AS customer_address,
                    s.name AS store_name,
                    s.address AS store_address,
                    mn.title AS menu_title,
                    '선결제' AS payment_method
                FROM orders o
                JOIN members m ON o.member_id = m.id
                JOIN stores s ON o.store_id = s.id
                JOIN menus mn ON o.menu_id = mn.id
                WHERE o.member_id = ?
                ORDER BY o.created_at DESC
                """;
        try {
            return jdbcTemplate.query(sql, orderResponseRowMapper(), memberId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }


    // 특정 상점의 주문 읽기
    public List<OrderResponse> findByStoreId(int storeId) {
        String sql = """
                SELECT 
                    o.id,
                    o.member_id,
                    o.store_id,
                    o.menu_id,
                    o.quantity,
                    o.total_price,
                    o.created_at,
                    m.name AS customer_name,
                    m.phone AS customer_phone,
                    m.address AS customer_address,
                    s.name AS store_name,
                    s.address AS store_address,
                    mn.title AS menu_title,
                    '선결제' AS payment_method
                FROM orders o
                JOIN members m ON o.member_id = m.id
                JOIN stores s ON o.store_id = s.id
                JOIN menus mn ON o.menu_id = mn.id
                WHERE o.store_id = ?
                ORDER BY o.created_at DESC
                """;
        try {
            return jdbcTemplate.query(sql, orderResponseRowMapper(), storeId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // 주문 수정
    public int update(OrderDto order) {
        String sql = "UPDATE orders SET member_id=?, store_id=?, menu_id=?, quantity=?, total_price=?, created_at=? WHERE id=?";
        return jdbcTemplate.update(sql,
                order.getMemberId(),
                order.getStoreId(),
                order.getMenuId(),
                order.getQuantity(),
                order.getTotalPrice(),
                order.getCreatedAt(),
                order.getId());
    }

    // 주문 삭제
    public int delete(int id) {
        String sql = "DELETE FROM orders WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }


    // 전체 주문 조회
    public List<OrderResponse> findAllOrders() {
        String sql = """
                SELECT 
                    o.id,
                    o.member_id,
                    o.store_id,
                    o.menu_id,
                    o.quantity,
                    o.total_price,
                    o.created_at,
                    m.name AS customer_name,
                    m.phone AS customer_phone,
                    m.address AS customer_address,
                    s.name AS store_name,
                    s.address AS store_address,
                    mn.title AS menu_title,
                    '선결제' AS payment_method
                FROM orders o
                JOIN members m ON o.member_id = m.id
                JOIN stores s ON o.store_id = s.id
                JOIN menus mn ON o.menu_id = mn.id
                ORDER BY o.created_at DESC
                """;
        try {
            return jdbcTemplate.query(sql, orderResponseRowMapper());
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // 기간 내 주문 찾기
    public List<OrderResponse> findOrdersByDateRange(int storeId, String startDay, String endDay) {
        String sql = """
                SELECT 
                    o.id,
                    o.member_id,
                    o.store_id,
                    o.menu_id,
                    o.quantity,
                    o.total_price,
                    o.created_at,
                    m.name AS customer_name,
                    m.phone AS customer_phone,
                    m.address AS customer_address,
                    s.name AS store_name,
                    s.address AS store_address,
                    mn.title AS menu_title,
                    '선결제' AS payment_method
                FROM orders o
                JOIN members m ON o.member_id = m.id
                JOIN stores s ON o.store_id = s.id
                JOIN menus mn ON o.menu_id = mn.id
                WHERE o.store_id = ?
                AND STR_TO_DATE(o.created_at, '%Y-%m-%d %H:%i:%s')
                    BETWEEN STR_TO_DATE(?, '%Y-%m-%d')
                    AND STR_TO_DATE(CONCAT(?, ' 23:59:59'), '%Y-%m-%d %H:%i:%s')
                ORDER BY o.created_at DESC
                """;
        try {
            return jdbcTemplate.query(sql, orderResponseRowMapper(), storeId, startDay, endDay);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public SalesResponse findSalesByStoreAndMonth(int storeId, String month) {
        String sql = """
            SELECT 
                s.id AS store_id,
                s.name AS store_name,
                m.id AS menu_id,
                m.title AS menu_name,
                SUM(o.quantity) AS count,           -- 메뉴별 총 판매 수량
                SUM(o.total_price) AS amount        -- 메뉴별 총 정산금
            FROM orders o
            JOIN stores s ON o.store_id = s.id
            JOIN menus m ON o.menu_id = m.id
            WHERE s.id = ?
              AND DATE_FORMAT(STR_TO_DATE(o.created_at, '%Y-%m-%d'), '%Y-%m') = ?
            GROUP BY s.id, s.name, m.id, m.title
            ORDER BY amount DESC
        """;

        // 메뉴별 매출 리스트
        List<SalesResponse.MenuSales> menuSalesList = jdbcTemplate.query(
                sql,
                new Object[]{storeId, month},
                menuSalesRowMapper()
        );

        // 상점명 조회
        List<String> storeNames = jdbcTemplate.query(
                "SELECT name FROM stores WHERE id = ?",
                new Object[]{storeId},
                (rs, rowNum) -> rs.getString("name")
        );
        String storeName = storeNames.isEmpty() ? "상점 정보가 존재하지 않습니다." : storeNames.get(0);

        // 총 정산금 계산
        int totalAmount = menuSalesList.stream()
                .mapToInt(SalesResponse.MenuSales::getAmount)
                .sum();

        return new SalesResponse(storeId, storeName, menuSalesList, totalAmount);
    }


    private RowMapper<OrderResponse> orderResponseRowMapper() {
        return (rs, rowNum) -> {
            OrderResponse response = new OrderResponse();
            response.setId(rs.getInt("id"));
            response.setMemberId(rs.getInt("member_id"));
            response.setStoreId(rs.getInt("store_id"));
            response.setMenuId(rs.getInt("menu_id"));
            response.setQuantity(rs.getInt("quantity"));
            response.setTotalPrice(rs.getInt("total_price"));
            response.setCreatedAt(rs.getString("created_at"));

            // 고객 정보
            response.setCustomerName(rs.getString("customer_name"));
            response.setCustomerPhone(rs.getString("customer_phone"));
            response.setCustomerAddress(rs.getString("customer_address"));

            // 상점 정보
            response.setStoreName(rs.getString("store_name"));
            response.setStoreAddress(rs.getString("store_address"));

            // 메뉴 정보
            response.setMenuTitle(rs.getString("menu_title"));

            // 기타
            response.setPaymentMethod(rs.getString("payment_method"));
            return response;
        };
    }


    private RowMapper<SalesResponse.MenuSales> menuSalesRowMapper() {
        return (rs, rowNum) -> new SalesResponse.MenuSales(
                rs.getInt("menu_id"),
                rs.getString("menu_name"),
                rs.getInt("count"),
                rs.getInt("amount")
        );
    }
}