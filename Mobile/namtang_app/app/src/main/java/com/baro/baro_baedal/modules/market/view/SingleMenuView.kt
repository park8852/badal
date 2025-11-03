package com.barobaedal.barobaedal.modules.market.view

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
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.market.data.SingleMenuResponse
import com.baro.baro_baedal.modules.market.data.SingleMenuItem
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import com.baro.baro_baedal.R
import com.baro.baro_baedal.datastore.getJwt
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.common.Config
import kotlinx.coroutines.flow.first

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SingleMenuView(navController: NavController, menuId: Int) {
    val context = LocalContext.current
    var menu by remember { mutableStateOf<SingleMenuItem?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var quantity by remember { mutableStateOf(1) } // ✅ 수량 상태
    val allApi = RetrofitClient.instance.create(AllApi::class.java)

    LaunchedEffect(menuId) {
        val tokenHeader = getTokenHeader(context)
        if (tokenHeader == null) return@LaunchedEffect

        allApi.getMenuInfo(tokenHeader, menuId).enqueue(object : Callback<SingleMenuResponse> {
            override fun onResponse(call: Call<SingleMenuResponse>, response: Response<SingleMenuResponse>) {
                if (response.isSuccessful) {
                    val body  = response.body()
                    menu = body?.data

                } else {
                    errorMessage = "메뉴 정보를 불러오지 못했습니다."
                }
                isLoading = false
            }

            override fun onFailure(call: Call<SingleMenuResponse>, t: Throwable) {
                errorMessage = "네트워크 오류: ${t.message}"
                isLoading = false
            }
        })
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("메뉴 상세", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            painter = rememberAsyncImagePainter("https://cdn-icons-png.flaticon.com/512/93/93634.png"),
                            contentDescription = "뒤로가기"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFFFAFAFA))
            )
        }
    ) { innerPadding ->
        when {
            isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            errorMessage != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(errorMessage ?: "알 수 없는 오류")
                }
            }

            menu != null -> {
                val item = menu!!

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        val painter = if (item.thumbnail != null &&
                            item.thumbnail.isNotBlank() &&
                            item.thumbnail != "null"
                        ) {
                            rememberAsyncImagePainter(Config.BASE_URL + item.thumbnail)
                            //rememberAsyncImagePainter("http://192.168.72.196:8080/"+item.thumbnail)
                        } else {
                            painterResource(id = R.drawable.noimage)
                        }

                        Image(
                            painter = painter,
                            contentDescription = "메뉴 이미지",
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(250.dp),
                            contentScale = ContentScale.Crop
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // ✅ 제목 / 가격 / 설명
                        Text(item.title, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("${item.price}원", color = MaterialTheme.colorScheme.primary, fontSize = 20.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(item.content, fontSize = 16.sp, lineHeight = 22.sp)
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // ✅ 수량 조절 및 주문 버튼
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFF8F8F8))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // 수량 조절
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Button(
                                onClick = { if (quantity > 1) quantity-- },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0E0E0))
                            ) {
                                Text("-", fontSize = 22.sp, color = Color.Black)
                            }
                            Text(
                                "$quantity",
                                modifier = Modifier.padding(horizontal = 20.dp),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Button(
                                onClick = { quantity++ },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0E0E0))
                            ) {
                                Text("+", fontSize = 22.sp, color = Color.Black)
                            }
                        }

                        // ✅ 총 금액 계산
                        Text(
                            "총 금액: ${item.price * quantity}원",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFB71C1C)
                        )

                        // ✅ 주문하기 버튼
                        Button(
                            onClick = {
                                val total = item.price * quantity
                                Toast.makeText(context, "주문 페이지로 이동", Toast.LENGTH_SHORT).show()

                                navController.navigate("order/${item.id}/$quantity")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1976D2))
                        ) {
                            Text("주문하기", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}