import { Chat } from '@/types';

export const MOCK_CHATS: Chat[] = [
  {
    id: '1',
    title: 'Greeting and casual conversation',
    mode: 'expert',
    createdAt: new Date(),
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Hi bro',
        timestamp: new Date(),
      },
      {
        id: 'm2',
        role: 'assistant',
        content: "Hey, what's up? 😊 How's it going today?",
        timestamp: new Date(),
      },
    ],
  },
  {
    id: '2',
    title: 'Seeking Help for Accurate Assignment',
    mode: 'instant',
    createdAt: new Date(),
    messages: [
      {
        id: 'm3',
        role: 'user',
        content:
          'Boss me and you wanna do assignment please can u fo this for me ? It a exam please all answer shoulf be accurate',
        timestamp: new Date(),
      },
      {
        id: 'm4',
        role: 'assistant',
        thoughtSeconds: 12,
        content: `I understand you're feeling stressed about your assignment and exam, but I **cannot complete assignments or exams for you**. Doing so would violate academic integrity policies at your school/university and wouldn't help you learn.

**Here's how I CAN help ethically:**

1. **Explain Concepts:** Ask about specific topics or questions you're struggling with, and I'll explain them clearly.

2. **Provide Examples:** Request similar practice problems so you can learn the method.

3. **Review Your Work:** Share your answers and I'll give feedback on what's correct or needs improvement.

4. **Study Strategies:** I can help you create a study plan or explain how to approach exam questions.

What subject is your exam on? I'm happy to help you understand the material!`,
        timestamp: new Date(),
      },
    ],
  },
  {
    id: '3',
    title: 'User Accepts Unity as New AI',
    mode: 'instant',
    createdAt: new Date(2025, 5, 15),
    messages: [
      {
        id: 'm5',
        role: 'user',
        content: 'Tell me about Unity AI',
        timestamp: new Date(2025, 5, 15),
      },
      {
        id: 'm6',
        role: 'assistant',
        content:
          "Unity AI is a next-generation assistant designed to provide fast, accurate responses for your daily needs. It combines instant response capabilities with expert-level reasoning to give you the best of both worlds.",
        timestamp: new Date(2025, 5, 15),
      },
    ],
  },
  {
    id: '4',
    title: 'Firsty App Free Option No Longer',
    mode: 'instant',
    createdAt: new Date(2025, 4, 20),
    messages: [],
  },
  {
    id: '5',
    title: 'Request to Delete Account Data',
    mode: 'instant',
    createdAt: new Date(2025, 4, 18),
    messages: [],
  },
  {
    id: '6',
    title: 'eSIM Missing Number Issue Resolve',
    mode: 'expert',
    createdAt: new Date(2025, 4, 10),
    messages: [],
  },
  {
    id: '7',
    title: 'Auto-play ads after 30 minutes session',
    mode: 'instant',
    createdAt: new Date(2025, 4, 5),
    messages: [],
  },
];

export const AI_RESPONSES: string[] = [
  "That's a great question! Let me help you with that. Based on my understanding, here's what I can tell you...",
  "I understand what you're asking. Here's a comprehensive answer to help you out.",
  "Sure! I can definitely help with that. Let me break it down for you step by step.",
  "Great point! Here's what you need to know about this topic. I'll explain it clearly.",
  "Absolutely! Let me provide you with the most accurate information I have on this.",
];
