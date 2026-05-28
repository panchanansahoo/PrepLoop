import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

import {
    getCategoryQuestions,
    getRandomQuestions,
} from "../../data/aptitudeData";

export default function AptitudePracticeScreen({ route, navigation }) {
    const { category, title } = route.params || {};

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTimeout = setTimeout(() => {
            let catId = category;
            if (catId === "logical") catId = "reasoning"; // Map 'logical' to 'reasoning'

            let allQ = getCategoryQuestions(catId);
            if (!allQ || allQ.length === 0) {
                // Fallback if empty
                allQ = getCategoryQuestions("quantitative");
            }

            const selectedRaw = getRandomQuestions(allQ, 10); // 10 questions per session

            const mappedQuestions = selectedRaw.map((q) => {
                const correctOpt = q.options.find(
                    (opt) => opt.label === q.correctAnswer,
                );
                return {
                    id: q.id,
                    question: q.question,
                    options: q.options.map((opt) => opt.value),
                    correctAnswer: correctOpt
                        ? correctOpt.value
                        : q.correctAnswer,
                    explanation: q.explanation,
                };
            });

            setQuestions(mappedQuestions);
            setLoading(false);
        }, 500);

        return () => clearTimeout(loadTimeout);
    }, [category]);

    const handleOptionSelect = (option) => {
        if (isAnswered) return;

        setSelectedAnswer(option);
        setIsAnswered(true);

        if (option === questions[currentIndex].correctAnswer) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            // `score` state may not yet reflect the last answer (setState is async).
            // Compute the final score synchronously: accumulated score from previous
            // questions plus 1 if the current (last) question was answered correctly.
            const lastQuestionCorrect =
                selectedAnswer === questions[currentIndex]?.correctAnswer
                    ? 1
                    : 0;
            const finalScore = score + lastQuestionCorrect;
            navigation.replace("AptitudeResults", {
                score: finalScore,
                total: questions.length,
                category,
                title,
            });
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    Loading {title} Questions...
                </Text>
            </SafeAreaView>
        );
    }

    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading question...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="close"
                        size={24}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Question {currentIndex + 1} of {questions.length}
                    </Text>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                                },
                            ]}
                        />
                    </View>
                </View>
                <View style={styles.scorePill}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>
                        {currentQuestion.question}
                    </Text>
                </View>

                <View style={styles.optionsList}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrect =
                            isAnswered &&
                            option === currentQuestion.correctAnswer;
                        const isWrong = isSelected && !isCorrect;

                        let optionStyle = styles.optionCard;
                        let textStyle = styles.optionText;
                        let iconName = "radio-button-off";
                        let iconColor = colors.textSecondary;

                        if (isAnswered) {
                            if (isCorrect) {
                                optionStyle = [
                                    styles.optionCard,
                                    styles.optionCorrect,
                                ];
                                textStyle = [
                                    styles.optionText,
                                    styles.textCorrect,
                                ];
                                iconName = "checkmark-circle";
                                iconColor = colors.success;
                            } else if (isWrong) {
                                optionStyle = [
                                    styles.optionCard,
                                    styles.optionWrong,
                                ];
                                textStyle = [
                                    styles.optionText,
                                    styles.textWrong,
                                ];
                                iconName = "close-circle";
                                iconColor = colors.error;
                            } else if (isSelected) {
                                // Default selected but not evaluated (shouldn't happen here)
                                optionStyle = [
                                    styles.optionCard,
                                    styles.optionSelected,
                                ];
                            } else {
                                // Unselected options when answered
                                optionStyle = [
                                    styles.optionCard,
                                    { opacity: 0.5 },
                                ];
                            }
                        } else if (isSelected) {
                            optionStyle = [
                                styles.optionCard,
                                styles.optionSelected,
                            ];
                            iconName = "radio-button-on";
                            iconColor = colors.primary;
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                style={optionStyle}
                                activeOpacity={0.7}
                                onPress={() => handleOptionSelect(option)}
                                disabled={isAnswered}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={20}
                                    color={iconColor}
                                    style={styles.optionIcon}
                                />
                                <Text style={textStyle}>{option}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {isAnswered && (
                    <View style={styles.explanationCard}>
                        <Text style={styles.explanationTitle}>Explanation</Text>
                        <Text style={styles.explanationText}>
                            {currentQuestion.explanation}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        !isAnswered && styles.nextButtonDisabled,
                    ]}
                    disabled={!isAnswered}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex < questions.length - 1
                            ? "Next Question"
                            : "View Results"}
                    </Text>
                </TouchableOpacity>
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
    },
    backButton: {
        padding: spacing.xs,
    },
    progressContainer: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: spacing.md,
    },
    progressText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginBottom: spacing.xs,
    },
    progressBarBg: {
        width: "100%",
        height: 6,
        backgroundColor: colors.borderLight,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    scorePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.borderLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    scoreText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    questionCard: {
        backgroundColor: colors.bgCard,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: spacing.lg,
    },
    questionText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightMedium,
        lineHeight: 24,
    },
    optionsList: {
        gap: spacing.sm,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: colors.bgCardAlt,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + "15",
    },
    optionCorrect: {
        borderColor: colors.success,
        backgroundColor: colors.success + "15",
    },
    optionWrong: {
        borderColor: colors.error,
        backgroundColor: colors.error + "15",
    },
    optionIcon: {
        marginRight: spacing.md,
    },
    optionText: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
    },
    textCorrect: {
        color: colors.success,
        fontWeight: typography.fontWeightMedium,
    },
    textWrong: {
        color: colors.error,
    },
    explanationCard: {
        marginTop: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.info + "15",
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.info + "30",
    },
    explanationTitle: {
        color: colors.info,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    explanationText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bgOverlay,
    },
    nextButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: "center",
    },
    nextButtonDisabled: {
        backgroundColor: colors.borderLight,
    },
    nextButtonText: {
        color: "#fff",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
});
