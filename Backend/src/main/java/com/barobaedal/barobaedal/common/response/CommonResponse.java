package com.barobaedal.barobaedal.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonResponse<T> {
    private ResponseType responseType;
    private T data;
    private String message;

    public static <T> CommonResponse<T> response(ResponseType responseType, T data, String message) {
        return CommonResponse.<T>builder()
                .responseType(responseType)
                .data(data)
                .message(message)
                .build();
    }

}
