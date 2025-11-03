package com.baro.baro_baedal.modules.mypage.data

data class QnaRequest(
    val id: Int,
    val category: String,
    val memberId: Int,
    val title: String,
    val content: String,
    val createdAt: String
)
