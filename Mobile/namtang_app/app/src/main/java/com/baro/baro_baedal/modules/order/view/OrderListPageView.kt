package com.baro.baro_baedal.modules.order.view

import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.order.data.OrderList
import com.baro.baro_baedal.modules.order.data.OrderListInfo
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import androidx.compose.foundation.clickable
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.baro.baro_baedal.modules.main.view.BottomSection

@Composable
fun OrderListPageView(navController: NavController) {

    val context = LocalContext.current
    var orderList by remember { mutableStateOf<List<OrderList>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        val tokenHeader = getTokenHeader(context)
        if (tokenHeader != null) {
            val api = RetrofitClient.instance.create(AllApi::class.java)

            api.getOrderListInfo(tokenHeader).enqueue(object : Callback<OrderListInfo> {
                override fun onResponse(call: Call<OrderListInfo>, response: Response<OrderListInfo>) {
                    if (response.isSuccessful) {
                        val body = response.body()
                        if (body != null) {
                            orderList = body.data
                            Log.d("OrderList", "주문 ${orderList.size}건 불러옴")
                            Log.d("OrderList", "주문 ${orderList}")
                        } else {
                            Toast.makeText(context, "주문 데이터가 없습니다.", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(context, "주문 조회 실패 (${response.code()})", Toast.LENGTH_SHORT).show()
                        Log.w("OrderList", "Response code: ${response.code()}")
                    }
                    isLoading = false
                }

                override fun onFailure(call: Call<OrderListInfo>, t: Throwable) {
                    Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                    Log.e("OrderList", "네트워크 오류", t)
                    isLoading = false
                }
            })
        } else {
            Toast.makeText(context, "토큰 정보가 없습니다.", Toast.LENGTH_SHORT).show()
            isLoading = false
        }
    }

    Scaffold(
        bottomBar = {
            Box( Modifier.navigationBarsPadding()
                .height(60.dp)){
                BottomSection(navController)
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            // ✅ 상단 타이틀
            Text(
                text = "주문 내역",
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                color = Color.Black,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            when {
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                orderList.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("주문 내역이 없습니다.")
                    }
                }

                else -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(orderList) { order ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        navController.currentBackStackEntry
                                            ?.savedStateHandle
                                            ?.set("OrderDetail", order)
                                        navController.navigate("order_detail")
                                    },
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8F8F8)),
                                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text("가게명: ${order.storeName}", fontWeight = FontWeight.SemiBold)
                                    Text("메뉴명: ${order.menuTitle}")
                                    Text("수량: ${order.quantity}")
                                    Text("총금액: ${order.totalPrice}원")
                                    Text(
                                        "주문일시: ${order.createdAt}",
                                        color = Color.Gray,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}