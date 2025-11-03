package com.baro.baro_baedal.modules.main.view

import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.*
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.times
import androidx.navigation.NavController
import com.baro.baro_baedal.R
import com.baro.baro_baedal.datastore.getJwt
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.main.data.SearchResponse
import com.baro.baro_baedal.modules.main.data.StoreInfo
import kotlinx.coroutines.flow.first
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import android.net.Uri
import com.baro.baro_baedal.modules.common.Config

@Composable
fun MiddleSection(navController: NavController, searchQuery: String) {
    val configuration = LocalConfiguration.current
    val screenHeightDp = configuration.screenHeightDp
    val context = LocalContext.current

    val allApi = RetrofitClient.instance.create(AllApi::class.java)
    var storeList by remember { mutableStateOf<List<StoreInfo>>(emptyList()) }

    var jwtToken by remember { mutableStateOf<String?>(null) }
    var encodedThumbnail by remember { mutableStateOf("") }

    LaunchedEffect(searchQuery) {
        val tokenHeader = getTokenHeader(context)
        if (tokenHeader == null) return@LaunchedEffect

        if (searchQuery.isNotBlank()) {
            allApi.searchStores(tokenHeader, searchQuery)
                .enqueue(object : Callback<SearchResponse> {
                    override fun onResponse(
                        call: Call<SearchResponse>,
                        response: Response<SearchResponse>
                    ) {
                        if (response.isSuccessful) {
                            val body = response.body()
                            storeList = body?.data ?: emptyList()
                        } else {
                            Toast.makeText(context, "검색 실패 (${response.code()}", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: Call<SearchResponse>, t: Throwable) {
                        Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                        Log.d("Error", "Network Error: ${t.message}")
                    }
                })
        } else {
            allApi.getAllStores(tokenHeader)
                .enqueue(object : Callback<SearchResponse> {
                    override fun onResponse(
                        call: Call<SearchResponse>,
                        response: Response<SearchResponse>
                    ) {
                        if (response.isSuccessful) {
                            val body = response.body()
                            storeList = body?.data ?: emptyList()
                            Log.d("Store List", "Store List: ${storeList}")
                        } else {
                            Toast.makeText(context, "전체 조회 실패 (${response.code()}", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: Call<SearchResponse>, t: Throwable) {
                        Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                        Log.d("Error", "Network Error: ${t.message}")
                    }
                }
            )
        }
    }

    Box(
        modifier = Modifier
            .height(screenHeightDp * (70 / 100f).dp)
            .background(Color.White)
            .padding(16.dp)
    ) {
        if (storeList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize(),
                contentAlignment = Alignment.Center
            ){
                Text("검색 결과가 없습니다.", color = Color.Gray)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(storeList) { store ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp)
                            .clickable {
                                if (!store.thumbnail.isNullOrEmpty())
                                {
                                    encodedThumbnail = Uri.encode(store.thumbnail.trimStart('u'))
                                }
                                else {
                                    encodedThumbnail = store.thumbnail
                                }

                                navController.navigate("market/${store.id}/${store.name}/${encodedThumbnail}")
                            },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8F8F8)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val painter = if (!store.thumbnail.isNullOrEmpty() && store.thumbnail != "null") {
                                //coil.compose.rememberAsyncImagePainter("http://192.168.72.196:8080/"+store.thumbnail)
                                coil.compose.rememberAsyncImagePainter(Config.BASE_URL + store.thumbnail)
                            } else {
                                painterResource(id = R.drawable.noimage)
                            }

                            Image(
                                painter = painter,
                                contentDescription = "가게 이미지",
                                modifier = Modifier
                                    .size(70.dp)
                                    .padding(end = 12.dp),
                                contentScale = ContentScale.Crop
                            )

                            Column(
                                modifier = Modifier.fillMaxSize().padding(4.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(store.name, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    "${"%02d".format(store.openH)}:${"%02d".format(store.openM)}" +
                                            "~ ${"%02d".format(store.closedH)}:${"%02d".format(store.closedM)}",
                                    fontSize = 15.sp,
                                    color = Color.Black
                                )
                            }
                        }
                    }
                }
            }
        }

    }
}