import React, { useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
} from "../../utils/theme";

// eslint-disable-next-line no-unused-vars
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Data matching the web home page exactly ──────────────────────

const STATS = [
    { value: "15K+", label: "Active Engineers", emoji: "👨‍💻" },
    { value: "95%", label: "Interview Success Rate", emoji: "🎯" },
    { value: "500+", label: "Practice Problems", emoji: "💻" },
    { value: "50+", label: "Partner Companies", emoji: "🏢" },
];

const FEATURES = [
    {
        emoji: "⚡",
        color: "#a78bfa",
        bg: "rgba(139,92,246,0.12)",
        title: "Intelligent Code Studio",
        desc: "Write production-grade code with an environment that critiques your style, efficiency, and edge cases.",
        tag: "Most Used",
        screen: "DSA",
    },
    {
        emoji: "🗃️",
        color: "#60a5fa",
        bg: "rgba(59,130,246,0.12)",
        title: "SQL Mastery",
        desc: "Master database queries with 100+ real-world SQL problems across joins, subqueries, window functions & more.",
        tag: "100+ Problems",
        screen: "DSA",
    },
    {
        emoji: "🧮",
        color: "#34d399",
        bg: "rgba(16,185,129,0.12)",
        title: "Aptitude Mastery",
        desc: "Practice 200+ problems across quantitative aptitude, logical reasoning & verbal ability.",
        tag: "200+ Problems",
        screen: "DSA",
    },
    {
        emoji: "🗺️",
        color: "#fbbf24",
        bg: "rgba(245,158,11,0.12)",
        title: "DSA Learning Path",
        desc: "Master 15 DSA topics with pattern-first learning, thinking frameworks, and curated problems.",
        tag: "15 Topics",
        screen: "DSA",
    },
    {
        emoji: "🏗️",
        color: "#f472b6",
        bg: "rgba(236,72,153,0.12)",
        title: "Company Prep Hub",
        desc: "Practice real interview questions from top companies — filtered by role, stage & frequency.",
        tag: "50+ Companies",
        screen: "Interview",
    },
    {
        emoji: "🎙️",
        color: "#22d3ee",
        bg: "rgba(6,182,212,0.12)",
        title: "AI Interview Simulator",
        desc: "Simulate real interviews with AI follow-ups. Includes voice practice with pace & filler analysis.",
        tag: "AI Powered",
        screen: "Interview",
    },
];

const HOW_IT_WORKS = [
    {
        step: "01",
        emoji: "🎯",
        title: "Set Your Goal",
        desc: "Tell us your target company, role, and timeline. Our AI builds a personalized roadmap for you.",
        gradient: ["#a78bfa", "#7c3aed"],
        border: "rgba(139,92,246,0.35)",
    },
    {
        step: "02",
        emoji: "🔥",
        title: "Practice Daily",
        desc: "Solve DSA, SQL, aptitude, and mock interviews. Get instant AI feedback on every attempt.",
        gradient: ["#60a5fa", "#3b82f6"],
        border: "rgba(59,130,246,0.35)",
    },
    {
        step: "03",
        emoji: "🏆",
        title: "Land Your Dream Job",
        desc: "Track your readiness score, fix weak areas, and walk into interviews with unstoppable confidence.",
        gradient: ["#34d399", "#10b981"],
        border: "rgba(16,185,129,0.35)",
    },
];

const TESTIMONIALS = [
    { name: 'Rohan S.', role: 'SDE @ Flipkart', text: 'PrepLoop\'s AI mock interviews felt like real FAANG rounds. Got my offer in 6 weeks!' },
    { name: 'Priya M.', role: 'Backend @ Google', text: 'The DSA patterns approach changed everything for me. Highly recommend to every fresher.' },
    { name: 'Arjun K.', role: 'SWE Intern @ Microsoft', text: 'Daily challenges kept me consistent. Went from 0 to Intern in 2 months.' },
    { name: 'Aditi V.', role: 'Frontend @ Amazon', text: 'The React and system design rounds were exactly what I needed. Nailed the final loop!' },
    { name: 'Vikram D.', role: 'Data Engineer @ Swiggy', text: 'SQL Mastery section is pure gold. It covers everything from basic joins to complex window functions.' },
    { name: 'Kavya T.', role: 'SDE-2 @ Uber', text: 'I struggled with dynamic programming until I used PrepLoop. The visual explanations just click.' },
    { name: 'Pooja M.', role: 'ML Engineer @ Microsoft', text: 'The machine learning system design questions are so niche, but PrepLoop had them. Saved my final round.' },
    { name: 'Siddharth R.', role: 'iOS @ Cred', text: 'Hard to find good iOS interview prep. PrepLoop\'s mobile engineering tracks had exactly the right deep dives.' },
    { name: 'Neha K.', role: 'SDET', text: 'Wanted to move from manual QA to SDET. The automation testing practice helped me secure a 60% hike.' },
    { name: 'Arjun V.', role: 'SDE-1 @ Ola', text: 'Behavioral interview modules were a lifesaver. The AI analyzed my tone and taught me the STAR method perfectly.' }
];

