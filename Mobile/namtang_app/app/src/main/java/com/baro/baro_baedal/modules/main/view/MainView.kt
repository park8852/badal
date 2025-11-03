package com.barobaedal.barobaedal.modules.main.view

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.*
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.times
import androidx.navigation.NavController
import com.baro.baro_baedal.modules.main.view.BottomSection
import com.baro.baro_baedal.modules.main.view.MiddleSection
import com.baro.baro_baedal.modules.main.view.TopSection
import kotlinx.coroutines.delay

@Composable
fun MainView(navController: NavController) {
    val configuration = LocalConfiguration.current
    val screenHeightDp = configuration.screenHeightDp

    var searchQuery by rememberSaveable { mutableStateOf("") }

    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        delay(1500)
        isLoading = false
    }

    if (isLoading) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Color(0xFF1976D2))
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "메인 화면을 불러오는 중입니다...",
                    color = Color.Gray,
                    fontSize = 16.sp
                )
            }
        }
    } else {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            TopSection(
                onSearch = { query ->
                    searchQuery = query
                }
            )
            MiddleSection(navController, searchQuery)
            BottomSection(navController)
        }
    }
}