package com.baro.baro_baedal.modules.mypage.data

import android.icu.text.CaseMap.Title
import kotlinx.parcelize.Parcelize
import android.os.Parcelable

data class NoticeInfo(
    val responseType: String,
    val data: List<NoticeInfoDetail>,
    val message: String
)

@Parcelize
data class NoticeInfoDetail(
    val id: Int,
    val category: String,
    val memberId: Int,
    val title: String,
    val content: String,
    val createdAt: String
) : Parcelable

//@Parcelize
//data class NoticeInfo(
//    val id: Int,
//    val category: String,
//    val memberId: Int,
//    val title: String,
//    val content: String,
//    val createdAt: String
//) : Parcelable