const liveActivities = [
    { text: 'Priya completed a Google mock interview', time: '2m ago', emoji: '🎙️' },
    { text: 'Rahul solved "Merge K Sorted Lists"', time: '5m ago', emoji: '💻' },
    { text: 'Ananya achieved SQL Expert badge', time: '8m ago', emoji: '🏆' },
    { text: 'Vikram scored 95/100 on System Design', time: '11m ago', emoji: '🗺️' },
    { text: 'Neha unlocked the DSA Master achievement', time: '15m ago', emoji: '⭐' },
    { text: 'Arjun completed 30-day coding streak 🔥', time: '18m ago', emoji: '🔥' },
];

const pricingPlans = [
    {
        name: 'Starter',
        price: 'Free',
        pricePer: '',
        priceSub: 'Free forever',
        features: [
            '5 AI mock interviews per month',
            'Basic code feedback',
            'DSA patterns sheet access',
            'Basic progress tracking'
        ],
        btnText: 'Get Started',
        btnClass: 'outline',
        popular: false,
    },
    {
        name: 'Pro',
        price: '₹99',
        pricePer: '/mo',
        priceSub: 'Billed monthly · Save 20% annually',
        features: [
            'Unlimited AI mock interviews',
            'Advanced code feedback & optimization',
            'Full DSA patterns with solutions',
            'Priority support',
            'Progress analytics dashboard'
        ],
        btnText: 'Get Pro',
        btnClass: 'primary',
        popular: true,
    },
    {
        name: 'Premium',
        price: '₹299',
        pricePer: '/mo',
        priceSub: 'Billed monthly · Save 20% annually',
        features: [
            'Everything in Pro, plus:',
            'Extended interview time limits',
            'Behavioral interview coaching',
            'Custom study plan generation',
            'Early access to new features',
            'Priority support & mentorship'
        ],
        btnText: 'Get Premium',
        btnClass: 'primary',
        popular: false,
    }
];

const faqs = [
    { q: "Can I upgrade or downgrade my plan?", a: "Yes. You can upgrade anytime for instant access. Downgrades take effect at the end of your billing cycle." },
    { q: "Is my payment information secure?", a: "Yes. We use industry-standard encryption and never store your card details on our servers." },
    { q: "What's your refund policy?", a: "We offer a 7-day money-back guarantee for all paid subscription plans." },
    { q: "Do I need a credit card to sign up?", a: "No, the Starter plan is completely free and doesn't require a credit card." },
    { q: "How realistic are the AI mock interviews?", a: "Very. Our AI is trained on actual interview transcripts from FAANG to mimic real interviewer behavior." },
];

// ── Sub-components ────────────────────────────────────────────────

function OrbBackground() {
    return (
        <>
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <View style={styles.orb3} />
        </>
    );
}

function SectionLabel({ text, emoji }) {
    return (
        <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelEmoji}>{emoji}</Text>
            <Text style={styles.sectionLabelText}>{text}</Text>
        </View>
    );
}

function StatItem({ stat }) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
    );
}

function FeatureCard({ feature }) {
    return (
        <View
            style={[styles.featureCard, { borderColor: feature.color + "33" }]}
        >
            <View
                style={[styles.featureIconBox, { backgroundColor: feature.bg }]}
            >
                <Text style={styles.featureIcon}>{feature.emoji}</Text>
            </View>
            <View
                style={[
                    styles.featureTag,
                    {
                        backgroundColor: feature.color + "22",
                        borderColor: feature.color + "44",
                    },
                ]}
            >
                <Text style={[styles.featureTagText, { color: feature.color }]}>
                    {feature.tag}
                </Text>
            </View>
            <Text style={[styles.featureTitle, { color: feature.color }]}>
                {feature.title}
            </Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
        </View>
    );
}

