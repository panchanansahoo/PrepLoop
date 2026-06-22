import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Deep linking configuration
const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'preploop://', 'https://preploop.com'],
  config: {
    screens: {
      // Main tabs (when authenticated)
      Dashboard: {
        screens: {
          DashboardMain: 'dashboard',
          CoinWallet: 'wallet',
        },
      },
      DSA: {
        screens: {
          DSAPatterns: 'dsa',
          DSAProblem: 'problems/:patternId',
          DSAProblemDetail: 'problems/:patternId/:problemId',
        },
      },
      Interview: {
        screens: {
          InterviewHub: 'interview',
          AIInterview: 'interview/session',
          InterviewHistory: 'interview/history',
        },
      },
      Jobs: 'jobs',
      Profile: {
        screens: {
          ProfileMain: 'profile',
          Settings: 'settings',
          EditProfile: 'profile/edit',
          ResumeAnalyzer: 'resume',
        },
      },
    },
  },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading PrepLoop..." />;
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
