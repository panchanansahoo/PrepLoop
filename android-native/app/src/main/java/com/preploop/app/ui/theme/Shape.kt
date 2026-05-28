package com.preploop.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val PrepLoopShapes = Shapes(
    small = RoundedCornerShape(6.dp),    // tags, badges
    medium = RoundedCornerShape(12.dp),  // inputs, small cards
    large = RoundedCornerShape(20.dp),   // cards, dialogs
    extraLarge = RoundedCornerShape(24.dp), // bottom sheets
)
