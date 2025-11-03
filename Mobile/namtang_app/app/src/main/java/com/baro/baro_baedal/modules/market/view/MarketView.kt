package com.barobaedal.barobaedal.modules.market

import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.baro.baro_baedal.modules.market.data.StoreMenuResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import com.baro.baro_baedal.modules.market.data.MenuItem
import android.util.Log
import com.baro.baro_baedal.modules.common.Config

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketView(
    navController: NavController,
    storeId: Int,
    storeName: String,
    thumbnail: String
) {
    val context = LocalContext.current
    val allApi = RetrofitClient.instance.create(AllApi::class.java)
    var menuList by remember { mutableStateOf<List<MenuItem>>(emptyList()) }
    var decodeThumbnail by remember { mutableStateOf("") }

    LaunchedEffect(storeId) {
        val tokenHeader = getTokenHeader(context)
        if (tokenHeader == null) return@LaunchedEffect

        allApi.getStoreMenus(tokenHeader, storeId).enqueue(object : Callback<StoreMenuResponse> {
            override fun onResponse(
                call: Call<StoreMenuResponse>,
                response: Response<StoreMenuResponse>
            ) {
                if (response.isSuccessful) {
                    val body = response.body()
                    menuList = body?.data ?: emptyList()
                } else {
                    Toast.makeText(context, "메뉴 불러오기 실패 (${response.code()})", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<StoreMenuResponse>, t: Throwable) {
                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp)
            ) {
                if (!thumbnail.isNullOrEmpty())
                    decodeThumbnail = Uri.decode(thumbnail.trimStart('u'))
                Image(
                    painter = if (thumbnail.isNotEmpty() && thumbnail != "null")
                        rememberAsyncImagePainter(Config.BASE_URL + "u" + decodeThumbnail)
                    else painterResource(id = R.drawable.noimage),
                    contentDescription = "가게 이미지",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop

                )
                Log.e("Thumbnail", "Thumbnail : ${decodeThumbnail}")
                // ✅ 반투명 블러 영역
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.4f))
                        .align(Alignment.BottomCenter)
                        .padding(12.dp)
                ) {
                    Text(
                        text = storeName,
                        color = Color.White,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                IconButton(
                    onClick = { navController.popBackStack() },
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(top = 60.dp)
                        .background(Color.Black.copy(alpha = 0.4f), shape = MaterialTheme.shapes.small)
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "뒤로가기",
                        tint = Color.White
                    )
                }
            }
        }

        if (menuList.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("등록된 메뉴가 없습니다.", color = Color.Gray, fontSize = 18.sp)
                }
            }
        } else {
            items(menuList) { menu ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .padding(horizontal = 16.dp)
                        .clickable {
                            navController.navigate("menu/${menu.id}")
                        },
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Log.e("Thumbnail", "Thumbnail : ${menu.thumbnail}")
                        Image(

                            painter = if (!menu.thumbnail.isNullOrEmpty() && menu.thumbnail != "null")
                                rememberAsyncImagePainter(Config.BASE_URL + menu.thumbnail)
                            else painterResource(id = R.drawable.noimage),
                            contentDescription = "메뉴 이미지",
                            modifier = Modifier
                                .size(100.dp)
                                .padding(end = 12.dp),
                            contentScale = ContentScale.Crop
                        )

                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(menu.title, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text(menu.content, fontSize = 14.sp, color = Color.Gray)
                            Text("${menu.price}원", fontSize = 16.sp, color = Color(0xFFB71C1C))
                        }
                    }
                }
            }
        }
    }
}