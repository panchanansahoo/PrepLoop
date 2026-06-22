// Verbal Ability Questions — ~50 problems
export const verbalQuestions = {
  sentenceCorrection: {
    title: "Sentence Correction",
    icon: "SpellCheck",
    color: "#f97316",
    description: "Grammar error identification and correction",
    questions: [
      { id:"vc_1", question:"Choose the correct sentence:", difficulty:"easy", xp:10, timeLimit:60, options:[{label:"A",value:"He don't know nothing about it."},{label:"B",value:"He doesn't know anything about it."},{label:"C",value:"He don't know anything about it."},{label:"D",value:"He doesn't knows anything about it."}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Doesn't' with third person singular. 'Anything' not 'nothing' (double negative)." },
      { id:"vc_2", question:"Select the grammatically correct sentence:", difficulty:"medium", xp:15, timeLimit:60, options:[{label:"A",value:"Neither the teacher nor the students was present."},{label:"B",value:"Neither the teacher nor the students were present."},{label:"C",value:"Neither the teacher nor the students is present."},{label:"D",value:"Neither the teacher nor students are present."}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"With 'neither...nor', verb agrees with the nearer subject (students → were)." },
      { id:"vc_3", question:"Identify the error: 'Each of the boys have completed their assignment on time.'", difficulty:"medium", xp:15, timeLimit:60, options:[{label:"A",value:"Each of"},{label:"B",value:"have completed"},{label:"C",value:"their assignment"},{label:"D",value:"on time"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Each' is singular, so it should be 'has completed'." },
      { id:"vc_4", question:"Choose the correct option: 'The committee ____ divided in their opinions.'", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"is"},{label:"B",value:"are"},{label:"C",value:"was"},{label:"D",value:"were"}], correctAnswer:"D", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"When committee members act individually (divided opinions), plural verb 'were' is used." },
      { id:"vc_5", question:"Select correct: She is one of those girls who _____ always punctual.", difficulty:"hard", xp:20, timeLimit:90, options:[{label:"A",value:"is"},{label:"B",value:"are"},{label:"C",value:"was"},{label:"D",value:"has been"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Who' refers to 'girls' (plural), so 'are' is correct." },
      { id:"vc_6", question:"Spot the error: 'The sceneries of Kashmir are enchanting.'", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"The"},{label:"B",value:"sceneries"},{label:"C",value:"of Kashmir"},{label:"D",value:"are enchanting"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Scenery' is uncountable. Cannot be pluralized. Correct: 'The scenery of Kashmir is enchanting.'" },
    ]
  },
  fillInBlanks: {
    title: "Fill in the Blanks",
    icon: "TextCursorInput",
    color: "#a78bfa",
    description: "Context-based vocabulary and grammar fill-ins",
    questions: [
      { id:"fb_1", question:"He was too ____ to ask for help even when he needed it most.", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"proud"},{label:"B",value:"week"},{label:"C",value:"strong"},{label:"D",value:"happy"}], correctAnswer:"A", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Too proud to ask' — pride prevented asking for help." },
      { id:"fb_2", question:"The new policy has been ____ implemented across all departments.", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"uniformly"},{label:"B",value:"uniform"},{label:"C",value:"uniformity"},{label:"D",value:"uniformed"}], correctAnswer:"A", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Adverb 'uniformly' modifies the verb 'implemented'." },
      { id:"fb_3", question:"The teacher's ____ explanation made the complex topic easy to understand.", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"elusive"},{label:"B",value:"lucid"},{label:"C",value:"ambiguous"},{label:"D",value:"obscure"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Lucid' means clear and easy to understand." },
      { id:"fb_4", question:"The politician tried to ____ the issue by giving vague answers.", difficulty:"medium", xp:15, timeLimit:60, options:[{label:"A",value:"illuminate"},{label:"B",value:"obfuscate"},{label:"C",value:"clarify"},{label:"D",value:"resolve"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Obfuscate' means to make unclear or difficult to understand." },
      { id:"fb_5", question:"Despite his ____ efforts, he could not complete the project on time.", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"futile"},{label:"B",value:"strenuous"},{label:"C",value:"lethargic"},{label:"D",value:"casual"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Strenuous' (vigorous) effort implies he tried hard but still couldn't finish." },
    ]
  },
  synonymsAntonyms: {
    title: "Synonyms & Antonyms",
    icon: "ArrowLeftRight",
    color: "#14b8a6",
    description: "Vocabulary — meanings and opposites",
    questions: [
      { id:"sa_v1", question:"Synonym of 'Ephemeral':", difficulty:"medium", xp:15, timeLimit:30, options:[{label:"A",value:"Permanent"},{label:"B",value:"Transient"},{label:"C",value:"Eternal"},{label:"D",value:"Lasting"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Ephemeral = short-lived, transient." },
      { id:"sa_v2", question:"Antonym of 'Gregarious':", difficulty:"medium", xp:15, timeLimit:30, options:[{label:"A",value:"Sociable"},{label:"B",value:"Friendly"},{label:"C",value:"Reclusive"},{label:"D",value:"Outgoing"}], correctAnswer:"C", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Gregarious = sociable. Reclusive = avoiding people." },
      { id:"sa_v3", question:"Synonym of 'Ubiquitous':", difficulty:"medium", xp:15, timeLimit:30, options:[{label:"A",value:"Rare"},{label:"B",value:"Omnipresent"},{label:"C",value:"Hidden"},{label:"D",value:"Scarce"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Ubiquitous = present everywhere = omnipresent." },
      { id:"sa_v4", question:"Antonym of 'Benevolent':", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"Kind"},{label:"B",value:"Generous"},{label:"C",value:"Malevolent"},{label:"D",value:"Charitable"}], correctAnswer:"C", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Benevolent = kind, well-meaning. Malevolent = wishing harm." },
      { id:"sa_v5", question:"Synonym of 'Pragmatic':", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"Idealistic"},{label:"B",value:"Practical"},{label:"C",value:"Theoretical"},{label:"D",value:"Dreamy"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Pragmatic = dealing with things in a practical way." },
      { id:"sa_v6", question:"Antonym of 'Verbose':", difficulty:"medium", xp:15, timeLimit:30, options:[{label:"A",value:"Wordy"},{label:"B",value:"Concise"},{label:"C",value:"Loquacious"},{label:"D",value:"Talkative"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Verbose = using too many words. Concise = brief and clear." },
    ]
  },
  readingComprehension: {
    title: "Reading Comprehension",
    icon: "BookOpen",
    color: "#818cf8",
    description: "Short and long passage comprehension",
    questions: [
      { id:"rc_1", question:"Passage: 'Artificial intelligence is transforming healthcare by enabling faster diagnosis, personalized treatment plans, and predictive analytics. However, concerns about data privacy and the replacement of human judgment remain significant challenges.'\n\nThe passage primarily discusses:", difficulty:"easy", xp:10, timeLimit:90, options:[{label:"A",value:"Only benefits of AI in healthcare"},{label:"B",value:"Only concerns about AI"},{label:"C",value:"Both benefits and challenges of AI in healthcare"},{label:"D",value:"Data privacy issues exclusively"}], correctAnswer:"C", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"The passage mentions benefits (diagnosis, treatment, analytics) AND challenges (privacy, human judgment)." },
      { id:"rc_2", question:"Passage: 'The Industrial Revolution, beginning in the late 18th century, fundamentally changed manufacturing processes. The shift from hand production methods to machines transformed not just industry, but society itself, leading to urbanization and new social classes.'\n\nAccording to the passage, the Industrial Revolution:", difficulty:"easy", xp:10, timeLimit:90, options:[{label:"A",value:"Only affected manufacturing"},{label:"B",value:"Had broader social impacts beyond manufacturing"},{label:"C",value:"Began in the 19th century"},{label:"D",value:"Reduced urbanization"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Passage states it 'transformed not just industry, but society itself'." },
      { id:"rc_3", question:"Passage: 'Despite decades of research, climate scientists still face challenges in predicting the exact timing and magnitude of climate change effects. The complexity of Earth's climate system, with its numerous feedback loops and variables, makes precise forecasting extremely difficult.'\n\nThe main reason for difficulty in climate prediction is:", difficulty:"medium", xp:15, timeLimit:90, options:[{label:"A",value:"Lack of research funding"},{label:"B",value:"Insufficient technology"},{label:"C",value:"Complexity of the climate system"},{label:"D",value:"Scientists disagree on methods"}], correctAnswer:"C", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"The passage explicitly states 'complexity of Earth's climate system' with feedback loops and variables." },
      { id:"rc_4", question:"Passage: 'Remote work has shown that productivity can be maintained or even increased outside traditional office settings. Nevertheless, many companies are pushing for return-to-office, citing concerns about collaboration, mentorship, and company culture.'\n\nThe passage suggests that:", difficulty:"medium", xp:15, timeLimit:90, options:[{label:"A",value:"Remote work always increases productivity"},{label:"B",value:"Companies unanimously support remote work"},{label:"C",value:"There is tension between productivity evidence and company preferences"},{label:"D",value:"Office work is always better"}], correctAnswer:"C", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"The passage presents contrasting views: productivity evidence vs. company push for return." },
    ]
  },
  paraJumbles: {
    title: "Para Jumbles",
    icon: "Shuffle",
    color: "#f472b6",
    description: "Sentence rearrangement to form coherent paragraphs",
    questions: [
      { id:"pj_1", question:"Arrange in order:\nP. He went to the market.\nQ. He bought vegetables and fruits.\nR. He cooked a delicious meal.\nS. He returned home.", difficulty:"easy", xp:10, timeLimit:60, options:[{label:"A",value:"PQSR"},{label:"B",value:"PQRS"},{label:"C",value:"PSQR"},{label:"D",value:"PRQS"}], correctAnswer:"A", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Logical sequence: Went to market → Bought items → Returned home → Cooked meal. PQSR." },
      { id:"pj_2", question:"Arrange in order:\nP. The results were announced.\nQ. Students prepared for months.\nR. The exam was conducted nationwide.\nS. Toppers were felicitated.", difficulty:"easy", xp:10, timeLimit:60, options:[{label:"A",value:"QRPS"},{label:"B",value:"RQPS"},{label:"C",value:"QPRS"},{label:"D",value:"PQRS"}], correctAnswer:"A", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Sequence: Preparation → Exam → Results → Felicitation. QRPS." },
      { id:"pj_3", question:"Arrange:\nP. But technology also brings challenges.\nQ. Technology has transformed modern education.\nR. Online learning platforms offer unprecedented access.\nS. Digital divide and screen fatigue remain concerns.", difficulty:"medium", xp:15, timeLimit:90, options:[{label:"A",value:"QRPS"},{label:"B",value:"RPQS"},{label:"C",value:"QPRS"},{label:"D",value:"RQSP"}], correctAnswer:"A", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"Opening statement → Benefit → 'But' transition → Specific challenges. QRPS." },
    ]
  },
  idiomsPhrases: {
    title: "Idioms & Phrases",
    icon: "Quote",
    color: "#facc15",
    description: "Common expressions and their meanings",
    questions: [
      { id:"ip_1", question:"'Break the ice' means:", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"Destroy something"},{label:"B",value:"Start a conversation in a social setting"},{label:"C",value:"Break frozen water"},{label:"D",value:"End a relationship"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"'Break the ice' means to initiate conversation and relieve tension." },
      { id:"ip_2", question:"'Burning the midnight oil' means:", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"Wasting resources"},{label:"B",value:"Working or studying late into the night"},{label:"C",value:"Starting a fire"},{label:"D",value:"Being angry"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"It means working late at night." },
      { id:"ip_3", question:"'A blessing in disguise' means:", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"A hidden curse"},{label:"B",value:"Something that seems bad but turns out good"},{label:"C",value:"A religious ceremony"},{label:"D",value:"Something fake"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"An apparent misfortune that has good results." },
      { id:"ip_4", question:"'To hit the nail on the head' means:", difficulty:"easy", xp:10, timeLimit:30, options:[{label:"A",value:"To do carpentry work"},{label:"B",value:"To say exactly the right thing"},{label:"C",value:"To hurt someone"},{label:"D",value:"To make a mistake"}], correctAnswer:"B", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"To describe exactly what is causing a situation or problem." },
      { id:"ip_5", question:"'Bite the bullet' means:", difficulty:"medium", xp:15, timeLimit:30, options:[{label:"A",value:"Eat something hard"},{label:"B",value:"Be aggressive"},{label:"C",value:"Endure a painful experience bravely"},{label:"D",value:"Shoot a gun"}], correctAnswer:"C", theory: "This question evaluates your grasp of grammatical rules, vocabulary comprehension, and logical sentence structuring. A strong theoretical understanding here ensures clear and effective professional communication.",
      explanation:"To face a difficult situation with courage." },
    ]
  }
};
