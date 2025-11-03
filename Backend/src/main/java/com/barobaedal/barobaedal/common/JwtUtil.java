package com.barobaedal.barobaedal.common;

import com.barobaedal.barobaedal.common.exception.BaseException;
import com.barobaedal.barobaedal.common.response.MessageCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final long expireMillis = 1000 * 60 * 60; // 1시간 토큰 유효기간

    public String generateToken(String userid) {
        return Jwts.builder()
                .setSubject(userid)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expireMillis))
                .signWith(key)
                .compact();
    }

    public String getUseridFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String auth(String authHeader) {
        if (authHeader == null || authHeader.isEmpty())
            throw new BaseException(MessageCode.COMMON_INVALID_TOKEN.getMessage());
        String token = authHeader.substring(7);
        if (!this.validateToken(token))
            throw new BaseException(MessageCode.COMMON_INVALID_TOKEN.getMessage());
        return this.getUseridFromToken(token);
    }
}
