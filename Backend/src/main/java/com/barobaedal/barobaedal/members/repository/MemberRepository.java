package com.barobaedal.barobaedal.members.repository;

import com.barobaedal.barobaedal.members.dto.MemberDto;
import com.barobaedal.barobaedal.members.dto.RegisterRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MemberRepository {

    private final JdbcTemplate jdbcTemplate;

    public int insertMember(RegisterRequestDto dto) {
        String sql = "INSERT INTO members (userid, userpw, name, birth, phone, email, address, role, point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                dto.getUserid(),
                dto.getUserpw(),
                dto.getName(),
                dto.getBirth(),
                dto.getPhone(),
                dto.getEmail(),
                dto.getAddress(),
                dto.getRole(),
                0,
                dto.getCreated_at());
    }

    public int updateMember(MemberDto dto) {
        String sql = "UPDATE members SET name = ?, birth = ?, phone = ?, email = ?, address = ? WHERE userid = ?";
        return jdbcTemplate.update(sql,
                dto.getName(),
                dto.getBirth(),
                dto.getPhone(),
                dto.getEmail(),
                dto.getAddress(),
                dto.getUserid());
    }

    public MemberDto getMember(String userid) {
        String sql = "SELECT userid, name, birth, phone, email, address, point FROM members WHERE userid = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            MemberDto member = new MemberDto();
            member.setUserid(rs.getString("userid"));
            member.setName(rs.getString("name"));
            member.setBirth(rs.getString("birth"));
            member.setPhone(rs.getString("phone"));
            member.setEmail(rs.getString("email"));
            member.setAddress(rs.getString("address"));
            member.setPoint(rs.getInt("point"));
            return member;
        }, userid);
    }

    // 안전한 로그인 검증
    public boolean checkLogin(String userid, String userpw) {
        String sql = "SELECT COUNT(*) FROM members WHERE userid = ? AND userpw = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userid, userpw);
        return count != null && count > 0;
    }

    // VULNERABLE VERSION: SQL Injection 취약점
    // 경고: 이 메서드는 SQL Injection 공격에 취약합니다!
    public boolean checkLoginVulnerable(String userid, String userpw) {
        // 취약점: 사용자 입력을 직접 SQL 쿼리에 연결 (문자열 연결)
        String sql = "SELECT COUNT(*) FROM members WHERE userid = '" + userid + "' AND userpw = '" + userpw + "'";
        
        try {
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            // 에러 메시지 노출 (추가 취약점)
            e.printStackTrace();
            return false;
        }
    }

    public Integer getMemberId(String userid) {
        String sql = "SELECT id FROM members WHERE userid = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, userid);
    }

    public boolean existsByUserid(String userid) {
        String sql = "SELECT COUNT(*) FROM members WHERE userid = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userid);
        return count != null && count > 0;
    }

    public int updatePoint(String userid, int point) {
        String sql = "UPDATE members SET point = ? WHERE userid = ?";
        return jdbcTemplate.update(sql, point, userid);
    }

    public Integer getPoint(String userid) {
        String sql = "SELECT point FROM members WHERE userid = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, userid);
    }

    public String getMemberRole(String userid) {
        String sql = "SELECT role FROM members WHERE userid = ?";
        return jdbcTemplate.queryForObject(sql, String.class, userid);
    }

    public Integer getMemberIdByUserid(String userid) {
        String sql = "SELECT id FROM members WHERE userid = ?";
        System.out.println("[getMemberIdByUserid] userid: " + userid);
        try {
            return jdbcTemplate.queryForObject(sql, Integer.class, userid);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public String getRole(String userid) {
        String sql = "SELECT role FROM members WHERE userid = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, userid);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

}
