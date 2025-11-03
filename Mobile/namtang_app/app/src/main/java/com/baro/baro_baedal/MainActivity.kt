package com.baro.baro_baedal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.ui.theme.BarobaedalTheme



class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        //RetrofitClient.init(applicationContext)
        enableEdgeToEdge()
        setContent {
            BarobaedalTheme {
                AppNavigator()
            }
        }
    }
}

