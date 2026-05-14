export const aptitudeQuestions = {
  average: {
    title: "Average",
    totalQuestions: 24,
    icon: "Calculator",
    color: "#818cf8",
    description: "Average problems for quantitative aptitude.",
    subcategories: {
      findingAverage: {
        title: "Finding Average of Numbers",
        totalXP: 55,
        questions: [
          {
            id: "avg_1",
            question:
              "Calculate the average of all numbers between 6 and 50 that are divisible by 6.",
            difficulty: "easy",
            xp: 10,
            options: [
              { label: "A", value: "24" },
              { label: "B", value: "27" },
              { label: "C", value: "30" },
              { label: "D", value: "33" },
            ],
            correctAnswer: "A",
          },
          {
            id: "avg_2",
            question:
              "A set of 13 numbers has an average of 40. If the average of the first seven numbers is 35 and the average of the last seven numbers is 46, what is the seventh number?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "42" },
              { label: "B", value: "47" },
              { label: "C", value: "52" },
              { label: "D", value: "57" },
            ],
            correctAnswer: "C",
          },
          {
            id: "avg_3",
            question:
              "There are 17 numbers with an average of 20. If the first six numbers have an average of 18 and the remaining 10 numbers have an average of 22, what is the value of the 7th number?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "16" },
              { label: "B", value: "18" },
              { label: "C", value: "12" },
              { label: "D", value: "14" },
            ],
            correctAnswer: "C",
          },
          {
            id: "avg_4",
            question:
              "Five consecutive odd numbers have an average of 31. What is the largest among these numbers?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "33" },
              { label: "B", value: "35" },
              { label: "C", value: "37" },
              { label: "D", value: "39" },
            ],
            correctAnswer: "B",
          },
        ],
      },
      averageMultipleGroups: {
        title: "Average Across Multiple Groups",
        totalXP: 60,
        questions: [
          {
            id: "avg_5",
            question:
              "There are two batches A and B of a class. Batch A consists of 36 students and batch B consists of 44 students. Find the average weight of whole class, if average weight of batch A is 40 kg and that of batch B is 35 kg.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "29.23 kg" },
              { label: "B", value: "32.56 kg" },
              { label: "C", value: "35.66 kg" },
              { label: "D", value: "37.25 kg" },
            ],
            correctAnswer: "D",
          },
          {
            id: "avg_6",
            question:
              "In a school, average marks of three batches of 40, 50 and 60 students respectively is 45, 55 and 70. Find the average marks of all the students.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "54.78" },
              { label: "B", value: "55.23" },
              { label: "C", value: "50.36" },
              { label: "D", value: "58.33" },
            ],
            correctAnswer: "D",
          },
          {
            id: "avg_7",
            question:
              "In a company, there are three age groups: 25 employees aged 25-30 with average age 28, 35 employees aged 31-40 with average age 35, and 20 employees aged 41-50 with average age 45. What is the average age of all employees?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "34.5 years" },
              { label: "B", value: "35.2 years" },
              { label: "C", value: "36.0 years" },
              { label: "D", value: "37.1 years" },
            ],
            correctAnswer: "B",
          },
          {
            id: "avg_8",
            question:
              "A school has four classes: Class 1 has 30 students with average height 150 cm, Class 2 has 25 students with average height 155 cm, Class 3 has 35 students with average height 160 cm, and Class 4 has 20 students with average height 145 cm. Find the average height of all students.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "153.5 cm" },
              { label: "B", value: "154.2 cm" },
              { label: "C", value: "152.8 cm" },
              { label: "D", value: "155.1 cm" },
            ],
            correctAnswer: "A",
          },
        ],
      },
      averageAddingReplacing: {
        title: "Average After Adding or Replacing Entry",
        totalXP: 60,
        questions: [
          {
            id: "avg_9",
            question:
              "The average age of a class of 29 students is 20 years. If the age of teacher is included, then the average increases by 3 months. Find the age of the teacher.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "25.2 years" },
              { label: "B", value: "27.5 years" },
              { label: "C", value: "29 years" },
              { label: "D", value: "31.5 years" },
            ],
            correctAnswer: "B",
          },
          {
            id: "avg_10",
            question:
              "2 years ago, the average age of a family of 5 members was 16 years. After a baby is born, the average age of family is the same today. Find the present age of the baby.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "4 years" },
              { label: "B", value: "6 years" },
              { label: "C", value: "8 years" },
              { label: "D", value: "8½ years" },
            ],
            correctAnswer: "B",
          },
          {
            id: "avg_11",
            question:
              "The average marks of 24 students in a class is 72. When a new student joins, the average becomes 74. What are the marks of the new student?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "120" },
              { label: "B", value: "122" },
              { label: "C", value: "124" },
              { label: "D", value: "126" },
            ],
            correctAnswer: "C",
          },
          {
            id: "avg_12",
            question:
              "In a group of 15 students, the average weight is 50 kg. If one student weighing 45 kg is replaced by another student, the new average becomes 52 kg. What is the weight of the new student?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "60 kg" },
              { label: "B", value: "65 kg" },
              { label: "C", value: "70 kg" },
              { label: "D", value: "75 kg" },
            ],
            correctAnswer: "D",
          },
        ],
      },
      averageIncorrectEntry: {
        title: "Average When Entry is Incorrect",
        totalXP: 60,
        questions: [
          {
            id: "avg_13",
            question:
              "John's marks were wrongly entered as 83 instead of 63. If the average marks calculated for the whole class increased by half, then find the number of students in the class.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "30" },
              { label: "B", value: "35" },
              { label: "C", value: "40" },
              { label: "D", value: "45" },
            ],
            correctAnswer: "C",
          },
          {
            id: "avg_14",
            question:
              "The mean of 40 observations was 46. Later on it was found that an observation 38 was wrongly taken as 33. Find the corrected value of mean.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "40.23" },
              { label: "B", value: "42.36" },
              { label: "C", value: "46.12" },
              { label: "D", value: "51.23" },
            ],
            correctAnswer: "C",
          },
          {
            id: "avg_15",
            question:
              "In a class of 25 students, one student's marks were incorrectly recorded as 75 instead of 95. Due to this error, the class average decreased by 0.8. What was the original average of the class?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "78.2" },
              { label: "B", value: "79.4" },
              { label: "C", value: "80.6" },
              { label: "D", value: "81.8" },
            ],
            correctAnswer: "C",
          },
          {
            id: "avg_16",
            question:
              "The average of 30 numbers is 45. It was later discovered that two numbers were wrongly recorded as 25 and 35 instead of 52 and 38 respectively. Find the corrected average.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "46.0" },
              { label: "B", value: "46.3" },
              { label: "C", value: "46.7" },
              { label: "D", value: "47.0" },
            ],
            correctAnswer: "A",
          },
        ],
      },
      averageSpeed: {
        title: "Calculating Average Speed",
        totalXP: 65,
        questions: [
          {
            id: "avg_17",
            question:
              "A person covers a distance of 60 km from P to Q at a speed of 20 km/hr and returns from Q to P at a speed of 30 km/hr. Find the average speed of person.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "22 km/hr" },
              { label: "B", value: "24 km/hr" },
              { label: "C", value: "26 km/hr" },
              { label: "D", value: "28.2 km/hr" },
            ],
            correctAnswer: "B",
          },
          {
            id: "avg_18",
            question:
              "An express train runs at an average speed of 27 km/hr including the time of stoppage at stations. Another train runs at an average speed of 41 km/hr excluding the stoppage time at stations. Find how many minutes does a train stop in 1 hour.",
            difficulty: "hard",
            xp: 20,
            options: [
              { label: "A", value: "20.52 min" },
              { label: "B", value: "15.23 min" },
              { label: "C", value: "12.50 min" },
              { label: "D", value: "10.75 min" },
            ],
            correctAnswer: "A",
          },
          {
            id: "avg_19",
            question:
              "A car travels 120 km at 60 km/hr, then 80 km at 40 km/hr, and finally 100 km at 50 km/hr. Find the average speed for the entire journey.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "48 km/hr" },
              { label: "B", value: "50 km/hr" },
              { label: "C", value: "52 km/hr" },
              { label: "D", value: "54 km/hr" },
            ],
            correctAnswer: "B",
          },
          {
            id: "avg_20",
            question:
              "A person travels from A to B at 25 km/hr and returns from B to A at 15 km/hr. If the total journey takes 4 hours, find the distance between A and B.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "30 km" },
              { label: "B", value: "35 km" },
              { label: "C", value: "37.5 km" },
              { label: "D", value: "40 km" },
            ],
            correctAnswer: "C",
          },
        ],
      },
      cricketScores: {
        title: "Cricket Scores and Innings Average",
        totalXP: 60,
        questions: [
          {
            id: "avg_21",
            question:
              "A batsman makes a score of 80 runs in the 16th inning and increases average by 3. What is his average after 16th inning?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "35" },
              { label: "B", value: "32" },
              { label: "C", value: "29" },
              { label: "D", value: "25" },
            ],
            correctAnswer: "B",
          },
          {
            id: "avg_22",
            question:
              "In a cricket match, 6 players had an average X of their runs. Average increases by 10 runs, if seventh player makes a score of 112 runs. What is the average of first 6 players?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "36" },
              { label: "B", value: "39" },
              { label: "C", value: "40" },
              { label: "D", value: "42" },
            ],
            correctAnswer: "D",
          },
          {
            id: "avg_23",
            question:
              "A bowler has taken 18 wickets at an average of 25 runs per wicket. In his next match, he takes 2 wickets for 30 runs. What is his new average?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "24.5" },
              { label: "B", value: "24.8" },
              { label: "C", value: "25.0" },
              { label: "D", value: "25.2" },
            ],
            correctAnswer: "A",
          },
          {
            id: "avg_24",
            question:
              "In a T20 match, Team A scored 160 runs with 6 players having an average of 24 runs each. Team B needs to score 161 runs. If 5 players of Team B have an average of 28 runs each, what should be the minimum score by the 6th player for Team B to win?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "21" },
              { label: "B", value: "22" },
              { label: "C", value: "23" },
              { label: "D", value: "24" },
            ],
            correctAnswer: "A",
          },
        ],
      },
    },
  },
  timeDistance: {
    title: "Time & Distance",
    totalQuestions: 16,
    icon: "Timer",
    color: "#f472b6",
    description: "Core speed-time-distance patterns and practice.",
    subcategories: {
      relativeSpeed: {
        title: "Relative Speed in Same or Opposite Directions",
        totalXP: 55,
        questions: [
          {
            id: "td_1",
            question:
              "Two towns P & Q are 275 km apart. A motorcycle rider starts from P towards Q at 8 a.m. at the speed of 25 km/hr. Another rider starts from Q towards P at 9 a.m. at the speed of 20 km/hr. Find at what time they will cross each other?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "2.45 p.m." },
              { label: "B", value: "2.30 p.m." },
              { label: "C", value: "1.35 p.m." },
              { label: "D", value: "1.15 p.m." },
            ],
            correctAnswer: "C",
          },
          {
            id: "td_2",
            question:
              "A train 120 m long is running at 60 km/hr. Another train 180 m long is running at 48 km/hr in the same direction. How long will it take for the faster train to pass the slower train?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "60 seconds" },
              { label: "B", value: "75 seconds" },
              { label: "C", value: "90 seconds" },
              { label: "D", value: "105 seconds" },
            ],
            correctAnswer: "C",
          },
          {
            id: "td_3",
            question:
              "Two cars are 420 km apart and moving towards each other. If one car is moving at 55 km/hr and the other at 50 km/hr, in how many hours will they meet?",
            difficulty: "easy",
            xp: 10,
            options: [
              { label: "A", value: "3 hours" },
              { label: "B", value: "4 hours" },
              { label: "C", value: "4.5 hours" },
              { label: "D", value: "5 hours" },
            ],
            correctAnswer: "B",
          },
          {
            id: "td_4",
            question:
              "A cyclist is moving at 20 km/hr and another cyclist starts from the same point 30 minutes later at 25 km/hr in the same direction. After how much time from the start of the second cyclist will he overtake the first?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "1 hour" },
              { label: "B", value: "1.5 hours" },
              { label: "C", value: "2 hours" },
              { label: "D", value: "2.5 hours" },
            ],
            correctAnswer: "C",
          },
        ],
      },
      findingTimeSpeedDistance: {
        title: "Finding Time, Speed, or Distance",
        totalXP: 50,
        questions: [
          {
            id: "td_5",
            question:
              "How many seconds does Puja take to cover a distance of 500 m, if she runs at a speed of 30 km/hr?",
            difficulty: "easy",
            xp: 10,
            options: [
              { label: "A", value: "60 sec" },
              { label: "B", value: "82 sec" },
              { label: "C", value: "95 sec" },
              { label: "D", value: "100 sec" },
            ],
            correctAnswer: "A",
          },
          {
            id: "td_6",
            question:
              "A cyclist covers a distance of 800 meter in 4 minutes 20 seconds. What is the speed in km/hr of the cyclist?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "6.2 km/h" },
              { label: "B", value: "8.4 km/hr" },
              { label: "C", value: "11.05 km/hr" },
              { label: "D", value: "16.07 km/hr" },
            ],
            correctAnswer: "C",
          },
          {
            id: "td_7",
            question:
              "A man walking at the rate of 6 km/hr crosses a bridge in 15 minutes. The length of the bridge is ______.",
            difficulty: "easy",
            xp: 10,
            options: [
              { label: "A", value: "1000 m" },
              { label: "B", value: "1250 m" },
              { label: "C", value: "1500 m" },
              { label: "D", value: "1800 m" },
            ],
            correctAnswer: "C",
          },
          {
            id: "td_8",
            question:
              "A car travels 120 km in 1 hour 30 minutes. What is its speed in meters per second?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "22.22 m/s" },
              { label: "B", value: "24.44 m/s" },
              { label: "C", value: "26.67 m/s" },
              { label: "D", value: "28.89 m/s" },
            ],
            correctAnswer: "A",
          },
        ],
      },
      speedOppositeDirections: {
        title: "Speed When Moving in Opposite Directions",
        totalXP: 55,
        questions: [
          {
            id: "td_9",
            question:
              "Two girls move in opposite directions, one from A to B and other from B to A. The girl from A reaches the destination in 16 hrs and girl from B reaches her destination in 25 hrs, after having met. If former's speed is 25 km/hr, what will be the speed of latter?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "10 km/hr" },
              { label: "B", value: "12 km/hr" },
              { label: "C", value: "16 km/hr" },
              { label: "D", value: "20 km/hr" },
            ],
            correctAnswer: "D",
          },
          {
            id: "td_10",
            question:
              "Two buses start at the same time, one from P to Q and the other from Q to P. If both buses reach after 4 hours and 16 hours at Q and P respectively after they cross each other, what would be the ratio of speeds of the bus starting from P and that of the one starting from point Q?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "2 : 1" },
              { label: "B", value: "1 : 2" },
              { label: "C", value: "2 : 2" },
              { label: "D", value: "1 : 4" },
            ],
            correctAnswer: "A",
          },
          {
            id: "td_11",
            question:
              "Two trains start at the same time from stations A and B, 300 km apart, and proceed towards each other at speeds of 80 km/hr and 70 km/hr respectively. At what distance from A will they meet?",
            difficulty: "easy",
            xp: 10,
            options: [
              { label: "A", value: "140 km" },
              { label: "B", value: "150 km" },
              { label: "C", value: "160 km" },
              { label: "D", value: "180 km" },
            ],
            correctAnswer: "C",
          },
          {
            id: "td_12",
            question:
              "Two cyclists start from opposite ends of a track. After meeting, one cyclist takes 9 hours to reach the other end while the second takes 4 hours. If the second cyclist's speed is 36 km/hr, what is the first cyclist's speed?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "20 km/hr" },
              { label: "B", value: "24 km/hr" },
              { label: "C", value: "28 km/hr" },
              { label: "D", value: "32 km/hr" },
            ],
            correctAnswer: "B",
          },
        ],
      },
      averageSpeedVariable: {
        title: "Average Speed with Variable Speeds",
        totalXP: 55,
        questions: [
          {
            id: "td_13",
            question:
              "An aeroplane flying 1000 km covers the first 200 km at the rate of 200 km/hr, the second 200 km at 400 km/hr, the third 200 km at 600 km/hr, the fourth 200 km at 800 km/hr, and last 200 km at 1000 km/hr. Determine the average speed of the aeroplane.",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "250 km/hr" },
              { label: "B", value: "300 km/hr" },
              { label: "C", value: "480 km/hr" },
              { label: "D", value: "600 km/hr" },
            ],
            correctAnswer: "C",
          },
          {
            id: "td_14",
            question:
              "Jennifer travels first 4 hours of her journey at a speed of 80 miles/hr and the remaining distance in 6 hours at a speed of 30 miles/hr. What is her average speed in miles/hr?",
            difficulty: "easy",
            xp: 10,
            options: [
              { label: "A", value: "50 miles/hr" },
              { label: "B", value: "60 miles/hr" },
              { label: "C", value: "75 miles/hr" },
              { label: "D", value: "92 miles/hr" },
            ],
            correctAnswer: "A",
          },
          {
            id: "td_15",
            question:
              "A person travels half of his journey at 40 km/hr and the remaining half at 60 km/hr. What is his average speed for the entire journey?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "45 km/hr" },
              { label: "B", value: "48 km/hr" },
              { label: "C", value: "50 km/hr" },
              { label: "D", value: "52 km/hr" },
            ],
            correctAnswer: "B",
          },
          {
            id: "td_16",
            question:
              "A car travels one-third of the distance at 20 km/hr, one-third at 30 km/hr, and the remaining one-third at 60 km/hr. What is the average speed of the car?",
            difficulty: "medium",
            xp: 15,
            options: [
              { label: "A", value: "27 km/hr" },
              { label: "B", value: "30 km/hr" },
              { label: "C", value: "33 km/hr" },
              { label: "D", value: "36 km/hr" },
            ],
            correctAnswer: "B",
          },
        ],
      },
    },
  },
};

// Helper function to get all questions from a topic
export const getTopicQuestions = (topicKey) => {
  const topic = aptitudeQuestions[topicKey];
  if (!topic) return [];

  const allQuestions = [];
  Object.values(topic.subcategories).forEach((subcategory) => {
    allQuestions.push(...subcategory.questions);
  });

  return allQuestions;
};

// Helper function to calculate progress
export const calculateProgress = (topicKey, solvedQuestions) => {
  const topic = aptitudeQuestions[topicKey];
  if (!topic) return { solved: 0, total: 0, xp: 0 };

  let totalXP = 0;
  let earnedXP = 0;
  let totalQuestions = 0;
  let solvedCount = 0;

  Object.values(topic.subcategories).forEach((subcategory) => {
    subcategory.questions.forEach((q) => {
      totalQuestions++;
      totalXP += q.xp;
      if (solvedQuestions.includes(q.id)) {
        solvedCount++;
        earnedXP += q.xp;
      }
    });
  });

  return {
    solved: solvedCount,
    total: totalQuestions,
    earnedXP,
    totalXP,
  };
};
