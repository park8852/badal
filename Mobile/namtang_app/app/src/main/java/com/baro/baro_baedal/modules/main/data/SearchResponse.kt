package com.baro.baro_baedal.modules.main.data

data class SearchResponse(
    val responseType: String,
    val data: List<StoreInfo>,
    val message: String
)

data class StoreInfo(
    val id: Int,
    val memeberId: Int,
    val category: String,
    val name: String,
    val address: String,
    val phone: String,
    val openH: Int,
    val openM: Int,
    val closedH: Int,
    val closedM: Int,
    val createdAt: String,
    val thumbnail: String
)
