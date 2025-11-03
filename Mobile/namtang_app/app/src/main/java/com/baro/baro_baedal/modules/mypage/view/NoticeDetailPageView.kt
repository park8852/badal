package com.baro.baro_baedal.modules.mypage.view

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.baro.baro_baedal.modules.mypage.data.NoticeInfo
import com.baro.baro_baedal.modules.mypage.data.NoticeInfoDetail

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoticeDetailPageView(
    navController: NavController,
    notice: NoticeInfoDetail
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("공지사항 상세") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "뒤로가기")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = notice.title,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = notice.createdAt,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.secondary
            )
            Divider(thickness = 1.dp)
            Text(
                text = notice.content,
                fontSize = 15.sp,
                lineHeight = 22.sp
            )
        }
    }
}