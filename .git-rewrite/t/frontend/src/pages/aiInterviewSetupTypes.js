import { Code2, MessageSquare } from 'lucide-react';

export const INTERVIEW_SETUP_TYPES = [
  {
    id: 'hr',
    title: 'HR Round',
    description: 'Behavioral and situational questions. Focus on culture fit, teamwork, and leadership.',
    icon: MessageSquare,
    iconClassName: 'ai-setup-experience-icon--fresher',
  },
  {
    id: 'technical',
    title: 'Technical Round',
    description: 'Core technical skills, data structures, algorithms, and system design concepts.',
    icon: Code2,
    iconClassName: 'ai-setup-experience-icon--experienced',
  },
];
