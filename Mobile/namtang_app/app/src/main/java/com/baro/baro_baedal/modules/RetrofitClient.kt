package com.baro.baro_baedal.modules

import com.baro.baro_baedal.modules.common.Config
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    //private const val BASE_URL = "http://10.0.2.2:8080"
    //private const val BASE_URL = "http://192.168.72.155:8080"
    private const val BASE_URL = Config.BASE_URL

    val instance: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}