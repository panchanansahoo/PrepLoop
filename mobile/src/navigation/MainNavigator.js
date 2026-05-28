import React from "react";
import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Tab screens
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import DSAPatternsScreen from "../screens/dsa/DSAPatternsScreen";
import DSAProblemScreen from "../screens/dsa/DSAProblemScreen";
import DSAProblemDetailScreen from "../screens/dsa/DSAProblemDetailScreen";
import InterviewHubScreen from "../screens/interview/InterviewHubScreen";
import AIInterviewScreen from "../screens/interview/AIInterviewScreen";
import InterviewHistoryScreen from "../screens/interview/InterviewHistoryScreen";
import JobsScreen from "../screens/jobs/JobsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import ResumeAnalyzerScreen from "../screens/profile/ResumeAnalyzerScreen";
import CoinWalletScreen from "../screens/wallet/CoinWalletScreen";

// Newly created screens
import InterviewAnalyticsScreen from "../screens/interview/InterviewAnalyticsScreen";
import CompanyPrepScreen from "../screens/interview/CompanyPrepScreen";
import CompanyDetailsScreen from "../screens/interview/CompanyDetailsScreen";
import ImprovementPlanScreen from "../screens/interview/ImprovementPlanScreen";

import DailyChallengesScreen from "../screens/dsa/DailyChallengesScreen";
import ProblemExplorerScreen from "../screens/dsa/ProblemExplorerScreen";
import LearningPathScreen from "../screens/dsa/LearningPathScreen";
import TopicLearningScreen from "../screens/dsa/TopicLearningScreen";

import QuizArenaScreen from "../screens/quiz/QuizArenaScreen";

import NotesBookmarksScreen from "../screens/profile/NotesBookmarksScreen";
import FAQScreen from "../screens/profile/FAQScreen";

import BlogListScreen from "../screens/blog/BlogListScreen";
import BlogPostScreen from "../screens/blog/BlogPostScreen";

import DiscussionForumScreen from "../screens/community/DiscussionForumScreen";
import ThreadDetailScreen from "../screens/community/ThreadDetailScreen";

// Phase 5 Screens
import AptitudeHubScreen from "../screens/aptitude/AptitudeHubScreen";
import AptitudePracticeScreen from "../screens/aptitude/AptitudePracticeScreen";
import AptitudeResultsScreen from "../screens/aptitude/AptitudeResultsScreen";
import ExamHubScreen from "../screens/exam/ExamHubScreen";
import ExamPracticeScreen from "../screens/exam/ExamPracticeScreen";

import SystemDesignPathScreen from "../screens/learning/SystemDesignPathScreen";
import TechnicalLearningPathScreen from "../screens/learning/TechnicalLearningPathScreen";
import HRLearningPathScreen from "../screens/learning/HRLearningPathScreen";

import MultiRoundInterviewScreen from "../screens/interview/MultiRoundInterviewScreen";
import DebuggingInterviewScreen from "../screens/interview/DebuggingInterviewScreen";
import CodeReviewInterviewScreen from "../screens/interview/CodeReviewInterviewScreen";

import SQLProblemExplorerScreen from "../screens/dsa/SQLProblemExplorerScreen";
import SQLEditorScreen from "../screens/dsa/SQLEditorScreen";
import CodeEditorScreen from "../screens/dsa/CodeEditorScreen";

import { colors, typography } from "../utils/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Stack navigators for tabs that have nested screens ---

function DashboardStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="DashboardMain" component={DashboardScreen} />
            <Stack.Screen name="CoinWallet" component={CoinWalletScreen} />
            <Stack.Screen name="QuizArena" component={QuizArenaScreen} />
            <Stack.Screen name="BlogList" component={BlogListScreen} />
            <Stack.Screen name="BlogPost" component={BlogPostScreen} />
            <Stack.Screen name="DiscussionForum" component={DiscussionForumScreen} />
            <Stack.Screen name="ThreadDetail" component={ThreadDetailScreen} />
        </Stack.Navigator>
    );
}

function DSAStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="DSAPatterns" component={DSAPatternsScreen} />
            <Stack.Screen name="DSAProblem" component={DSAProblemScreen} />
            <Stack.Screen name="DSAProblemDetail" component={DSAProblemDetailScreen} />
            <Stack.Screen name="DailyChallenges" component={DailyChallengesScreen} />
            <Stack.Screen name="ProblemExplorer" component={ProblemExplorerScreen} />
            <Stack.Screen name="LearningPath" component={LearningPathScreen} />
            <Stack.Screen name="TopicLearning" component={TopicLearningScreen} />
            <Stack.Screen name="CodeEditor" component={CodeEditorScreen} />
            
            {/* Phase 5 DSA / Learning / Assessment extensions */}
            <Stack.Screen name="AptitudeHub" component={AptitudeHubScreen} />
            <Stack.Screen name="AptitudePractice" component={AptitudePracticeScreen} />
            <Stack.Screen name="AptitudeResults" component={AptitudeResultsScreen} />
            <Stack.Screen name="ExamHub" component={ExamHubScreen} />
            <Stack.Screen name="ExamPractice" component={ExamPracticeScreen} />
            <Stack.Screen name="SystemDesignPath" component={SystemDesignPathScreen} />
            <Stack.Screen name="TechnicalLearningPath" component={TechnicalLearningPathScreen} />
            <Stack.Screen name="HRLearningPath" component={HRLearningPathScreen} />
            <Stack.Screen name="SQLProblemExplorer" component={SQLProblemExplorerScreen} />
            <Stack.Screen name="SQLEditor" component={SQLEditorScreen} />
        </Stack.Navigator>
    );
}

function InterviewStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="InterviewHub" component={InterviewHubScreen} />
            <Stack.Screen
                name="AIInterview"
                component={AIInterviewScreen}
                options={{ gestureEnabled: false }} // prevent swipe-back during live interview
            />
            <Stack.Screen name="InterviewHistory" component={InterviewHistoryScreen} />
            <Stack.Screen name="InterviewAnalytics" component={InterviewAnalyticsScreen} />
            <Stack.Screen name="CompanyPrep" component={CompanyPrepScreen} />
            <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
            <Stack.Screen name="ImprovementPlan" component={ImprovementPlanScreen} />
            
            {/* Phase 5 Interview extensions */}
            <Stack.Screen name="MultiRoundInterview" component={MultiRoundInterviewScreen} />
            <Stack.Screen name="DebuggingInterview" component={DebuggingInterviewScreen} />
            <Stack.Screen name="CodeReviewInterview" component={CodeReviewInterviewScreen} />
        </Stack.Navigator>
    );
}

function ProfileStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="CoinWallet" component={CoinWalletScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ResumeAnalyzer" component={ResumeAnalyzerScreen} />
            <Stack.Screen name="NotesBookmarks" component={NotesBookmarksScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
        </Stack.Navigator>
    );
}

// --- Tab icon helper ---
function TabIcon({ emoji, focused }) {
    return (
        <Text
            style={{
                fontSize: 22,
                opacity: focused ? 1 : 0.5,
                transform: [{ scale: focused ? 1.1 : 1 }],
            }}
        >
            {emoji}
        </Text>
    );
}

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                // Tab bar matching web's dark near-black nav
                tabBarStyle: {
                    backgroundColor: "#0a0a0e",
                    borderTopColor: "#1c1c22",
                    borderTopWidth: 1,
                    height: 64,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
                tabBarActiveTintColor: "#818cf8", // web: light indigo active
                tabBarInactiveTintColor: "#52525b", // web: zinc-600
                tabBarLabelStyle: {
                    fontSize: typography.fontSizeXS,
                    fontWeight: typography.fontWeightSemiBold,
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardStack}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🏠" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="DSA"
                component={DSAStack}
                options={{
                    tabBarLabel: "DSA",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🧩" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Interview"
                component={InterviewStack}
                options={{
                    tabBarLabel: "Interview",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🤖" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Jobs"
                component={JobsScreen}
                options={{
                    tabBarLabel: "Jobs",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="💼" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="👤" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
