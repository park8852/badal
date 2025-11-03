package com.baro.baro_baedal.modules.market.data

data class OrderRequest(
    val storeId: Int,
    val menuId: Int,
    val quantity: Int,
    val totalPrice: Int,
    val createdAt: String
)
