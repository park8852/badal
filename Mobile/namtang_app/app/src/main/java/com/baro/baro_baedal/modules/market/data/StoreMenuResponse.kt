package com.baro.baro_baedal.modules.market.data

data class StoreMenuResponse(
    val responseType: String,
    val data: List<MenuItem>,
    val message: String
)

data class MenuItem(
    val id: Int,
    val storeId: Int,
    val title: String,
    val content: String,
    val price: Int,
    val thumbnail: String
)