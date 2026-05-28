import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { EmptyState } from "../../components/EmptyState";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function QuizArenaScreen({ navigation }) {
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);

    // Mock data for initial implementation
    const questions = [
        {
            id: 1,
            text: "What is the time complexity of binary search?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            correct: 1, // index of correct option
            explanation: "Binary search divides the search interval in half at each step, resulting in logarithmic time complexity."
        },
        {
            id: 2,
            text: "Which data structure uses LIFO (Last In First Out)?",
            options: ["Queue", "Linked List", "Stack", "Tree"],
            correct: 2,
            explanation: "A stack is a linear data structure that follows the Last In First Out (LIFO) principle."
        }
    ];

    const handleStart = () => {
        setQuizStarted(true);
        setCurrentQuestion(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
    };

    const handleAnswer = (index) => {
        if (isAnswered) return;
        
        setSelectedAnswer(index);
        setIsAnswered(true);
        
        if (index === questions[currentQuestion].correct) {
            setScore(score + 10);
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            // Quiz finished state
            setCurrentQuestion(questions.length); 
        }
    };

    if (!quizStarted) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Quiz Arena" onBack={() => navigation.goBack()} />
                <ScrollView contentContainerStyle={styles.centerContent}>
                    <View style={styles.heroCard}>
                        <Text style={styles.heroEmoji}>⚔️</Text>
                        <Text style={styles.heroTitle}>Welcome to the Arena</Text>
                        <Text style={styles.heroDesc}>
                            Test your knowledge with quick-fire multiple choice questions. 
                            Earn coins and boost your rating.
                        </Text>
                        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                            <Text style={styles.startButtonText}>Start Quiz</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Finished State
    if (currentQuestion >= questions.length) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Quiz Complete" onBack={() => navigation.goBack()} />
                <View style={styles.centerContent}>
                    <Text style={styles.heroEmoji}>🏆</Text>
                    <Text style={styles.heroTitle}>Quiz Finished!</Text>
                    <Text style={styles.heroDesc}>
                        You scored {score} points out of {questions.length * 10}.
                    </Text>
                    <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                        <Text style={styles.startButtonText}>Play Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const question = questions[currentQuestion];

    return (
        <View style={styles.container}>
            <ScreenHeader 
                title="Quiz Arena" 
                onBack={() => setQuizStarted(false)} 
                right={<Text style={styles.scoreText}>Score: {score}</Text>}
            />
            
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { width: `${((currentQuestion) / questions.length) * 100}%` }
                        ]} 
                    />
                </View>
                <Text style={styles.progressText}>{currentQuestion + 1} / {questions.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{question.text}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {question.options.map((option, index) => {
                        let optionStyle = styles.optionCard;
                        let textStyle = styles.optionText;

                        if (isAnswered) {
                            if (index === question.correct) {
                                optionStyle = [styles.optionCard, styles.optionCorrect];
                                textStyle = [styles.optionText, styles.textCorrect];
                            } else if (index === selectedAnswer) {
                                optionStyle = [styles.optionCard, styles.optionIncorrect];
                                textStyle = [styles.optionText, styles.textIncorrect];
                            }
                        } else if (selectedAnswer === index) {
                            optionStyle = [styles.optionCard, styles.optionSelected];
                        }

                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={optionStyle} 
                                onPress={() => handleAnswer(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={textStyle}>{option}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {isAnswered && (
                    <View style={styles.explanationCard}>
                        <Text style={styles.explanationTitle}>
                            {selectedAnswer === question.correct ? "✅ Correct!" : "❌ Incorrect"}
                        </Text>
                        <Text style={styles.explanationText}>{question.explanation}</Text>
                        
                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centerContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },
    
    scoreText: { color: colors.primary, fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeMD },
    
    heroCard: { backgroundColor: colors.bgCard, padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: "center", width: "100%", borderWidth: 1, borderColor: colors.border },
    heroEmoji: { fontSize: 64, marginBottom: spacing.md },
    heroTitle: { color: colors.textPrimary, fontSize: typography.fontSize2XL, fontWeight: typography.fontWeightBold, marginBottom: spacing.md },
    heroDesc: { color: colors.textSecondary, fontSize: typography.fontSizeMD, textAlign: "center", marginBottom: spacing.xl, lineHeight: 24 },
    startButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, width: "100%", alignItems: "center" },
    startButtonText: { color: colors.textInverse, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
    
    progressContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
    progressBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, marginRight: spacing.md, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: colors.primary },
    progressText: { color: colors.textSecondary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold },

    questionCard: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
    questionText: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, lineHeight: 28 },
    
    optionsContainer: { gap: spacing.md },
    optionCard: { backgroundColor: colors.bgCardAlt, padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
    optionText: { color: colors.textPrimary, fontSize: typography.fontSizeMD },
    
    optionSelected: { borderColor: colors.primary, backgroundColor: "rgba(129, 140, 248, 0.1)" },
    
    optionCorrect: { borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }, // Green
    textCorrect: { color: "#10b981", fontWeight: typography.fontWeightBold },
    
    optionIncorrect: { borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }, // Red
    textIncorrect: { color: "#ef4444", fontWeight: typography.fontWeightBold },
    
    explanationCard: { marginTop: spacing.xl, padding: spacing.lg, backgroundColor: "rgba(129, 140, 248, 0.05)", borderRadius: borderRadius.lg, borderWidth: 1, borderColor: "rgba(129, 140, 248, 0.2)" },
    explanationTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold, marginBottom: spacing.sm },
    explanationText: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 22, marginBottom: spacing.lg },
    
    nextButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center" },
    nextButtonText: { color: colors.textInverse, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
});
