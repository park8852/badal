package com.baro.baro_baedal.modules.register.view

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
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.compose.runtime.*
import com.baro.baro_baedal.modules.AllApi
import com.baro.baro_baedal.modules.RetrofitClient
import com.baro.baro_baedal.modules.register.data.MemberReg
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import com.google.gson.Gson
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterPageView(navController: NavController) {

    val context = LocalContext.current

    var userid by remember { mutableStateOf("") }
    var userpw by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var birth by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("") }

    val createdAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        .format(Date())

    val allApi = RetrofitClient.instance.create(AllApi::class.java)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.LightGray),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text="회원가입 페이지입니다.",
                color = Color.Black,
                fontSize = 20.sp
            )
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(value=userid, onValueChange = {userid=it}, label= { Text("아이디") })
            OutlinedTextField(value=userpw, onValueChange = {userpw=it}, label= { Text("비밀번호") }, visualTransformation = PasswordVisualTransformation())
            OutlinedTextField(value=name, onValueChange = {name=it}, label= { Text("이름") })
            OutlinedTextField(value=birth, onValueChange = {birth=it}, label= { Text("생년월일(YYYY-MM-DD)") })
            OutlinedTextField(value=phone, onValueChange = {phone=it}, label= { Text("핸드폰번호") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
            OutlinedTextField(value=email, onValueChange = {email=it}, label= { Text("이메일") })
            OutlinedTextField(value=address, onValueChange = {address=it}, label= { Text("주소") })

            Spacer(modifier = Modifier.height(20.dp))

            Button(onClick = {
                val memberReg = MemberReg(userid, userpw, name, birth, phone, email, address, role="USER", created_at=createdAt)
                print(memberReg)
                Log.d("REGISTER_DEBUG", "member = $memberReg") // ✅ Logcat에 찍힘
                val json = Gson().toJson(memberReg)
                println(json)

                allApi.registerMember(memberReg).enqueue(object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {
                        if(response.isSuccessful) {
                            Toast.makeText(context, "회원가입 성공!", Toast.LENGTH_SHORT).show()
                            navController.popBackStack()
                        }
                        else {
                            Toast.makeText(context, "회원가입 실패 (${response.code()})", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: Call<Void>, t: Throwable) {
                        Toast.makeText(context, "네트워크 오류: ${t.message}", Toast.LENGTH_SHORT).show()
                    }
                })
            }) {
                Text("회원가입")
            }

            Spacer(modifier = Modifier.height(10.dp))

            TextButton(onClick = {navController.popBackStack()}) {
                Text("뒤로가기")
            }

        }
    }
}

