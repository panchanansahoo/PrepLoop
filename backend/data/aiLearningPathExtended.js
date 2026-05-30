// Additional modules for AI Learning Path (Modules 3-5)
// This file extends the aiLearningPath.js

const additionalModules = [
  // Module 3: RNN & NLP
  {
    id: 'rnn-nlp',
    title: 'RNN & Natural Language Processing',
    description: 'Sequence models and NLP techniques',
    topics: ['RNN', 'LSTM', 'GRU', 'Word Embeddings', 'Attention', 'Seq2Seq'],
    estimatedTime: '2.5 weeks',
    unlocked: false,
    
    theory: {
      introduction: 'Recurrent Neural Networks process sequential data with memory, essential for NLP tasks.',
      keyTopics: [
        {
          title: 'LSTM Architecture',
          content: 'Long Short-Term Memory networks solve vanishing gradient with gates.',
          example: 'LSTM cell with forget, input, and output gates'
        }
      ],
      patterns: [
        {
          name: 'Seq2Seq',
          description: 'Encoder-decoder for sequence transformation',
          useCase: 'Machine translation'
        }
      ]
    },
    
    problems: [
      {
        id: 'rnn-1',
        title: 'Build Character RNN',
        difficulty: 'Hard',
        description: 'Text generation with RNN'
      }
    ],
    
    lessons: [
      { title: 'RNN Basics', duration: '60 min', type: 'video' },
      { title: 'LSTM & GRU', duration: '65 min', type: 'reading' },
      { title: 'Word Embeddings', duration: '45 min', type: 'video' },
      { title: 'Practice', duration: '4.5 hours', type: 'practice' }
    ]
  }
];

module.exports = additionalModules;
