package com.barobaedal.barobaedal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;


// 수정필요
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/**") // 모든 경로에 대해
//              .allowedOrigins("http://192.168.72.76:3000") // React 개발 서버 오리진
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 허용할 HTTP 메서드
                .allowedHeaders("*") // 모든 헤더 허용
                .exposedHeaders("Authorization") // JWT 토큰 등 응답 헤더 노출
                .allowCredentials(true); // 인증정보(쿠키 등) 허용 필요시 true, 아니면 생략
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 절대 경로로 매핑
        String absolutePath = new File(uploadDir).getAbsolutePath();

        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}
