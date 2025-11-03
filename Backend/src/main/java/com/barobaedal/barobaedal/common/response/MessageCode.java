package com.barobaedal.barobaedal.common.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MessageCode {
    COMMON_SYSTEM_ERROR("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."),
    COMMON_INVALID_PARAMETER("요청한 값이 올바르지 않습니다."),
    COMMON_UNAUTHORIZED("토큰이 만료되었습니다."),
    COMMON_FORBIDDEN("권한이 없습니다."),
    COMMON_INVALID_TOKEN("유효하지 않은 토큰입니다.");

    private final String message;

    public String getMessage(Object... arg) {
        return String.format(message, arg);
    }
}