package com.baro.baro_baedal.modules.mypage.view

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.mypage.data.AddPoint
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PointChargePageView(navController: NavController, currentPoint: Int) {
    val context = LocalContext.current
    var chargeAmount by remember { mutableStateOf("") } // 입력된 포인트 값
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("포인트 충전", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "뒤로가기"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8F8F8)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(Color.White, RoundedCornerShape(10.dp))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {

                /** 🔹 현재 포인트 표시 */
                Text(
                    text = "현재 포인트: ${currentPoint} P",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )

                /** 🔹 입력 칸 */
                OutlinedTextField(
                    value = chargeAmount,
                    onValueChange = { chargeAmount = it.filter { ch -> ch.isDigit() } }, // 숫자만 입력
                    label = { Text("충전할 포인트 입력") },
                    placeholder = { Text("예: 10000") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                /** 🔹 충전 버튼 */
                Button(
                    onClick = {
                        val amount = chargeAmount.toIntOrNull()
                        if (amount == null || amount <= 0) {
                            Toast.makeText(context, "유효한 포인트를 입력하세요.", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        coroutineScope.launch {
                            val tokenHeader = getTokenHeader(context)
                            if (tokenHeader == null) return@launch

                            val api = RetrofitClient.instance.create(AllApi::class.java)
                            val request = AddPoint(amount)

                            api.addPoint(tokenHeader, request).enqueue(object : Callback<Void> {
                                override fun onResponse( call: Call<Void>, response: Response<Void>
                                ) {
                                   if (response.isSuccessful) {
                                       Toast.makeText(context, "${amount} 충전이 완료되었습니다.", Toast.LENGTH_SHORT).show()
                                   } else {
                                       Toast.makeText(context, "충전 실패 : ${response.code()}", Toast.LENGTH_SHORT).show()
                                   }
                                }

                                override fun onFailure(call: Call<Void>, t: Throwable) {
                                    Toast.makeText(context, "네트워크 오류 : ${t.message}", Toast.LENGTH_SHORT).show()
                                }
                            })
                        }



                        Toast.makeText(
                            context,
                            "${amount}P 충전이 완료되었습니다!",
                            Toast.LENGTH_SHORT
                        ).show()
                        navController.popBackStack() // 충전 후 뒤로가기
                  },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFC107))
                ) {
                    Text("충전하기", color = Color.Black, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
