package com.baro.baro_baedal.modules.order.data
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

data class OrderListInfo(
    val responseType: String,
    val data: List<OrderList>,
    val message: String
)

@Parcelize
data class OrderList(
    val id: Int,
    val memberId: Int,
    val storeId: Int,
    val menuId: Int,
    val quantity: Int,
    val totalPrice: Int,
    val createdAt: String,
    val customerName: String,
    val customerPhone: String,
    val customerAddress: String,
    val storeName: String,
    val storeAddress: String,
    val menuTitle: String,
    val paymentMethod: String
) : Parcelable