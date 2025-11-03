package com.barobaedal.barobaedal.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthFilter extends HttpFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        // OPTIONS(Preflight) 요청은 JWT 검증 없이 즉시 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String userid = jwtUtil.getUseridFromToken(token);
                request.setAttribute("userid", userid);
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return; // 토큰이 유효하지 않으면 요청 차단
            }
        } else {
            // 토큰 미제공인 경우 필요하면 인증 필요 API 차단
            // 여기서는 그냥 넘김 (공개 API 허용 시)
        }

        chain.doFilter(request, response);
    }
}