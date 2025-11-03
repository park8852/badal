package com.baro.baro_baedal.modules.market.view

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.baro.baro_baedal.R
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.common.Config
import com.baro.baro_baedal.modules.market.data.OrderRequest
import com.baro.baro_baedal.modules.market.data.PayPoint
import com.baro.baro_baedal.modules.market.data.Point
import com.baro.baro_baedal.modules.market.data.SetPoint
import com.baro.baro_baedal.modules.market.data.SingleMenuItem
import com.baro.baro_baedal.modules.market.data.SingleMenuResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderPageView(navController: NavController, menuId: Int, quantity: Int) {
    val context = LocalContext.current
    val api = RetrofitClient.instance.create(AllApi::class.java)
    var menu by remember { mutableStateOf<SingleMenuItem?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var tokenHeader by remember { mutableStateOf("") }
    var point by remember { mutableStateOf<Point?>(null) }
    var showPointDialog by remember { mutableStateOf(false) }
    var showFailDialog by remember { mutableStateOf(false) }

    LaunchedEffect(menuId) {

        tokenHeader = getTokenHeader(context) ?: ""
        if (tokenHeader == null) return@LaunchedEffect

        api.getMenuInfo(tokenHeader, menuId).enqueue(object : Callback<SingleMenuResponse> {
            override fun onResponse(call: Call<SingleMenuResponse>, response: Response<SingleMenuResponse>) {
                if (response.isSuccessful) {
                    val body = response.body()
                    menu = body?.data
                } else {
                    Toast.makeText(context, "메뉴 정보를 불러오지 못했습니다.", Toast.LENGTH_SHORT).show()
                }
                isLoading = false
            }

            override fun onFailure(call: Call<SingleMenuResponse>, t: Throwable) {
                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                isLoading = false
            }
        })
    }

    LaunchedEffect(point) {
        tokenHeader = getTokenHeader(context) ?: ""
        if (tokenHeader == null) return@LaunchedEffect

        api.getPoint(tokenHeader).enqueue(object : Callback<PayPoint> {
            override fun onResponse(call: Call<PayPoint>, response: Response<PayPoint>) {
                if (response.isSuccessful) {
                    val body = response.body()
                    point = body?.data
                } else {
                    Toast.makeText(context, " 포인트 조회 실패", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<PayPoint>, t: Throwable) {
                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("주문 결제", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            painter = rememberAsyncImagePainter("https://cdn-icons-png.flaticon.com/512/93/93634.png"),
                            contentDescription = "뒤로가기"
                        )
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (menu != null) {
            val totalPrice = menu!!.price * quantity

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(20.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    val painter = if (menu!!.thumbnail != null &&
                        menu!!.thumbnail.isNotBlank() &&
                        menu!!.thumbnail != "null"
                    ) {
                        rememberAsyncImagePainter(Config.BASE_URL + menu!!.thumbnail)
                        //rememberAsyncImagePainter("http://192.168.72.196:8080/"+menu!!.thumbnail)
                    } else {
                        painterResource(id = R.drawable.noimage)
                    }
                    Image(
                        painter = painter,
                        contentDescription = "메뉴 이미지",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentScale = ContentScale.Crop
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Text(menu!!.title, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("수량: $quantity 개", fontSize = 16.sp)
                    Text("단가: ${menu!!.price} 원", fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Divider(thickness = 1.dp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("총 결제 금액: ${totalPrice} 원", fontSize = 20.sp, color = Color.Red, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        val currentTime = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

                        val order = OrderRequest(
                            storeId = menu!!.storeId,
                            menuId = menuId,
                            quantity = quantity,
                            totalPrice = totalPrice,
                            createdAt = currentTime
                        )
                        val userPoint = point?.point ?: 0

                        if (userPoint - totalPrice < 0) {
                            showPointDialog = true
                            return@Button
                        }
                        val finalPoint = SetPoint(userPoint - totalPrice)

                        api.setPoint(tokenHeader, finalPoint).enqueue(object : Callback<Void> {
                            override fun onResponse(call: Call<Void>, response: Response<Void>) {
                                if (response.isSuccessful) {
                                    api.createOrder(tokenHeader, order).enqueue(object : Callback<Void> {
                                        override fun onResponse(call: Call<Void>, response: Response<Void>) {
                                            if (response.isSuccessful) {
                                                Toast.makeText(context, "결제가 완료되었습니다.", Toast.LENGTH_SHORT).show()
                                                navController.navigate("home") {
                                                    popUpTo(0)
                                                    launchSingleTop = true
                                                }
                                            } else {
                                                Toast.makeText(context, "주문 등록 실패 (${response.code()}", Toast.LENGTH_SHORT).show()
                                            }
                                        }

                                        override fun onFailure(call: Call<Void>, t: Throwable) {
                                            Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                                        }
                                    })
                                }
                                else {
                                    Toast.makeText(context, "포인트 갱신 실패 (${response.code()}", Toast.LENGTH_SHORT).show()
                                    showFailDialog = true
                                }

                            }
                            override fun onFailure(call: Call<Void>, t: Throwable) {
                                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                                showFailDialog = true
                            }
                        })
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(55.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1976D2))
                ) {
                    Text("결제하기", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
    if (showPointDialog) {
        AlertDialog(
            onDismissRequest = { showPointDialog = false },
            title = { Text("포인트 부족") },
            text = { Text("보유 포인트가 결제 금액보다 적습니다.\n충전 후 다시 시도해주세요.") },
            confirmButton = {
                TextButton(onClick = { showPointDialog = false }) {
                    Text("확인")
                }
            },
            containerColor = Color.White
        )
    }

    if (showFailDialog) {
        AlertDialog(
            onDismissRequest = { showFailDialog = false },
            title = { Text("결제 실패") },
            text = { Text("포인트 차감 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.") },
            confirmButton = {
                TextButton(onClick = { showFailDialog = false }) {
                    Text("확인")
                }
            }
        )
    }
}