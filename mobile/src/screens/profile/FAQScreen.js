import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function FAQScreen({ navigation }) {
    const [expandedId, setExpandedId] = useState(null);

    const faqs = [
        {
            id: 1,
            question: "What is PrepLoop?",
            answer: "PrepLoop is an AI-powered platform designed to help you prepare for technical interviews, specifically focusing on Data Structures, Algorithms, and System Design."
        },
        {
            id: 2,
            question: "How do the AI Mock Interviews work?",
            answer: "Our AI agent conducts voice-based and text-based mock interviews, asking you technical questions, providing hints when you're stuck, and giving you detailed feedback and scores at the end of the session."
        },
        {
            id: 3,
            question: "Are the problems similar to real interviews?",
            answer: "Yes, we curate problems based on real interview experiences from top tech companies (FAANG and others) to ensure your preparation is relevant."
        },
        {
            id: 4,
            question: "How is the code evaluated?",
            answer: "Your code is run against a suite of hidden test cases in a secure sandbox environment to check for correctness and edge-case handling."
        },
        {
            id: 5,
            question: "Can I use PrepLoop on multiple devices?",
            answer: "Yes! Your progress, bookmarks, and notes are synced across our web platform and mobile app so you can practice anywhere."
        }
    ];

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="FAQ & Help" onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
                    <Text style={styles.headerDesc}>Find answers to common questions about PrepLoop.</Text>
                </View>

                {faqs.map((faq) => {
                    const isExpanded = expandedId === faq.id;
                    return (
                        <TouchableOpacity 
                            key={faq.id} 
                            style={styles.faqCard} 
                            onPress={() => toggleExpand(faq.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.questionRow}>
                                <Text style={styles.questionText}>{faq.question}</Text>
                                <Text style={styles.iconText}>{isExpanded ? "−" : "+"}</Text>
                            </View>
                            {isExpanded && (
                                <Text style={styles.answerText}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}

                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Still need help?</Text>
                    <TouchableOpacity style={styles.contactBtn}>
                        <Text style={styles.contactBtnText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    
    header: { marginBottom: spacing.xl },
    headerTitle: { color: colors.textPrimary, fontSize: typography.fontSize2XL, fontWeight: typography.fontWeightBold, marginBottom: spacing.sm },
    headerDesc: { color: colors.textSecondary, fontSize: typography.fontSizeMD },
    
    faqCard: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    questionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    questionText: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, flex: 1, paddingRight: spacing.md },
    iconText: { color: colors.textSecondary, fontSize: typography.fontSizeXL },
    answerText: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 22, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    
    contactSection: { marginTop: spacing.xxl, alignItems: "center", padding: spacing.xl, backgroundColor: "rgba(129, 140, 248, 0.05)", borderRadius: borderRadius.lg, borderWidth: 1, borderColor: "rgba(129, 140, 248, 0.2)" },
    contactTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.md },
    contactBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
    contactBtnText: { color: colors.textInverse, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
});
