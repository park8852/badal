package com.barobaedal.barobaedal.config;

import com.barobaedal.barobaedal.common.JwtAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public FilterConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilter() {
        FilterRegistrationBean<JwtAuthFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(jwtAuthFilter);

        // 필터를 적용할 URL 패턴 지정
        //registrationBean.addUrlPatterns("/*");
        registrationBean.addUrlPatterns("/api/member/*");

        registrationBean.setOrder(2); // 필터 실행 순서 지정 가능
        return registrationBean;
    }
}
