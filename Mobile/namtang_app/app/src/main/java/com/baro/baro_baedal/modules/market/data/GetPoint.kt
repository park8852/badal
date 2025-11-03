package com.baro.baro_baedal.modules.market.data

data class PayPoint(
    val responseType: String,
    val data: Point,
    val message: String
)

data class Point(
    val point: Int
)



