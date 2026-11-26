package com.preploop.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.outlined.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.components.GradientButton
import com.preploop.app.ui.theme.*

/**
 * Login screen — matches web's dark auth layout.
 * Single-column mobile-first design (web hides left panel on <900px).
 */
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToSignup: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .imePadding(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(80.dp))

            // Logo + Brand
            Text(
                text = "PrepLoop",
                style = PrepLoopTypography.displayLarge.copy(
                    brush = Brush.horizontalGradient(
                        listOf(GradientPinkStart, Accent, PrimaryLight)
                    )
                ),
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Ace your next technical interview",
                style = PrepLoopTypography.bodyLarge,
                color = TextSecondary,
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Form card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(BgSurface.copy(alpha = 0.4f))
                    .border(1.dp, Border.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                    .padding(24.dp),
            ) {
                Text(
                    text = "Welcome back",
                    style = PrepLoopTypography.headlineMedium,
                    color = TextPrimary,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Sign in to continue your preparation",
                    style = PrepLoopTypography.bodyMedium,
                    color = TextMuted,
                )

                Spacer(modifier = Modifier.height(28.dp))

                // Google sign-in button
                OutlinedButton(
                    onClick = { /* TODO: Google One Tap */ },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = TextPrimary,
                    ),
                    border = ButtonDefaults.outlinedButtonBorder(enabled = true),
                ) {
                    Text("Continue with Google", style = PrepLoopTypography.bodyLarge)
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Divider
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Border)
                    Text(
                        text = "  OR  ",
                        style = PrepLoopTypography.labelSmall,
                        color = TextMuted,
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Border)
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Error message
                if (error != null) {
                    Text(
                        text = error!!,
                        style = PrepLoopTypography.bodyMedium,
                        color = Error,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Error.copy(alpha = 0.08f))
                            .padding(12.dp),
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Email field
                Text("Email address", style = PrepLoopTypography.bodyMedium, color = TextSecondary)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("you@example.com", color = TextMuted) },
                    leadingIcon = { Icon(Icons.Filled.Email, null, tint = TextMuted) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Accent,
                        unfocusedBorderColor = Border,
                        focusedContainerColor = BgInput,
                        unfocusedContainerColor = BgInput,
                        cursorColor = Accent,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Password field
                Text("Password", style = PrepLoopTypography.bodyMedium, color = TextSecondary)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = { Text("••••••••", color = TextMuted) },
                    leadingIcon = { Icon(Icons.Filled.Lock, null, tint = TextMuted) },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                                contentDescription = "Toggle password",
                                tint = TextMuted,
                            )
                        }
                    },
                    singleLine = true,
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = { focusManager.clearFocus() }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Accent,
                        unfocusedBorderColor = Border,
                        focusedContainerColor = BgInput,
                        unfocusedContainerColor = BgInput,
                        cursorColor = Accent,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Sign in button
                GradientButton(
                    text = if (isLoading) "Signing in..." else "Sign In",
                    onClick = {
                        // TODO: Call AuthRepository.login(email, password)
                        isLoading = true
                        onLoginSuccess()
                    },
                    enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
                    icon = Icons.Outlined.ArrowForward,
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Sign up link
            Row(horizontalArrangement = Arrangement.Center) {
                Text("Don't have an account?", color = TextMuted, style = PrepLoopTypography.bodyMedium)
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Create account",
                    color = Accent,
                    style = PrepLoopTypography.bodyMedium,
                    modifier = Modifier.clickable(onClick = onNavigateToSignup),
                )
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}