function StepCard({ step }) {
    return (
        <View style={[styles.stepCard, { borderColor: step.border }]}>
            <LinearGradient
                colors={step.gradient}
                style={styles.stepBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.stepBadgeText}>{step.step}</Text>
            </LinearGradient>
            <View style={styles.stepEmojiBox}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>
            <LinearGradient
                colors={step.gradient}
                style={styles.stepAccentLine}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />
        </View>
    );
}

function PricingCard({ plan, navigation }) {
    return (
        <View style={[styles.pricingCard, plan.popular && styles.pricingCardPopular]}>
            {plan.popular && (
                <LinearGradient
                    colors={["#8b5cf6", "#6d28d9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.popularBadge}
                >
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </LinearGradient>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPricePer}>{plan.pricePer}</Text>
            </View>
            <Text style={styles.planSub}>{plan.priceSub}</Text>
            
            <View style={styles.planFeatures}>
                {plan.features.map((f, i) => (
                    <View key={i} style={styles.planFeatureRow}>
                        <Text style={styles.planFeatureCheck}>✓</Text>
                        <Text style={styles.planFeatureText}>{f}</Text>
                    </View>
                ))}
            </View>
            
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate("Signup")}
                style={plan.btnClass === 'primary' ? styles.pricingBtnPrimary : styles.pricingBtnOutline}
            >
                {plan.btnClass === 'primary' ? (
                    <LinearGradient
                        colors={["#8b5cf6", "#6d28d9"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.pricingBtnGradient}
                    >
                        <Text style={styles.pricingBtnTextPrimary}>{plan.btnText}</Text>
                    </LinearGradient>
                ) : (
                    <Text style={styles.pricingBtnTextOutline}>{plan.btnText}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

function FAQItem({ faq }) {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.faqCard}
            onPress={() => setIsOpen(!isOpen)}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={styles.faqIcon}>{isOpen ? "−" : "+"}</Text>
            </View>
            {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
        </TouchableOpacity>
    );
}

// ── Main Screen ───────────────────────────────────────────────────

export default function LandingScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <OrbBackground />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Top Nav ── */}
                <View
                    style={[
                        styles.topNav,
                        {
                            paddingTop: Math.max(
                                insets.top + spacing.xs,
                                spacing.lg,
                            ),
                        },
                    ]}
                >
                    <View style={styles.logoRow}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoLetter}>P</Text>
                        </View>
                        <Text style={styles.brandName}>PrepLoop</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.navSignInBtn}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.navSignInText}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                {/* ── HERO ─────────────────────────────────────────── */}
                <View style={styles.heroSection}>
                    {/* Live activity pill */}
                    <View style={styles.activityPill}>
                        <View style={styles.activityDot} />
                        <Text style={styles.activityText}>
                            👨‍💻 15,000+ engineers are prep-looping right now
                        </Text>
                    </View>

                    <Text style={styles.heroHeadline}>
                        Accelerate Your{"\n"}
                        <Text style={styles.heroHeadlineGradient}>
                            Career Growth
                        </Text>
                    </Text>

                    <Text style={styles.heroSubtitle}>
                        Master technical interviews with AI-driven mock sessions
                        and personalized feedback. From DSA to System Design —
                        all in one place.
                    </Text>

                    {/* CTA Buttons */}
                    <View style={styles.heroButtons}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("Signup")}
                            style={styles.heroPrimaryBtn}
                        >
                            <LinearGradient
                                colors={["#8b5cf6", "#6d28d9"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.heroPrimaryGradient}
                            >
                                <Text style={styles.heroPrimaryText}>
                                    🚀 Start for Free
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate("Login")}
                            style={styles.heroOutlineBtn}
                        >
                            <Text style={styles.heroOutlineText}>
                                Sign In →
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Launch badges as text */}
                    <View style={styles.badgesRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                🏆 Product Hunt Featured
                            </Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                🚀 Fazier Launch
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── LIVE ACTIVITIES TICKER ───────────────────────── */}
                <View style={styles.tickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerScroll}>
                        {liveActivities.map((act, i) => (
                            <View key={i} style={styles.tickerItem}>
                                <Text style={styles.tickerEmoji}>{act.emoji}</Text>
                                <Text style={styles.tickerText}>{act.text}</Text>
                                <Text style={styles.tickerTime}>{act.time}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* ── STATS BAR ────────────────────────────────────── */}
                <View style={styles.statsBar}>
                    {STATS.map((s, i) => (
                        <React.Fragment key={s.label}>
                            <StatItem stat={s} />
                            {i < STATS.length - 1 && (
                                <View style={styles.statDivider} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* ── FEATURES ─────────────────────────────────────── */}
                <View style={styles.section}>
                    <SectionLabel text="Platform Features" emoji="⚡" />
                    <Text style={styles.sectionTitle}>
                        Everything you need to{"\n"}
                        <Text style={styles.sectionTitleAccent}>
                            Crack the Interview
                        </Text>
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        A complete, AI-powered ecosystem designed to fast-track
                        your engineering career.
                    </Text>

                    <View style={styles.featuresGrid}>
                        {FEATURES.map((f, i) => (
                            <FeatureCard key={i} feature={f} />
                        ))}
                    </View>
                </View>

                {/* ── HOW IT WORKS ─────────────────────────────────── */}
                <View style={styles.section}>
                    <SectionLabel text="How It Works" emoji="🚀" />
                    <Text style={styles.sectionTitle}>
                        Your Path to{"\n"}
                        <Text style={styles.sectionTitleAccent}>
                            Interview Success
                        </Text>
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        A proven 3-step system that takes you from zero to
                        interview-ready in weeks, not months.
                    </Text>

                    <View style={styles.stepsCol}>
                        {HOW_IT_WORKS.map((step, i) => (
                            <StepCard key={i} step={step} />
                        ))}
                    </View>
                </View>

                {/* ── TESTIMONIALS ─────────────────────────────────── */}
                <View style={styles.section}>
                    <SectionLabel text="Success Stories" emoji="⭐" />
                    <Text style={styles.sectionTitle}>Loved by Engineers</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.testimonialsList}
                        snapToInterval={SCREEN_WIDTH * 0.8 + spacing.md}
                        decelerationRate="fast"
                    >
                        {TESTIMONIALS.map((t, i) => (
                            <View key={i} style={[styles.testimonialCard, { width: SCREEN_WIDTH * 0.8 }]}>
                                <Text style={styles.testimonialQuote}>❝</Text>
                                <Text style={styles.testimonialText}>
                                    {t.text}
                                </Text>
                                <View style={styles.testimonialAuthorRow}>
                                    <View style={styles.testimonialAvatar}>
                                        <Text style={styles.testimonialAvatarText}>
                                            {t.name[0]}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.testimonialName}>
                                            {t.name}
                                        </Text>
                                        <Text style={styles.testimonialRole}>
                                            {t.role}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* ── PRICING ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <SectionLabel text="Pricing" emoji="💎" />
                    <Text style={styles.sectionTitle}>Simple, transparent pricing</Text>
                    <Text style={styles.sectionSubtitle}>
                        Invest in your career. Get the offer you deserve.
                    </Text>
                    
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.pricingScroll}
                        snapToInterval={SCREEN_WIDTH * 0.85 + spacing.md}
                        decelerationRate="fast"
                    >
                        {pricingPlans.map((plan, i) => (
                            <PricingCard key={i} plan={plan} navigation={navigation} />
                        ))}
                    </ScrollView>
                </View>

                {/* ── FAQS ─────────────────────────────────────────── */}
                <View style={styles.section}>
                    <SectionLabel text="FAQ" emoji="❓" />
                    <Text style={styles.sectionTitle}>Common Questions</Text>
                    
                    <View style={styles.faqList}>
                        {faqs.map((faq, i) => (
                            <FAQItem key={i} faq={faq} />
                        ))}
                    </View>
                </View>

                {/* ── FINAL CTA ────────────────────────────────────── */}
                <View style={styles.ctaSection}>
                    <LinearGradient
                        colors={[
                            "rgba(139,92,246,0.15)",
                            "rgba(59,130,246,0.08)",
                        ]}
                        style={styles.ctaBanner}
                    >
                        <Text style={styles.ctaTitle}>
                            Ready to Land Your Dream Job?
                        </Text>
                        <Text style={styles.ctaSubtitle}>
                            Join 15,000+ engineers who prep smarter with
                            PrepLoop.
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("Signup")}
                        >
                            <LinearGradient
                                colors={["#8b5cf6", "#6d28d9"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaBtn}
                            >
                                <Text style={styles.ctaBtnText}>
                                    Get Started — It's Free
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={styles.ctaNote}>
                            No credit card required · Cancel anytime
                        </Text>
                    </LinearGradient>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © 2024 PrepLoop. All rights reserved.
                    </Text>
                    <Text style={styles.footerSub}>
                        Built for engineers, by engineers 🛠️
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    // Orbs — simulated gradient blobs matching web
    orb1: {
        position: "absolute",
        top: 60,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "rgba(139,92,246,0.13)",
        transform: [{ scaleX: 1.4 }],
    },
    orb2: {
        position: "absolute",
        top: 300,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(59,130,246,0.10)",
    },
    orb3: {
        position: "absolute",
        top: 700,
        left: "30%",
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(236,72,153,0.07)",
    },

    scrollContent: { paddingBottom: spacing.xxl },

    // Top Nav
    topNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        zIndex: 10,
    },
    logoRow: { flexDirection: "row", alignItems: "center" },
    logoCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#8b5cf6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    logoLetter: {
        color: "#fff",
        fontSize: 18,
        fontWeight: typography.fontWeightExtraBold,
    },
    brandName: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightExtraBold,
        letterSpacing: 0.5,
    },
    navSignInBtn: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.bgCard,
    },
    navSignInText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },

    // Hero
    heroSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        alignItems: "center",
        zIndex: 10,
    },
    activityPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xl,
    },
    activityDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#34d399",
        marginRight: spacing.sm,
    },
    activityText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightMedium,
    },
    heroHeadline: {
        fontSize: 36,
        fontWeight: typography.fontWeightExtraBold,
        color: colors.textPrimary,
        textAlign: "center",
        lineHeight: 44,
        letterSpacing: -0.5,
        marginBottom: spacing.md,
    },
    heroHeadlineGradient: {
        color: "#a78bfa",
    },
    heroSubtitle: {
        fontSize: typography.fontSizeMD,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.sm,
    },
    heroButtons: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.lg,
        alignItems: "center",
    },
    heroPrimaryBtn: {
        borderRadius: borderRadius.full,
        overflow: "hidden",
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    heroPrimaryGradient: {
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
    },
    heroPrimaryText: {
        color: "#fff",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    heroOutlineBtn: {
        paddingVertical: 13,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
    },
    heroOutlineText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    badgesRow: {
        flexDirection: "row",
        gap: spacing.sm,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    badge: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 4,
        paddingHorizontal: spacing.sm,
    },
    badgeText: { color: colors.textMuted, fontSize: typography.fontSizeXS },

    // Stats
    statsBar: {
        flexDirection: "row",
        marginHorizontal: spacing.lg,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.md,
        ...shadows.md,
    },
    statItem: { flex: 1, alignItems: "center" },
    statEmoji: { fontSize: 20, marginBottom: 4 },
    statValue: {
        // web: zinc-200 for stat numbers
        color: "#e4e4e7",
        fontSize: 18,
        fontWeight: typography.fontWeightExtraBold,
        lineHeight: 22,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 10,
        textAlign: "center",
        lineHeight: 14,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: "60%",
        alignSelf: "center",
        backgroundColor: colors.border,
    },

    // Section
    section: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    sectionLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.full,
        alignSelf: "flex-start",
        paddingVertical: 4,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    sectionLabelEmoji: { fontSize: 12 },
    sectionLabelText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: 26,
        fontWeight: typography.fontWeightExtraBold,
        lineHeight: 32,
        marginBottom: spacing.sm,
        letterSpacing: -0.3,
    },
    sectionTitleAccent: { color: "#a78bfa" },
    sectionSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
        marginBottom: spacing.xl,
    },

    // Feature Cards
    featuresGrid: { gap: spacing.md },
    featureCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        marginBottom: 0,
        ...shadows.sm,
    },
    featureIconBox: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    featureIcon: { fontSize: 24 },
    featureTag: {
        alignSelf: "flex-start",
        borderRadius: borderRadius.full,
        borderWidth: 1,
        paddingVertical: 2,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.sm,
    },
    featureTagText: {
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
    },
    featureTitle: {
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    featureDesc: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
    },

    // Steps
    stepsCol: { gap: spacing.md },
    stepCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        position: "relative",
        overflow: "hidden",
        ...shadows.sm,
    },
    stepBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    stepBadgeText: {
        color: "#fff",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightExtraBold,
    },
    stepEmojiBox: { marginBottom: spacing.sm },
    stepEmoji: { fontSize: 28 },
    stepTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    stepDesc: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    stepAccentLine: {
        height: 3,
        borderRadius: 2,
        width: "40%",
    },

    // Testimonials
    testimonialsList: { gap: spacing.md },
    testimonialCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    testimonialQuote: {
        fontSize: 32,
        color: "#8b5cf6",
        lineHeight: 32,
        marginBottom: spacing.xs,
    },
    testimonialText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
        fontStyle: "italic",
        marginBottom: spacing.md,
    },
    testimonialAuthorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    testimonialAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#8b5cf620",
        borderWidth: 1,
        borderColor: "#8b5cf644",
        alignItems: "center",
        justifyContent: "center",
    },
    testimonialAvatarText: {
        color: "#a78bfa",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    testimonialName: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
    testimonialRole: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
    },

    // Final CTA
    ctaSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
    ctaBanner: {
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: "rgba(139,92,246,0.3)",
        alignItems: "center",
    },
    ctaTitle: {
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: typography.fontWeightExtraBold,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    ctaSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        textAlign: "center",
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    ctaBtn: {
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        marginBottom: spacing.sm,
    },
    ctaBtnText: {
        color: "#fff",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    ctaNote: { color: colors.textMuted, fontSize: typography.fontSizeXS },

    // Ticker
    tickerContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.bgCard,
        paddingVertical: spacing.sm,
    },
    tickerScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
    tickerItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.full,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
    },
    tickerEmoji: { fontSize: 14, marginRight: 6 },
    tickerText: { color: colors.textSecondary, fontSize: 13, marginRight: 8 },
    tickerTime: { color: colors.textMuted, fontSize: 11 },

    // Pricing
    pricingScroll: { gap: spacing.md, paddingBottom: spacing.lg },
    pricingCard: {
        width: SCREEN_WIDTH * 0.85,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        position: "relative",
    },
    pricingCardPopular: {
        borderColor: "#8b5cf6",
        borderWidth: 2,
    },
    popularBadge: {
        position: "absolute",
        top: -12,
        alignSelf: "center",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: borderRadius.full,
    },
    popularBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: typography.fontWeightBold,
        letterSpacing: 1,
    },
    planName: { color: colors.textPrimary, fontSize: 20, fontWeight: typography.fontWeightBold, marginBottom: spacing.xs },
    priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
    planPrice: { color: colors.textPrimary, fontSize: 36, fontWeight: typography.fontWeightExtraBold },
    planPricePer: { color: colors.textMuted, fontSize: 14, marginLeft: 4 },
    planSub: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
    planFeatures: { marginBottom: spacing.xl, gap: spacing.sm },
    planFeatureRow: { flexDirection: "row", alignItems: "flex-start" },
    planFeatureCheck: { color: "#34d399", fontSize: 14, marginRight: 8, marginTop: 2 },
    planFeatureText: { color: colors.textSecondary, fontSize: 14, flex: 1, lineHeight: 20 },
    pricingBtnOutline: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.full,
        paddingVertical: 14,
        alignItems: "center",
    },
    pricingBtnPrimary: {
        borderRadius: borderRadius.full,
        overflow: "hidden",
    },
    pricingBtnGradient: {
        paddingVertical: 14,
        alignItems: "center",
    },
    pricingBtnTextOutline: { color: colors.textPrimary, fontSize: 16, fontWeight: typography.fontWeightSemiBold },
    pricingBtnTextPrimary: { color: "#fff", fontSize: 16, fontWeight: typography.fontWeightBold },

    // FAQ
    faqList: { gap: spacing.sm },
    faqCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    faqQuestion: { color: colors.textPrimary, fontSize: 15, fontWeight: typography.fontWeightSemiBold, flex: 1, paddingRight: spacing.sm },
    faqIcon: { color: colors.textMuted, fontSize: 20 },
    faqAnswer: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: spacing.sm },

    // Footer
    footer: { alignItems: "center", padding: spacing.xl },
    footerText: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    footerSub: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginTop: 4,
    },
});
