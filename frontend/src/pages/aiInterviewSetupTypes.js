import { Code2, MessageSquare, Users } from 'lucide-react';

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
  {
    id: 'peer',
    title: 'Peer 1-on-1 Round',
    description: 'Collaborative live coding & interview practice with another peer in real-time.',
    icon: Users,
    iconClassName: 'ai-setup-experience-icon--peer',
  },
];
