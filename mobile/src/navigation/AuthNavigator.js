import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingScreen from "../screens/home/OnboardingScreen";
import LandingScreen from "../screens/home/LandingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import { ROUTES } from "../utils/constants";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#070709" },
            }}
        >
            {/* Onboarding — first-time only, then navigates to Landing */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />

            {/* Landing / Home page — shown to non-logged-in users */}
            <Stack.Screen name="Landing" component={LandingScreen} />

            {/* Auth screens */}
            <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
            <Stack.Screen name={ROUTES.SIGNUP} component={SignupScreen} />
            <Stack.Screen
                name={ROUTES.FORGOT_PASSWORD}
                component={ForgotPasswordScreen}
            />
        </Stack.Navigator>
    );
}
