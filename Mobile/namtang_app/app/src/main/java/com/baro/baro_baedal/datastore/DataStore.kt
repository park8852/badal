package com.baro.baro_baedal.datastore
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

// ✅ Context에 dataStore 확장 프로퍼티 추가
val Context.dataStore by preferencesDataStore(name = "app_prefs")

//val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

// JWT 저장
suspend fun Context.saveJwt(token: String) {
    val jwtKey = stringPreferencesKey("jwt_token")
    dataStore.edit { prefs ->
        prefs[jwtKey] = token
    }
}

// JWT 조회
fun Context.getJwt(): Flow<String?> {
    val jwtKey = stringPreferencesKey("jwt_token")
    return dataStore.data.map { prefs ->
        prefs[jwtKey]
    }
}

// JWT 삭제
suspend fun Context.deleteJwt() {
    val jwtKey = stringPreferencesKey("jwt_token")
    dataStore.edit { prefs ->
        prefs.remove(jwtKey)
    }
}

suspend fun getTokenHeader(context: Context): String? {
    val token = context.getJwt().first()
    return if (!token.isNullOrBlank()) "Bearer $token" else null
}

//LaunchedEffect(Unit) { // Composable이 처음 나타날 때만 실행
//    context.deleteJwt()
//    val beforeToken = context.getJwt().first()
//    println("Before: $beforeToken")
//
//    context.saveJwt("12345")
//
//    val afterToken = context.getJwt().first()
//    println("After: $afterToken")
//}

