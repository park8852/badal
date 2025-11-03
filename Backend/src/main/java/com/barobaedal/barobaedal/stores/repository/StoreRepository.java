package com.barobaedal.barobaedal.stores.repository;

import com.barobaedal.barobaedal.orders.dto.OrderResponse;
import com.barobaedal.barobaedal.stores.dto.StoreDto;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class StoreRepository {

    private final JdbcTemplate jdbcTemplate;

    public StoreRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private RowMapper<StoreDto> storeMapper = (rs, rowNum) -> StoreDto.builder()
            .id(rs.getInt("id"))
            .memberId(rs.getInt("member_id"))
            .category(rs.getString("category"))
            .name(rs.getString("name"))
            .address(rs.getString("address"))
            .phone(rs.getString("phone"))
            .openH(rs.getInt("open_h"))
            .openM(rs.getInt("open_m"))
            .closedH(rs.getInt("closed_h"))
            .closedM(rs.getInt("closed_m"))
            .thumbnail(rs.getString("thumbnail"))
            .createdAt(rs.getString("created_at"))
            .build();

    public int insert(StoreDto store) {
        String sql = "INSERT INTO stores (member_id, category, name, address, phone, open_h, open_m, closed_h, closed_m, thumbnail, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, store.getMemberId());
            ps.setString(2, store.getCategory());
            ps.setString(3, store.getName());
            ps.setString(4, store.getAddress());
            ps.setString(5, store.getPhone());
            ps.setInt(6, store.getOpenH());
            ps.setInt(7, store.getOpenM());
            ps.setInt(8, store.getClosedH());
            ps.setInt(9, store.getClosedM());
            ps.setString(10, store.getThumbnail());
            ps.setString(11, store.getCreatedAt());
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : -1;
    }

    public StoreDto findById(int id) {
        String sql = "SELECT * FROM stores WHERE id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, storeMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public List<StoreDto> findAll() {
        String sql = "SELECT * FROM stores";
        return jdbcTemplate.query(sql, storeMapper);
    }

    public int update(int id, StoreDto store) {
        String sql = "UPDATE stores SET category=?, name=?, address=?, phone=?, open_h=?, open_m=?, closed_h=?, closed_m=?, thumbnail=? WHERE id=?";
        return jdbcTemplate.update(sql,
                store.getCategory(),
                store.getName(),
                store.getAddress(),
                store.getPhone(),
                store.getOpenH(),
                store.getOpenM(),
                store.getClosedH(),
                store.getClosedM(),
                store.getThumbnail(),
                id);
    }

    public int updateByMemberId(int memberId, StoreDto store) {
        String sql = "UPDATE stores SET category=?, name=?, address=?, phone=?, open_h=?, open_m=?, closed_h=?, closed_m=?, thumbnail=? WHERE member_id=?";
        return jdbcTemplate.update(sql,
                store.getCategory(),
                store.getName(),
                store.getAddress(),
                store.getPhone(),
                store.getOpenH(),
                store.getOpenM(),
                store.getClosedH(),
                store.getClosedM(),
                store.getThumbnail(),
                memberId);
    }

    public Integer findMemberIdByStoreId(int storeId) {
        String sql = "SELECT member_id FROM stores WHERE member_id = ?";
        List<Integer> result = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getInt("member_id"), storeId);
        try {
            return result.isEmpty() ? null : result.get(0);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public Integer findStoreIdByMemberId(Integer memberId) {
        String sql = "SELECT id FROM stores WHERE member_id = ?";
        List<Integer> result = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getInt("id"), memberId);
        try {
            return result.isEmpty() ? null : result.get(0);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public int delete(int id) {
        String sql = "DELETE FROM stores WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    public List<StoreDto> findByNameLike(String nameParam) {
        String sql = "SELECT * FROM stores WHERE name LIKE ?";
        String likePattern = "%" + nameParam + "%";
        try {
            return jdbcTemplate.query(sql, storeMapper, likePattern);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}