package com.baro.baro_baedal.modules.market.data

data class SingleMenuResponse(
    val responseType: String,
    val data: SingleMenuItem,
    val message: String
)

data class SingleMenuItem(
    val id: Int,
    val storeId: Int,
    val title: String,
    val content: String,
    val price: Int,
    val thumbnail: String
)
