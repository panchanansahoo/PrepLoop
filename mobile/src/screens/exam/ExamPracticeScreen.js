import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Alert,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { getFullExamQuestions } from "../../data/examData";

export default function ExamPracticeScreen({ route, navigation }) {
    const { title, examId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [examData, setExamData] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(120 * 60);

    useEffect(() => {
        const loadTimeout = setTimeout(() => {
            const data = getFullExamQuestions(examId);
            if (data && data.sections && data.sections.length > 0) {
                const formattedSections = data.sections.map((s) => ({
                    id: s.id,
                    title: s.title,
                }));

                const formattedQs = data.sections.flatMap((s) =>
                    (s.questions || []).map((q) => {
                        const correctOpt = q.options?.find(
                            (opt) => opt.label === q.correctAnswer,
                        );
                        return {
                            ...q,
                            sectionId: s.id,
                            options: q.options
                                ? q.options.map((o) => o.value)
                                : [],
                            correctAnswer: correctOpt
                                ? correctOpt.value
                                : q.correctAnswer,
                        };
                    }),
                );

                setExamData({
                    exam: data.exam,
                    sections: formattedSections,
                    questions: formattedQs,
                });
                setActiveSection(formattedSections[0]?.id);
                if (data.exam?.totalTime) {
                    setTimeLeft(data.exam.totalTime * 60);
                }
            }
            setLoading(false);
        }, 500);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(loadTimeout);
            clearInterval(timer);
        };
    }, [examId]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    if (loading || !examData) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    Preparing Exam Environment...
                </Text>
            </SafeAreaView>
        );
    }

    const sectionQuestions = examData.questions.filter(
        (q) => q.sectionId === activeSection,
    );
    const currentQuestion = sectionQuestions[currentIndex];

    if (!currentQuestion) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading question...</Text>
            </SafeAreaView>
        );
    }

    const handleAnswer = (option) => {
        if (!currentQuestion) return;
        setAnswers({
            ...answers,
            [currentQuestion.id]: option,
        });
    };

    const handleNext = () => {
        if (currentIndex < sectionQuestions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            // Find next section
            const currentSecIdx = examData.sections.findIndex(
                (s) => s.id === activeSection,
            );
            if (currentSecIdx < examData.sections.length - 1) {
                setActiveSection(examData.sections[currentSecIdx + 1].id);
                setCurrentIndex(0);
            }
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        } else {
            // Find previous section
            const currentSecIdx = examData.sections.findIndex(
                (s) => s.id === activeSection,
            );
            if (currentSecIdx > 0) {
                const prevSec = examData.sections[currentSecIdx - 1];
                setActiveSection(prevSec.id);
                // Set to last question of previous section
                const prevSecQs = examData.questions.filter(
                    (q) => q.sectionId === prevSec.id,
                );
                setCurrentIndex(prevSecQs.length - 1);
            }
        }
    };

    const handleSubmit = () => {
        const correctCount = Object.entries(answers).filter(([qId, ans]) => {
            const q = examData?.questions?.find((q) => q.id === qId);
            return q && ans === q.correctAnswer;
        }).length;
        const totalAnswered = Object.keys(answers).length;
        const totalQuestions = examData?.questions?.length ?? 0;

        Alert.alert(
            "Exam Submitted",
            `Score: ${correctCount} / ${totalQuestions}\nAnswered: ${totalAnswered} of ${totalQuestions}`,
            [{ text: "OK", onPress: () => navigation.goBack() }],
        );
    };

    const isLastQuestionOverall =
        activeSection === examData.sections[examData.sections.length - 1].id &&
        currentIndex === sectionQuestions.length - 1;

    const isFirstQuestionOverall =
        activeSection === examData.sections[0].id && currentIndex === 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.timerBadge}>
                    <Ionicons
                        name="time-outline"
                        size={16}
                        color={timeLeft < 300 ? colors.error : colors.primary}
                    />
                    <Text
                        style={[
                            styles.timerText,
                            timeLeft < 300 && { color: colors.error },
                        ]}
                    >
                        {formatTime(timeLeft)}
                    </Text>
                </View>
            </View>

            <View style={styles.sectionsScroll}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.md }}
                >
                    {examData.sections.map((section) => (
                        <TouchableOpacity
                            key={section.id}
                            style={[
                                styles.sectionTab,
                                activeSection === section.id &&
                                    styles.sectionTabActive,
                            ]}
                            onPress={() => {
                                setActiveSection(section.id);
                                setCurrentIndex(0);
                            }}
                        >
                            <Text
                                style={[
                                    styles.sectionTabText,
                                    activeSection === section.id &&
                                        styles.sectionTabTextActive,
                                ]}
                            >
                                {section.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.content}>
                <View style={styles.questionHeader}>
                    <Text style={styles.questionNum}>
                        Question {currentIndex + 1} of {sectionQuestions.length}
                    </Text>
                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => handleAnswer(null)}
                    >
                        <Text style={styles.clearBtnText}>Clear Answer</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.questionScroll}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>
                            {currentQuestion.question}
                        </Text>
                    </View>

                    <View style={styles.optionsList}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected =
                                answers[currentQuestion.id] === option;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionSelected,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => handleAnswer(option)}
                                >
                                    <View style={styles.radioCircle}>
                                        {isSelected && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={styles.optionText}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.navBtn,
                        isFirstQuestionOverall && styles.navBtnDisabled,
                    ]}
                    disabled={isFirstQuestionOverall}
                    onPress={handlePrev}
                >
                    <Ionicons
                        name="chevron-back"
                        size={20}
                        color={
                            isFirstQuestionOverall
                                ? colors.textMuted
                                : colors.textPrimary
                        }
                    />
                    <Text
                        style={[
                            styles.navBtnText,
                            isFirstQuestionOverall && {
                                color: colors.textMuted,
                            },
                        ]}
                    >
                        Previous
                    </Text>
                </TouchableOpacity>

                {isLastQuestionOverall ? (
                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitBtnText}>Submit Exam</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navBtn}
                        onPress={handleNext}
                    >
                        <Text style={styles.navBtnText}>Next</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: colors.textSecondary,
        marginTop: spacing.md,
        fontSize: typography.fontSizeMD,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgOverlay,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
        flex: 1,
        marginRight: spacing.sm,
    },
    timerBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgInput,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
        gap: 6,
    },
    timerText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
        fontVariant: ["tabular-nums"],
    },
    sectionsScroll: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.sm,
        backgroundColor: colors.bgCardAlt,
    },
    sectionTab: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginRight: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.bgCard,
    },
    sectionTabActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + "15",
    },
    sectionTabText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    sectionTabTextActive: {
        color: colors.primary,
        fontWeight: typography.fontWeightSemiBold,
    },
    content: {
        flex: 1,
    },
    questionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.bg,
    },
    questionNum: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    clearBtnText: {
        color: colors.primaryLight,
        fontSize: typography.fontSizeXS,
    },
    questionScroll: {
        flex: 1,
        padding: spacing.md,
    },
    questionCard: {
        marginBottom: spacing.xl,
    },
    questionText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightMedium,
        lineHeight: 26,
    },
    optionsList: {
        gap: spacing.sm,
        paddingBottom: spacing.xxl,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + "10",
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.textMuted,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    optionText: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bgOverlay,
    },
    navBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
        gap: 4,
    },
    navBtnDisabled: {
        opacity: 0.5,
    },
    navBtnText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    submitBtn: {
        backgroundColor: colors.success,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.sm,
    },
    submitBtnText: {
        color: "#fff",
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
});
