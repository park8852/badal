package com.baro.baro_baedal.modules.login.view

import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavController
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.baro.baro_baedal.datastore.saveJwt
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.login.data.LoginRequest
import com.baro.baro_baedal.modules.login.data.LoginResponse
import com.baro.baro_baedal.modules.RetrofitClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch



@Composable
fun LoginPageView(navController: NavController) {
    val context = LocalContext.current

    var userid by remember { mutableStateOf("") }
    var userpw by remember { mutableStateOf("") }

    var allApi = RetrofitClient.instance.create(AllApi::class.java)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("로그인 페이지", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(value = userid, onValueChange = {userid = it}, label = { Text("아이디") })
            OutlinedTextField(
                value = userpw,
                onValueChange = {userpw = it},
                label = { Text("비밀번호") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                visualTransformation = PasswordVisualTransformation()
            )

            Spacer(modifier = Modifier.height(20.dp))

            Button(onClick = {
                if (userid.isBlank() || userpw.isBlank()) {
                    Toast.makeText(context, "아이디/비밀번호를 입력하세요.", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                val request = LoginRequest(userid, userpw)
                Log.d("Login DEBUG", "Login Request: $request")

                allApi.loginMember(request).enqueue(object : Callback<LoginResponse> {
                    override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                        if (response.isSuccessful) {
                            val loginResponse = response.body()

                            // ✅ 서버에서 token이 없을 수도 있으므로 null 체크 필수
                            val token = loginResponse?.data?.token

                            if (!token.isNullOrEmpty()) {
                                // 토큰 정상 → 로그인 성공 처리
                                CoroutineScope(Dispatchers.IO).launch {
                                    context.saveJwt(token)
                                    delay(300)
                                }

                                CoroutineScope(Dispatchers.Main).launch {
                                    Toast.makeText(context, loginResponse.message ?: "로그인 성공", Toast.LENGTH_SHORT).show()
                                    navController.navigate("home") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            } else {
                                // 🔹 토큰이 null이면 로그인 실패로 처리
                                val failMsg = loginResponse?.message ?: "로그인 실패: 아이디 또는 비밀번호를 확인하세요."
                                Log.e("LOGIN_DEBUG", "Token null: $failMsg")
                                Toast.makeText(context, failMsg, Toast.LENGTH_SHORT).show()
                            }
                        }
                        else {
                            Toast.makeText(context, "로그인 실패 ($response.code())", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                        Log.e("LOGIN DEBIG", "Error: ${t.message}")
                        Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                    }
                })
            }) {
                Text("로그인")
            }

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(onClick = { navController.navigate("register")}) {
                Text("회원가입")
            }
        }
    }

}