package com.barobaedal.barobaedal.boards.repository;

import com.barobaedal.barobaedal.boards.dto.BoardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class BoardRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<BoardDto> rowMapper = (rs, rowNum) -> {
        BoardDto dto = new BoardDto();
        dto.setId(rs.getInt("id"));
        dto.setCategory(rs.getString("category"));
        dto.setMemberId(rs.getInt("member_id"));
        dto.setUserid(rs.getString("userid"));
        dto.setTitle(rs.getString("title"));
        dto.setContent(rs.getString("content"));
        dto.setCreatedAt(rs.getString("created_at"));
        return dto;
    };

    public List<BoardDto> findByCategory(String category) {
        String sql = "SELECT boards.*, members.userid " +
                "FROM boards " +
                "INNER JOIN members ON boards.member_id = members.id " +
                "WHERE boards.id IS NOT NULL AND " +
                "boards.category = ? AND " +
                "boards.member_id IS NOT NULL AND " +
                "boards.title IS NOT NULL AND " +
                "boards.content IS NOT NULL AND " +
                "boards.created_at IS NOT NULL AND " +
                "members.userid IS NOT NULL";
        return jdbcTemplate.query(sql, rowMapper, category);
    }

    public BoardDto findById(Integer id) {
        String sql = "SELECT * FROM boards WHERE id = ?";
        List<BoardDto> list = jdbcTemplate.query(sql, rowMapper, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public BoardDto save(BoardDto dto) {
        String sql = "INSERT INTO boards (category, member_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, dto.getCategory());
            ps.setInt(2, dto.getMemberId());
            ps.setString(3, dto.getTitle());
            ps.setString(4, dto.getContent());
            ps.setString(5, dto.getCreatedAt());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            dto.setId(key.intValue());  // 서버에서 자동 설정
            return findById(dto.getId());
        } else {
            throw new RuntimeException("생성된 ID를 얻을 수 없습니다.");
        }
    }

    public BoardDto update(BoardDto dto) {
        String sql = "UPDATE boards SET title = ?, content = ? WHERE id = ? AND member_id = ?  AND category = ?";
        int updatedRows = jdbcTemplate.update(sql,
                dto.getTitle(),
                dto.getContent(),
                dto.getId(),
                dto.getMemberId(),
                dto.getCategory()
        );

        if (updatedRows > 0){
            return findById(dto.getId());
        } else {
            throw new RuntimeException("게시물 수정 실패");
        }
    }

    public int deleteById(Integer id) {
        String sql = "DELETE FROM boards WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    public List<BoardDto> findByCategoryAndMemberId(String category, String role, String userid){
        String sql1 = "SELECT boards.*, members.userid " +
                "FROM boards " +
                "INNER JOIN members ON boards.member_id = members.id " +
                "WHERE boards.id IS NOT NULL AND " +
                "boards.category = ? AND " +
                "boards.member_id ";
        String sql2 = "boards.title IS NOT NULL AND " +
                "boards.content IS NOT NULL AND " +
                "boards.created_at IS NOT NULL AND " +
                "members.userid IS NOT NULL";

        if (role.equalsIgnoreCase("ADMIN")){
            return jdbcTemplate.query(sql1+"IS NOT NULL AND "+sql2, rowMapper, category);
        }  else {
            return jdbcTemplate.query(sql1+"= (SELECT id FROM members WHERE userid = ? AND role = ?) AND "+sql2, rowMapper, category, userid, role);
        }

    }
}
