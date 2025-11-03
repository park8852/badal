package com.baro.baro_baedal.modules.register.data

data class MemberReg(
    val userid: String,
    val userpw: String,
    val name: String,
    val birth: String,
    val phone: String,
    val email: String,
    val address: String,
    val role: String,
    val created_at: String
)
