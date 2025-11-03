package com.baro.baro_baedal.modules.login.data

data class LoginResponse(
    val responseType: String,
    val data: LoginData,
    val message: String
)

data class LoginData(
    val token: String,
    val role: String
)
