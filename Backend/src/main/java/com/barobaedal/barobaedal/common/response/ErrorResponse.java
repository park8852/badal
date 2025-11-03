package com.barobaedal.barobaedal.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private ResponseType responseType;
    private String message;

    public static ErrorResponse response(String message) {
        return ErrorResponse.builder()
                .responseType(ResponseType.ERROR)
                .message(message)
                .build();
    }

}
