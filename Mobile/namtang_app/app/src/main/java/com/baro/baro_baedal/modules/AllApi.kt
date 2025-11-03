package com.baro.baro_baedal.modules

import com.baro.baro_baedal.modules.login.data.LoginRequest
import com.baro.baro_baedal.modules.login.data.LoginResponse
import com.baro.baro_baedal.modules.main.data.SearchResponse
import com.baro.baro_baedal.modules.order.data.OrderListInfo
import com.baro.baro_baedal.modules.market.data.OrderRequest
import com.baro.baro_baedal.modules.market.data.PayPoint
import com.baro.baro_baedal.modules.market.data.SetPoint
import com.baro.baro_baedal.modules.market.data.SingleMenuResponse
import com.baro.baro_baedal.modules.market.data.StoreMenuResponse
import com.baro.baro_baedal.modules.mypage.data.AddPoint
import com.baro.baro_baedal.modules.mypage.data.MemberInfo
import com.baro.baro_baedal.modules.mypage.data.NoticeInfo
import com.baro.baro_baedal.modules.mypage.data.QnaRequest
import com.baro.baro_baedal.modules.mypage.data.UpdateMember
import com.baro.baro_baedal.modules.register.data.MemberReg
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Path
import java.lang.Void

interface AllApi {
    @POST("/api/member/register")
    fun registerMember(@Body memberReg: MemberReg): Call<Void>

    @POST("/api/member/login")
    fun loginMember(@Body request: LoginRequest): Call<LoginResponse>

    @GET("/api/store/search")
    fun searchStores(@Header("Authorization") token: String, @Query("name") name: String): Call<SearchResponse>

    @GET("/api/store/all")
    fun getAllStores(@Header("Authorization") token: String): Call<SearchResponse>

    @GET("/api/menu/store/{store_id}")
    fun getStoreMenus(@Header("Authorization") token: String, @Path("store_id") storeId: Int): Call<StoreMenuResponse>

    @GET("/api/menu/info/{id}")
    fun getMenuInfo(@Header("Authorization") token: String, @Path("id") id: Int): Call<SingleMenuResponse>

    @POST("/api/order/create")
    fun createOrder(@Header("Authorization") token: String, @Body order: OrderRequest): Call<Void>

    @GET("/api/member/info")
    fun getMemberInfo(@Header("Authorization") token: String): Call<MemberInfo>

    @POST("/api/member/info")
    fun updateMemberInfo(@Header("Authorization") token: String, @Body member: UpdateMember): Call<Void>

    @GET("/api/order/member")
    fun getOrderListInfo(@Header("Authorization") token: String): Call<OrderListInfo>

    @POST("/api/member/point/add")
    fun addPoint(@Header("Authorization") token: String, @Body point: AddPoint): Call<Void>

    @GET("/api/member/point/info")
    fun getPoint(@Header("Authorization") token: String): Call<PayPoint>

    @POST("/api/member/point/info")
    fun setPoint(@Header("Authorization") token: String, @Body point: SetPoint): Call<Void>

    @POST("/api/board")
    fun createQna(@Header("Authorization") token: String, @Body qnareq: QnaRequest): Call<Void>

    @GET("/api/board")
    //fun getNotice(@Header("Authorization") token: String, @Query("category") category: String): Call<List<NoticeInfo>>
    fun getNotice(@Header("Authorization") token: String, @Query("category") category: String): Call<NoticeInfo>
}