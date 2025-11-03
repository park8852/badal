package com.baro.baro_baedal

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.baro.baro_baedal.modules.login.view.LoginPageView
import com.baro.baro_baedal.modules.order.view.OrderListPageView
import com.baro.baro_baedal.modules.market.view.OrderPageView
import com.baro.baro_baedal.modules.mypage.data.NoticeInfo
import com.baro.baro_baedal.modules.mypage.data.NoticeInfoDetail
import com.baro.baro_baedal.modules.mypage.view.ModifyUserPageView
import com.baro.baro_baedal.modules.mypage.view.MypageView
import com.baro.baro_baedal.modules.mypage.view.NoticeDetailPageView
import com.baro.baro_baedal.modules.mypage.view.PointChargePageView
import com.baro.baro_baedal.modules.mypage.view.QnaDetailPageView
import com.baro.baro_baedal.modules.mypage.view.QnaPageView
import com.baro.baro_baedal.modules.order.data.OrderList
import com.baro.baro_baedal.modules.order.view.OrderDetailPageView
import com.baro.baro_baedal.modules.register.view.RegisterPageView
import com.barobaedal.barobaedal.modules.main.view.MainView
import com.barobaedal.barobaedal.modules.market.MarketView
import com.barobaedal.barobaedal.modules.market.view.SingleMenuView
import kotlinx.coroutines.flow.callbackFlow

@Composable
fun AppNavigator() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {
        composable("home") { MainView(navController) }
        //composable("market") { MarketView(navController) }
        composable("mypage") { MypageView(navController) }
        composable("register") { RegisterPageView(navController) }
        composable("login") { LoginPageView(navController) }
        composable("market/{storeId}/{storeName}/{thumbnail}") { backStackEntry ->
            val storeId = backStackEntry.arguments?.getString("storeId")?.toIntOrNull() ?: 0
            val storeName = backStackEntry.arguments?.getString("storeName") ?: "가게이름없음"
            val thumbnail = backStackEntry.arguments?.getString("thumbnail") ?: ""
            MarketView(navController, storeId, storeName, thumbnail)
        }
        composable("menu/{menuId}") { backStackEntry ->
            val menuId = backStackEntry.arguments?.getString("menuId")?.toInt() ?: 0
            SingleMenuView(navController, menuId)
        }
        composable("order/{menuId}/{quantity}") { backStackEntry ->
            val menuId = backStackEntry.arguments?.getString("menuId")?.toInt() ?: 0
            val quantity = backStackEntry.arguments?.getString("quantity")?.toInt() ?: 1
            OrderPageView(navController, menuId, quantity)
        }
        composable("profile_edit") { ModifyUserPageView(navController) }
        composable("orderlist") { OrderListPageView(navController) }
        composable("qna/{userId}") { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: ""
            QnaPageView(navController, userId) }
        composable("order_detail") {
            val order = navController.previousBackStackEntry?.savedStateHandle
                ?.get<OrderList>("OrderDetail")
            order?.let {
                OrderDetailPageView(navController, it)
            } ?: Text("주문 정보를 불러올 수 없습니다.")
        }
        composable("point_charge/{point}") { backStackEntry ->
            val point = backStackEntry.arguments?.getString("point")?.toIntOrNull() ?: 0
            PointChargePageView(navController, point) }
        composable("notice_detail") { backStackEntry ->
            val notice = navController.previousBackStackEntry?.savedStateHandle?.
                    get<NoticeInfoDetail>("noticeDetail")
            notice?.let {
                NoticeDetailPageView(navController, it)
            }
        }
        composable("qna_detail") {
            val qna = navController.previousBackStackEntry
                ?.savedStateHandle
                ?.get<NoticeInfoDetail>("QnaDetail")

            qna?.let {
                QnaDetailPageView(navController, it)
            } ?: Text("문의내역 정보를 불러올 수 없습니다.")
        }

    }
}