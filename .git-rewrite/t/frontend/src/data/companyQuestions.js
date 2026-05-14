export const companyQuestions = {
    tcs: {
        title: "TCS Specific Questions",
        totalXP: 60,
        icon: "Building",
        color: "#0f172a",
        description: "Previous year questions asked in TCS NQT and Ninja.",
        questions: [
            {
                id: "tcs_1",
                question: "A man completes a journey in 10 hours. He travels first half of the journey at the rate of 21 km/hr and second half at the rate of 24 km/hr. Find the total journey in km.",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "220 km" },
                    { label: "B", value: "224 km" },
                    { label: "C", value: "230 km" },
                    { label: "D", value: "234 km" }
                ],
                correctAnswer: "B"
            },
            {
                id: "tcs_2",
                question: "Two numbers are respectively 20% and 50% more than a third number. The ratio of the two numbers is:",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "2:5" },
                    { label: "B", value: "3:5" },
                    { label: "C", value: "4:5" },
                    { label: "D", value: "6:7" }
                ],
                correctAnswer: "C"
            },
            {
                id: "tcs_3",
                question: "The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "4 years" },
                    { label: "B", value: "8 years" },
                    { label: "C", value: "10 years" },
                    { label: "D", value: "None of these" }
                ],
                correctAnswer: "A"
            },
            {
                id: "tcs_4",
                question: "In how many ways can the letters of the word 'LEADER' be arranged?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "72" },
                    { label: "B", value: "144" },
                    { label: "C", value: "360" },
                    { label: "D", value: "720" }
                ],
                correctAnswer: "C"
            }
        ]
    },
    infosys: {
        title: "Infosys Specific Questions",
        totalXP: 65,
        icon: "Building",
        color: "#0ea5e9",
        description: "Previous year questions asked in Infosys online tests.",
        questions: [
            {
                id: "infy_1",
                question: "If A = 1, B = 2, C = 3 and so on. What is the value of 'CODE'?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "24" },
                    { label: "B", value: "25" },
                    { label: "C", value: "26" },
                    { label: "D", value: "27" }
                ],
                correctAnswer: "D"
            },
            {
                id: "infy_2",
                question: "Find the missing term in the series: 3, 7, 15, 31, 63, ...",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "92" },
                    { label: "B", value: "115" },
                    { label: "C", value: "127" },
                    { label: "D", value: "131" }
                ],
                correctAnswer: "C"
            },
            {
                id: "infy_3",
                question: "Six people A, B, C, D, E, F are sitting in a circle facing the center. B is between F and C. A is between E and D. F is to the left of D. Who is sitting between A and F?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "E" },
                    { label: "B", value: "D" },
                    { label: "C", value: "C" },
                    { label: "D", value: "None" }
                ],
                correctAnswer: "B"
            },
            {
                id: "infy_4",
                question: "Consider the word 'INFOSYS'. How many ways can the letters be arranged such that both 'S' are together?",
                difficulty: "hard",
                xp: 20,
                options: [
                    { label: "A", value: "360" },
                    { label: "B", value: "720" },
                    { label: "C", value: "1440" },
                    { label: "D", value: "2520" }
                ],
                correctAnswer: "B"
            }
        ]
    },
    accenture: {
        title: "Accenture Specific Questions",
        totalXP: 60,
        icon: "Building",
        color: "#a855f7",
        description: "Previous year questions asked in Accenture assessments.",
        questions: [
            {
                id: "acc_1",
                question: "A pipe can fill a tank in 15 hours. Due to a leak in the bottom, it is filled in 20 hours. If the tank is full, how much time will the leak take to empty it?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "40 hours" },
                    { label: "B", value: "50 hours" },
                    { label: "C", value: "60 hours" },
                    { label: "D", value: "70 hours" }
                ],
                correctAnswer: "C"
            },
            {
                id: "acc_2",
                question: "What is the probability of getting a sum of 9 from two throws of a dice?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "1/6" },
                    { label: "B", value: "1/8" },
                    { label: "C", value: "1/9" },
                    { label: "D", value: "1/12" }
                ],
                correctAnswer: "C"
            },
            {
                id: "acc_3",
                question: "A mixture contains alcohol and water in the ratio 4:3. If 5 liters of water is added to the mixture, the ratio becomes 4:5. Find the quantity of alcohol in the given mixture.",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "10 liters" },
                    { label: "B", value: "12 liters" },
                    { label: "C", value: "15 liters" },
                    { label: "D", value: "20 liters" }
                ],
                correctAnswer: "A"
            },
            {
                id: "acc_4",
                question: "A man can row upstream at 8 kmph and downstream at 13 kmph. The speed of the stream is:",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "2.5 kmph" },
                    { label: "B", value: "4.2 kmph" },
                    { label: "C", value: "5 kmph" },
                    { label: "D", value: "10.5 kmph" }
                ],
                correctAnswer: "A"
            }
        ]
    },
    wipro: {
        title: "Wipro Specific Questions",
        totalXP: 55,
        icon: "Building",
        color: "#3b82f6",
        description: "Previous year questions asked in Wipro NLTH.",
        questions: [
            {
                id: "wip_1",
                question: "Find the odd man out: 3, 5, 11, 14, 17, 21",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "21" },
                    { label: "B", value: "17" },
                    { label: "C", value: "14" },
                    { label: "D", value: "3" }
                ],
                correctAnswer: "C"
            },
            {
                id: "wip_2",
                question: "A clock shows 3:15. What is the angle between the hands of the clock?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "0°" },
                    { label: "B", value: "7.5°" },
                    { label: "C", value: "15°" },
                    { label: "D", value: "30°" }
                ],
                correctAnswer: "B"
            },
            {
                id: "wip_3",
                question: "The cost price of 20 articles is the same as the selling price of x articles. If the profit is 25%, then the value of x is:",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "15" },
                    { label: "B", value: "16" },
                    { label: "C", value: "18" },
                    { label: "D", value: "25" }
                ],
                correctAnswer: "B"
            },
            {
                id: "wip_4",
                question: "Which of the following numbers is completely divisible by 99?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "3572404" },
                    { label: "B", value: "135792" },
                    { label: "C", value: "913464" },
                    { label: "D", value: "114345" }
                ],
                correctAnswer: "D"
            }
        ]
    },
    amazon: {
        title: "Amazon Specific Questions",
        totalXP: 70,
        icon: "Building",
        color: "#f59e0b",
        description: "Previous year questions from Amazon assessments.",
        questions: [
            {
                id: "amzn_1",
                question: "A boat can travel with a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken by the boat to go 68 km downstream.",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "2 hours" },
                    { label: "B", value: "3 hours" },
                    { label: "C", value: "4 hours" },
                    { label: "D", value: "5 hours" }
                ],
                correctAnswer: "C"
            },
            {
                id: "amzn_2",
                question: "If 6 men and 8 boys can do a piece of work in 10 days while 26 men and 48 boys can do the same in 2 days, the time taken by 15 men and 20 boys in doing the same type of work will be:",
                difficulty: "hard",
                xp: 20,
                options: [
                    { label: "A", value: "4 days" },
                    { label: "B", value: "5 days" },
                    { label: "C", value: "6 days" },
                    { label: "D", value: "7 days" }
                ],
                correctAnswer: "A"
            },
            {
                id: "amzn_3",
                question: "In a certain code language, '134' means 'good and tasty', '478' means 'see good pictures' and '729' means 'pictures are faint'. Which of the following digits stands for 'see'?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "9" },
                    { label: "B", value: "2" },
                    { label: "C", value: "1" },
                    { label: "D", value: "8" }
                ],
                correctAnswer: "D"
            },
            {
                id: "amzn_4",
                question: "Two trains of equal length are running on parallel lines in the same direction at 46 km/hr and 36 km/hr. The faster train passes the slower train in 36 seconds. The length of each train is:",
                difficulty: "hard",
                xp: 20,
                options: [
                    { label: "A", value: "50 m" },
                    { label: "B", value: "72 m" },
                    { label: "C", value: "80 m" },
                    { label: "D", value: "82 m" }
                ],
                correctAnswer: "A"
            }
        ]
    },
    cognizant: {
        title: "Cognizant Specific Questions",
        totalXP: 60,
        icon: "Building",
        color: "#1d4ed8",
        description: "Previous year questions asked in Cognizant GenC assessments.",
        questions: [
            {
                id: "cog_1",
                question: "If the sum of two numbers is 55 and their H.C.F. and L.C.M. are 5 and 120 respectively, then the sum of the reciprocals of the numbers is equal to:",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "55/600" },
                    { label: "B", value: "11/120" },
                    { label: "C", value: "600/55" },
                    { label: "D", value: "120/11" }
                ],
                correctAnswer: "B"
            },
            {
                id: "cog_2",
                question: "Find the missing number in the sequence: 4, 18, ?, 100, 180, 294, 448",
                difficulty: "hard",
                xp: 20,
                options: [
                    { label: "A", value: "32" },
                    { label: "B", value: "36" },
                    { label: "C", value: "48" },
                    { label: "D", value: "40" }
                ],
                correctAnswer: "C"
            },
            {
                id: "cog_3",
                question: "In a class of 100 students, 50 play cricket, 40 play football, and 10 play both. How many students play neither cricket nor football?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "10" },
                    { label: "B", value: "20" },
                    { label: "C", value: "15" },
                    { label: "D", value: "25" }
                ],
                correctAnswer: "B"
            },
            {
                id: "cog_4",
                question: "P, Q and R can do a piece of work in 20, 30 and 60 days respectively. In how many days can P do the work if he is assisted by Q and R on every third day?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "12 days" },
                    { label: "B", value: "15 days" },
                    { label: "C", value: "16 days" },
                    { label: "D", value: "18 days" }
                ],
                correctAnswer: "B"
            }
        ]
    },
    capgemini: {
        title: "Capgemini Specific Questions",
        totalXP: 55,
        icon: "Building",
        color: "#059669",
        description: "Previous year questions asked in Capgemini placement tests.",
        questions: [
            {
                id: "cap_1",
                question: "A library has an average of 510 visitors on Sundays and 240 on other days. The average number of visitors per day in a month of 30 days beginning with a Sunday is:",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "250" },
                    { label: "B", value: "276" },
                    { label: "C", value: "280" },
                    { label: "D", value: "285" }
                ],
                correctAnswer: "D"
            },
            {
                id: "cap_2",
                question: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "7" },
                    { label: "B", value: "10" },
                    { label: "C", value: "12" },
                    { label: "D", value: "13" }
                ],
                correctAnswer: "B"
            },
            {
                id: "cap_3",
                question: "Which word does NOT belong with the others?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "parsley" },
                    { label: "B", value: "basil" },
                    { label: "C", value: "dill" },
                    { label: "D", value: "mayonnaise" }
                ],
                correctAnswer: "D"
            },
            {
                id: "cap_4",
                question: "An accurate clock shows 8 o'clock in the morning. Through how may degrees will the hour hand rotate when the clock shows 2 o'clock in the afternoon?",
                difficulty: "hard",
                xp: 20,
                options: [
                    { label: "A", value: "144°" },
                    { label: "B", value: "150°" },
                    { label: "C", value: "168°" },
                    { label: "D", value: "180°" }
                ],
                correctAnswer: "D"
            }
        ]
    }
};
