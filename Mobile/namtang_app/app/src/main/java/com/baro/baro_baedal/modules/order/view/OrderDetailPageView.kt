package com.baro.baro_baedal.modules.order.view

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.baro.baro_baedal.modules.order.data.OrderList

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailPageView(navController: NavController, order: OrderList) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("주문 상세 내역", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "뒤로가기")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // ✅ 주문 상세 항목
            Text("가게명: ${order.storeName}", fontSize = 18.sp, fontWeight = FontWeight.Medium)
            Text("메뉴명: ${order.menuTitle}", fontSize = 18.sp)
            Text("수량: ${order.quantity}", fontSize = 18.sp)
            Text("총 금액: ${order.totalPrice}원", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text("주문일시: ${order.createdAt}", fontSize = 16.sp, color = Color.Gray)
            Text("가게 주소: ${order.storeAddress}", fontSize = 18.sp)

            Divider(thickness = 1.dp, color = Color(0xFFE0E0E0))

            Text("주문자 이름: ${order.customerName}", fontSize = 18.sp, fontWeight = FontWeight.Medium)
            Text("연락처: ${order.customerPhone}", fontSize = 18.sp)
            Text("주소: ${order.customerAddress}", fontSize = 18.sp)
            Text("결제방법: ${order.paymentMethod}", fontSize = 18.sp)
        }
    }
}


