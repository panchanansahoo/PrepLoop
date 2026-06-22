import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    Dimensions, FlatList, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage } from "../../utils/storage";
import { STORAGE_KEYS } from "../../utils/constants";
import { colors, typography, spacing, borderRadius, shadows } from "../../utils/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
    {
        emoji: "🧩",
        gradient: ["#7c3aed", "#6366f1"],
        title: "Master DSA Patterns",
        subtitle: "15 curated topics with pattern-first learning.\nSolve 500+ problems with thinking frameworks.",
        accent: "#a78bfa",
    },
    {
        emoji: "🤖",
        gradient: ["#0891b2", "#06b6d4"],
        title: "AI Mock Interviews",
        subtitle: "Practice with AI follow-ups and voice analysis.\nGet scored on communication & problem-solving.",
        accent: "#22d3ee",
    },
    {
        emoji: "📊",
        gradient: ["#059669", "#10b981"],
        title: "Track Your Growth",
        subtitle: "Streaks, analytics, and personalized insights.\nStay consistent and land your dream job.",
        accent: "#34d399",
    },
];

function DotIndicator({ index, scrollX }) {
    return (
        <View style={os.dotsRow}>
            {SLIDES.map((_, i) => {
                const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
                const width = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: "clamp" });
                const bg = scrollX.interpolate({
                    inputRange, outputRange: [colors.textMuted, SLIDES[i].accent, colors.textMuted],
                    extrapolate: "clamp",
                });
                return <Animated.View key={i} style={[os.dot, { width, opacity, backgroundColor: bg }]} />;
            })}
        </View>
    );
}

export default function OnboardingScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);

    // Auto-skip if onboarding already completed
    useEffect(() => {
        (async () => {
            try {
                const done = await storage.get(STORAGE_KEYS.ONBOARDING_DONE);
                if (done === "true") navigation.replace("Landing");
            } catch {}
        })();
    }, []);

    const isLast = currentIndex === SLIDES.length - 1;

    async function handleComplete() {
        try { await storage.set(STORAGE_KEYS.ONBOARDING_DONE, "true"); } catch {}
        navigation.replace("Landing");
    }

    function handleNext() {
        if (isLast) { handleComplete(); return; }
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }

    function handleSkip() { handleComplete(); }

    const renderItem = ({ item }) => (
        <View style={[os.slide, { width: SCREEN_WIDTH }]}>
            <View style={os.emojiCircle}>
                <Text style={os.emoji}>{item.emoji}</Text>
            </View>
            <Text style={[os.title, { color: item.accent }]}>{item.title}</Text>
            <Text style={os.subtitle}>{item.subtitle}</Text>
        </View>
    );

    return (
        <View style={os.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            {/* Ambient orbs */}
            <View style={os.orb1} />
            <View style={os.orb2} />

            {/* Skip button */}
            <TouchableOpacity style={[os.skipBtn, { top: Math.max(insets.top + 8, spacing.lg) }]}
                onPress={handleSkip}>
                <Text style={os.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Slide list */}
            <FlatList ref={flatListRef} data={SLIDES} renderItem={renderItem}
                keyExtractor={(_, i) => String(i)} horizontal pagingEnabled
                showsHorizontalScrollIndicator={false} bounces={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false })}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setCurrentIndex(idx);
                }}
                contentContainerStyle={os.flatListContent}
            />

            {/* Bottom controls */}
            <View style={[os.bottomBar, { paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl) }]}>
                <DotIndicator index={currentIndex} scrollX={scrollX} />
                <TouchableOpacity activeOpacity={0.85} onPress={handleNext}>
                    <LinearGradient colors={SLIDES[currentIndex].gradient}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={os.ctaBtn}>
                        <Text style={os.ctaText}>
                            {isLast ? "Get Started 🚀" : "Next →"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const os = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    orb1: { position: "absolute", top: 80, left: -60, width: 200, height: 200,
        borderRadius: 100, backgroundColor: "rgba(139,92,246,0.1)" },
    orb2: { position: "absolute", top: 400, right: -50, width: 180, height: 180,
        borderRadius: 90, backgroundColor: "rgba(6,182,212,0.08)" },
    skipBtn: { position: "absolute", right: spacing.lg, zIndex: 10,
        paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.borderLight,
        backgroundColor: colors.bgCard },
    skipText: { color: colors.textSecondary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
    flatListContent: { alignItems: "center" },
    slide: { justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
    emojiCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.borderLight, alignItems: "center", justifyContent: "center",
        marginBottom: spacing.xl, ...shadows.md },
    emoji: { fontSize: 56 },
    title: { fontSize: 28, fontWeight: typography.fontWeightExtraBold, textAlign: "center",
        marginBottom: spacing.md, letterSpacing: -0.3 },
    subtitle: { color: colors.textSecondary, fontSize: typography.fontSizeMD, textAlign: "center",
        lineHeight: 24, paddingHorizontal: spacing.md },
    bottomBar: { paddingHorizontal: spacing.xl, alignItems: "center" },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
    dot: { height: 6, borderRadius: 3 },
    ctaBtn: { paddingVertical: 16, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.full,
        minWidth: 200, alignItems: "center", ...shadows.glow },
    ctaText: { color: "#fff", fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
});
