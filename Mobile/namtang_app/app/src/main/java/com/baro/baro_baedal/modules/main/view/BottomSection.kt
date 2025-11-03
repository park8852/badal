package com.baro.baro_baedal.modules.main.view

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.graphicsLayer

@Composable
fun BottomSection(navController: NavController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val items = listOf(
        "home" to "홈",
        "orderlist" to "주문",
        "mypage" to "마이페이지"
    )

    Surface(
        tonalElevation = 6.dp,
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            items.forEach { (route, label) ->
                val selected = currentRoute == route

                // 색상/크기 애니메이션
                val textColor by animateColorAsState(
                    targetValue = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    animationSpec = tween(200)
                )
                val scale by animateFloatAsState(
                    targetValue = if (selected) 1.1f else 1f,
                    animationSpec = tween(200)
                )
                val underlineColor by animateColorAsState(
                    targetValue = if (selected) MaterialTheme.colorScheme.primary else Color.Transparent,
                    animationSpec = tween(250)
                )

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clickable {
                            if (currentRoute != route) {
                                navController.navigate(route) {
                                    launchSingleTop = true
                                    restoreState = true
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                }
                            }
                        }
                        .padding(vertical = 8.dp)
                ) {
                    Text(
                        text = label,
                        color = textColor,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                        fontSize = if (selected) 17.sp else 15.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.graphicsLayer(scaleX = scale, scaleY = scale)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .width(if (selected) 30.dp else 0.dp)
                            .height(3.dp)
                            .background(underlineColor, shape = RoundedCornerShape(50))
                    )
                }
            }
        }
    }
}