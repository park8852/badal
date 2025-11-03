package com.baro.baro_baedal.modules.mypage.view

import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import com.baro.baro_baedal.datastore.deleteJwt
import com.baro.baro_baedal.datastore.getJwt
import com.baro.baro_baedal.datastore.getTokenHeader
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.main.view.BottomSection
import com.baro.baro_baedal.modules.mypage.data.Member
import com.baro.baro_baedal.modules.mypage.data.MemberInfo
import com.baro.baro_baedal.modules.mypage.data.NoticeInfo
import com.baro.baro_baedal.modules.mypage.data.NoticeInfoDetail
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MypageView(navController: NavController) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var memberInfo by remember { mutableStateOf<Member?>(null) }
    var userName by remember { mutableStateOf("") }

    var isLoading by remember { mutableStateOf(true) }
    var allApi = RetrofitClient.instance.create(AllApi::class.java)


    LaunchedEffect(Unit) {
        val tokenHeader = getTokenHeader(context)
        if (tokenHeader == null) return@LaunchedEffect

        allApi.getMemberInfo(tokenHeader).enqueue(object : Callback<MemberInfo> {
            override fun onResponse(call: Call<MemberInfo>, response: Response<MemberInfo>) {
                if (response.isSuccessful) {
                    val body = response.body()
                    memberInfo = body?.data
                    userName = memberInfo?.name ?:"이름 없음"
                } else {
                    Toast.makeText(context, "회원정보 조회 실패 (${response.code()}", Toast.LENGTH_SHORT).show()
                }
                isLoading = false
            }

            override fun onFailure(call: Call<MemberInfo>, t: Throwable) {
                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                isLoading = false
            }
        })
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("마이페이지", fontWeight = FontWeight.Bold) },
                actions = {
                    TextButton(onClick = {
                        coroutineScope.launch {
                            context.deleteJwt()
                            Toast.makeText(context, "로그아웃 완료", Toast.LENGTH_SHORT).show()
                            navController.navigate("login") {
                                popUpTo(0)
                                launchSingleTop = true
                            }
                        }
                    }) {
                        Text("로그아웃", color = Color.Gray, fontSize = 14.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            Box( Modifier.navigationBarsPadding()
                .height(60.dp)){
                BottomSection(navController)
            }
        }
    ) { innerPadding ->

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color(0xFFF8F8F8))
                    .padding(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {

                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(10.dp))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // 🔹 회원명
                        Text(
                            text = "회원명: ${memberInfo?.name ?: "이름 없음"}",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )

                        // 🔹 회원정보 수정 버튼
                        Button(
                            onClick = {
                                memberInfo?.let { info ->
                                    navController.currentBackStackEntry?.savedStateHandle?.set("Member", info)
                                    navController.navigate("profile_edit")
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1976D2))
                        ) {
                            Text("회원정보 수정", color = Color.White, fontSize = 16.sp)
                        }
                    }
                }

                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(10.dp))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // 🔹 포인트 표시
                        Text(
                            text = "포인트: ${memberInfo?.point ?: 0} P",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.Black
                        )

                        // 🔹 포인트 충전 버튼
                        Button(
                            onClick = {
                                navController.navigate("point_charge/${memberInfo?.point ?: 0}")
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFC107))
                        ) {
                            Text("포인트 충전", color = Color.Black, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                item {
                    var noticeList by remember { mutableStateOf<List<NoticeInfoDetail>>(emptyList()) }

                    LaunchedEffect(Unit) {
                        val tokenHeader = getTokenHeader(context)
                        if (tokenHeader == null) return@LaunchedEffect

                        allApi.getNotice(tokenHeader, "notice").enqueue(object : Callback<NoticeInfo> {
                            override fun onResponse(
                                call: Call<NoticeInfo>,
                                response: Response<NoticeInfo>
                            ) {
                                if (response.isSuccessful) {
                                    val body = response.body()
                                    noticeList = body?.data ?: emptyList()
                                    Log.e("Notice", "Loaded: ${noticeList.size} notices")
                                } else {
                                    Toast.makeText(context, "공지사항 불러오기 실패 : (${response.code()}", Toast.LENGTH_SHORT).show()
                                    Log.e("Notice", "Loaded: ${response.code()} error")
                                }
                            }


                            override fun onFailure(call: Call<NoticeInfo>, t: Throwable) {
                                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                                Log.e("Notice", "Error: ${t.message}")
                            }
                        })

                    }
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Text(
                            text = "공지사항",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 18.sp,
                            color = Color.Black
                        )
                    }

                    if (noticeList.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("등록된 공지사항이 없습니다.", color = Color.Gray, fontSize = 14.sp)
                        }
                    } else {
                        val pages = noticeList.chunked(5)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState())
                                .padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            pages.forEach { page ->
                                Column(
                                    modifier = Modifier
                                        .width(300.dp)
                                        .background(Color.White, RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    page.forEach { notice ->
                                        Card(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(65.dp)
                                                .clickable {
                                                    navController.currentBackStackEntry
                                                        ?.savedStateHandle
                                                        ?.set("noticeDetail", notice)
                                                    navController.navigate("notice_detail")
                                                },
                                            colors = CardDefaults.cardColors(
                                                containerColor = Color(
                                                    0xFFF8F8F8
                                                )
                                            ),
                                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .padding(10.dp),
                                                verticalArrangement = Arrangement.Center
                                            ) {
                                                Text(
                                                    text = notice.title,
                                                    fontSize = 14.sp,
                                                    color = Color.Black,
                                                    fontWeight = FontWeight.Medium
                                                )
                                                Text(
                                                    text = notice.createdAt,
                                                    fontSize = 12.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                /** ✅ 문의내역 */
                /** ✅ 문의내역 */
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Text(
                            text = "문의내역",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 18.sp,
                            color = Color.Black
                        )
                    }

                    // 🔹 서버에서 받아올 문의내역 리스트
                    var qnaList by remember { mutableStateOf<List<NoticeInfoDetail>>(emptyList()) }

                    LaunchedEffect(Unit) {
                        val tokenHeader = getTokenHeader(context)
                        if (tokenHeader == null) return@LaunchedEffect

                        allApi.getNotice(tokenHeader, "qna").enqueue(object : Callback<NoticeInfo> {
                            override fun onResponse(
                                call: Call<NoticeInfo>,
                                response: Response<NoticeInfo>
                            ) {
                                if (response.isSuccessful) {
                                    val body = response.body()
                                    qnaList = body?.data ?: emptyList()
                                    Log.e("QNA", "Loaded: ${qnaList.size} items")
                                } else {
                                    Toast.makeText(
                                        context,
                                        "문의내역 불러오기 실패 (${response.code()})",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                    Log.e("QNA", "Error Code: ${response.code()}")
                                }
                            }

                            override fun onFailure(call: Call<NoticeInfo>, t: Throwable) {
                                Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                                Log.e("QNA", "Error: ${t.message}")
                            }
                        })
                    }

                    // 🔹 문의내역 UI 구성
                    if (qnaList.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("등록된 문의내역이 없습니다.", color = Color.Gray, fontSize = 14.sp)
                        }
                    } else {
                        val pages = qnaList.chunked(5)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState())
                                .padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            pages.forEach { page ->
                                Column(
                                    modifier = Modifier
                                        .width(300.dp)
                                        .background(Color.White, RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    page.forEach { qna ->
                                        Card(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(65.dp)
                                                .clickable {
                                                    navController.currentBackStackEntry
                                                        ?.savedStateHandle
                                                        ?.set("QnaDetail", qna)
                                                    navController.navigate("qna_detail")
                                                },
                                            colors = CardDefaults.cardColors(
                                                containerColor = Color(0xFFF8F8F8)
                                            ),
                                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .padding(10.dp),
                                                verticalArrangement = Arrangement.Center
                                            ) {
                                                Text(
                                                    text = qna.title,
                                                    fontSize = 14.sp,
                                                    color = Color.Black,
                                                    fontWeight = FontWeight.Medium
                                                )
                                                Text(
                                                    text = qna.createdAt,
                                                    fontSize = 12.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                /** ✅ 문의하기 버튼 */
                item {
                    Button(
                        onClick = { navController.navigate("qna/${memberInfo?.userid}") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFA000))
                    ) {
                        Text("문의하기", color = Color.White, fontSize = 16.sp)
                    }
                }
            }
        }
    }
}

