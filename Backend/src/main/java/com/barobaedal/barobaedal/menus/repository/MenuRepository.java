package com.barobaedal.barobaedal.menus.repository;

import com.barobaedal.barobaedal.menus.dto.MenuDto;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MenuRepository {

    private final JdbcTemplate jdbcTemplate;

    public MenuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private RowMapper<MenuDto> menuMapper = (rs, rowNum) -> MenuDto.builder()
            .id(rs.getInt("id"))
            .storeId(rs.getInt("store_id"))
            .title(rs.getString("title"))
            .content(rs.getString("content"))
            .price(rs.getInt("price"))
            .thumbnail(rs.getString("thumbnail"))
            .build();

    public int insert(MenuDto menu) {
        String sql = "INSERT INTO menus (store_id, title, content, price, thumbnail) VALUES (?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                menu.getStoreId(),
                menu.getTitle(),
                menu.getContent(),
                menu.getPrice(),
                menu.getThumbnail());
    }

    public MenuDto findById(int id) {
        String sql = "SELECT * FROM menus WHERE id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, menuMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public List<MenuDto> findAllByStoreId(int storeId) {
        String sql = "SELECT * FROM menus WHERE store_id = ?";
        try {
            return jdbcTemplate.query(sql, menuMapper, storeId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public int update(int id, MenuDto menu) {
        String sql = "UPDATE menus SET title=?, content=?, price=?, thumbnail=? WHERE id=?";
        return jdbcTemplate.update(sql,
                menu.getTitle(),
                menu.getContent(),
                menu.getPrice(),
                menu.getThumbnail(),
                id);
    }

    public int delete(int id) {
        String sql = "DELETE FROM menus WHERE id=?";
        return jdbcTemplate.update(sql, id);
    }
}