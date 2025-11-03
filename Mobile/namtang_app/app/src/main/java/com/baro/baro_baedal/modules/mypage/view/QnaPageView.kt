package com.baro.baro_baedal.modules.mypage.view

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.mypage.data.QnaInfo
import com.baro.baro_baedal.modules.mypage.data.QnaRequest
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QnaPageView(navController: NavController, userId: String) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val api = RetrofitClient.instance.create(AllApi::class.java)

    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("문의하기", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "뒤로가기")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(20.dp)
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.Start,
                modifier = Modifier.fillMaxWidth()
            ) {
                /** 작성자 (읽기 전용) */
                Text("작성자", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = userId,
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth()
                )

                /** 제목 */
                Text("제목", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    placeholder = { Text("문의 제목을 입력하세요") },
                    modifier = Modifier.fillMaxWidth()
                )

                /** 내용 */
                Text("내용", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    placeholder = { Text("문의 내용을 입력하세요") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    maxLines = 10
                )

                Spacer(modifier = Modifier.height(20.dp))

                /** 보내기 버튼 */
                Button(
                    onClick = {
                        if (title.isBlank() || content.isBlank()) {
                            Toast.makeText(context, "제목과 내용을 모두 입력해주세요", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        Toast.makeText(context, "문의 등록 완료", Toast.LENGTH_SHORT).show()
                        navController.popBackStack() // 마이페이지로 복귀
                        scope.launch {
                            isLoading = true
                            val tokenHeader = getTokenHeader(context)
                            val qnaBody = QnaRequest(id=0, category = "qna", memberId = 0, title, content, "")

                            api.createQna(tokenHeader ?: "", qnaBody)
                                .enqueue(object : Callback<Void> {
                                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                                        isLoading = false
                                        if (response.isSuccessful) {
                                            Toast.makeText(context, "문의 등록 완료", Toast.LENGTH_SHORT).show()
                                            //navController.popBackStack() // 마이페이지로 복귀
                                            navController.navigate("mypage") {
                                                popUpTo("mypage") { inclusive = false }
                                                launchSingleTop = true
                                            }
                                        } else {
                                            Toast.makeText(context, "등록 실패 (${response.code()})", Toast.LENGTH_SHORT).show()
                                        }
                                    }

                                    override fun onFailure(call: Call<Void>, t: Throwable) {
                                        isLoading = false
                                        Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                                    }
                                })
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = !isLoading
                ) {
                    Text(if (isLoading) "전송 중..." else "보내기", fontSize = 18.sp)
                }
            }
        }
    }
}