package com.baro.baro_baedal.modules.mypage.data
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

data class MemberInfo(
    val responseType: String,
    val data: Member,
    val message: String
)

@Parcelize
data class Member(
    val userid: String,
    val name: String,
    val birth: String,
    val phone: String,
    val email: String,
    val address: String,
    val point: Int
) : Parcelable