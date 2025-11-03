package com.baro.baro_baedal.modules.mypage.view

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.mypage.data.Member
import com.baro.baro_baedal.modules.mypage.data.UpdateMember
import com.baro.baro_baedal.datastore.getTokenHeader
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModifyUserPageView(navController: NavController) {

    val context = LocalContext.current
    val allApi = RetrofitClient.instance.create(AllApi::class.java)
    val coroutineScope = rememberCoroutineScope()
    val member = navController.previousBackStackEntry
        ?.savedStateHandle
        ?.get<Member>("Member")

    if (member == null) {
        Box(
            modifier = Modifier
                .fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text("회원정보를 불러올 수 없습니다.", color = Color.Gray)
        }
        return
    }

    var phone by remember { mutableStateOf(member.phone) }
    var email by remember { mutableStateOf(member.email) }
    var address by remember { mutableStateOf(member.address) }
    var isSaving by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("회원정보 수정", fontWeight = FontWeight.Bold) },
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
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(Color(0xFFF8F8F8))
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            /** 읽기 전용 필드 */
            OutlinedTextField(
                value = member.userid,
                onValueChange = {},
                label = { Text("아이디") },
                readOnly = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = member.name,
                onValueChange = {},
                label = { Text("이름") },
                readOnly = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = member.birth,
                onValueChange = {},
                label = { Text("생년월일") },
                readOnly = true,
                modifier = Modifier.fillMaxWidth()
            )

            /** 수정 가능한 필드 */
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("전화번호") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("이메일") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("주소") },
                modifier = Modifier.fillMaxWidth()
            )

            /** 저장 버튼 */
            Button(
                onClick = {
                    coroutineScope.launch {
                        isSaving = true
                        val tokenHeader = getTokenHeader(context)
                        if (tokenHeader == null) {
                            Toast.makeText(context, "토큰이 없습니다. 다시 로그인해주세요.", Toast.LENGTH_SHORT).show()
                            isSaving = false
                            return@launch
                        }

                        // ✅ UpdateMember 객체 생성
                        val updatedMember = UpdateMember(
                            name = member.name,
                            birth = member.birth,
                            phone = phone,
                            email = email,
                            address = address
                        )

                        // ✅ API 호출
                        allApi.updateMemberInfo(tokenHeader, updatedMember)
                            .enqueue(object : Callback<Void> {
                                override fun onResponse(call: Call<Void>, response: Response<Void>) {
                                    isSaving = false
                                    if (response.isSuccessful) {
                                        Toast.makeText(context, "회원정보가 수정되었습니다.", Toast.LENGTH_SHORT).show()
                                        navController.popBackStack()
                                    } else {
                                        Toast.makeText(context, "수정 실패 (${response.code()})", Toast.LENGTH_SHORT).show()
                                    }
                                }

                                override fun onFailure(call: Call<Void>, t: Throwable) {
                                    isSaving = false
                                    Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                                }
                            })
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                enabled = !isSaving,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1976D2))
            ) {
                Text(if (isSaving) "저장 중..." else "저장하기", color = Color.White, fontSize = 16.sp)
            }
        }
    }

}