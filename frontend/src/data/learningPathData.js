// Comprehensive Learning Path Data — Formulas, Quick Methods, Shortcuts, Practice
export const LEARNING_TOPICS = [
  {
    id: 'percentages', title: 'Percentages', icon: 'Percent', color: '#f472b6',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
    description: 'Master percentages, profit/loss, discounts, and successive changes',
    estimatedTime: '2 hours',
    theory: { sections: [
        { title: 'Base Values & Changes', content: ['Always identify the "base" value. "A is what % of B" implies B is the base (A/B × 100). "A% increase" means the new value is A% more than the original (New = Old + [A/100]×Old).', 'Successive percentage changes do not simply add up. An increase of A% followed by B% results in an effective change of [A + B + (A×B)/100]%. If A=20 and B=10, the total increase is 20 + 10 + 200/100 = 32%, not 30%.'], formulas: [
          { formula: 'Percentage = (Value / Base) × 100', example: '15 of 60 = 25%' },
          { formula: 'Successive Change = A + B + (AB/100)', example: '20% + 10% = 32%' },
          { formula: 'Population after n years = P(1 ± R/100)^n', example: 'Pop=1000, 10% inc for 2 yrs = 1000(1.1)² = 1210' }
        ]},
    ]
    },
    quickMethods: [
      { id: 'pct_m1', name: 'Direct Formula (10% Building Block)', difficulty: 'Easy', timeEstimate: '10 seconds',
        problem: 'What is 15% of 240?',
        steps: ['10% of 240 = 24', '5% of 240 = 12 (half of 10%)', '15% = 10% + 5% = 24 + 12 = 36'],
        answer: '36'
      },
      { id: 'pct_m2', name: 'Fraction Conversion Method', difficulty: 'Medium', timeEstimate: '5 seconds',
        problem: '75% of 80 = ?',
        steps: ['Convert: 75% = 3/4', '3/4 × 80 = 60', 'Instant calculation!'],
        answer: '60',
        tip: 'Memorize: 25%=1/4, 33.33%=1/3, 50%=1/2, 66.66%=2/3, 75%=3/4'
      },
      { id: 'pct_m3', name: 'Successive Percentage Shortcut', difficulty: 'Easy', timeEstimate: '5 seconds',
        problem: 'Price increases 20%, then decreases 20%. Net change?',
        steps: ['Formula: a + b + (ab/100)', '= 20 + (-20) + (20×-20/100)', '= 0 - 4 = -4%'],
        answer: '4% decrease'
      }
    ],
    shortcuts: [
      { id: 'pct_s1', name: 'The 10% Trick', description: 'Any percentage via 10% building blocks',
        example: { problem: '35% of 640', solution: '10%=64 → 30%=192 → 5%=32 → 35%=224' },
        whenToUse: 'Any percentage calculation', whenNotToUse: 'When fraction method is faster (25%, 50%, 75%)'
      },
      { id: 'pct_s2', name: 'Reverse Percentage', description: 'If x% of A = y% of B, then A/B = y/x',
        example: { problem: '20% of A = 30% of B. B=400, find A', solution: 'A/400 = 30/20 = 3/2 → A = 600' },
        whenToUse: 'Comparing percentages of different totals', whenNotToUse: 'Simple single-value calculations'
      },
      { id: 'pct_s3', name: 'Percentage Change Reverse', description: 'To reverse x% increase: decrease by [x/(100+x)]×100',
        example: { problem: 'Price up 25%. Decrease% to restore?', solution: '[25/125]×100 = 20%' },
        whenToUse: 'Restoring original value after increase/decrease', whenNotToUse: 'When both changes are given'
      },
      { id: 'pct_s4', name: 'Two Successive Discounts', description: 'Single discount = a + b - (ab/100)',
        example: { problem: 'MP=1000, discounts 20% + 10%', solution: 'Single = 20+10-200/100 = 28% → SP=720' },
        whenToUse: 'Multiple successive discounts', whenNotToUse: 'Single discount problems'
      }
    ],
    practice: [
      { id:'lp_pct1', difficulty:'easy', question:'Find 18% of 250.', options:['40','45','50','55'], correct:1, timeTarget:30,
        solution:'10% of 250=25, 8% of 250=20. 18%=25+20=45', hint:'Use 10% + 8% method', shortcutRef:'The 10% Trick' },
      { id:'lp_pct2', difficulty:'easy', question:'A shirt costs ₹800. After 25% discount, selling price is?', options:['₹500','₹600','₹650','₹700'], correct:1, timeTarget:20,
        solution:'25% = 1/4. Discount = 800/4 = 200. SP = 800-200 = ₹600', hint:'25% = 1/4', shortcutRef:'Fraction Method' },
      { id:'lp_pct3', difficulty:'easy', question:'If CP is ₹400 and profit is 20%, find SP.', options:['₹460','₹480','₹500','₹520'], correct:1, timeTarget:20,
        solution:'SP = 400 × 120/100 = ₹480', hint:'SP = CP × (100+P%)/100' },
      { id:'lp_pct4', difficulty:'medium', question:'A shirt price increased by 25% then decreased by 20%. If final price is ₹600, find original.', options:['₹500','₹600','₹550','₹650'], correct:1, timeTarget:60,
        solution:'Net change = 25-20-(25×20/100) = 0%. Original = ₹600', hint:'Use successive percentage formula', shortcutRef:'Successive Percentage' },
      { id:'lp_pct5', difficulty:'medium', question:'If the price of sugar rises by 25%, by what % must consumption reduce to maintain expenditure?', options:['25%','20%','15%','30%'], correct:1, timeTarget:45,
        solution:'Reduction = [25/(100+25)]×100 = 25/125×100 = 20%', hint:'Use reverse percentage formula', shortcutRef:'Percentage Change Reverse' },
      { id:'lp_pct6', difficulty:'medium', question:'Two successive discounts of 20% and 10% equal a single discount of:', options:['30%','28%','27%','25%'], correct:1, timeTarget:30,
        solution:'Single = 20+10-(20×10/100) = 30-2 = 28%', hint:'Use successive discount formula', shortcutRef:'Two Successive Discounts' },
      { id:'lp_pct7', difficulty:'hard', question:'A shopkeeper marks up 40% above CP, gives successive discounts of 10% and 15%. If profit is ₹238, find CP.', options:['₹2800','₹3400','₹3000','₹3200'], correct:1, timeTarget:120,
        solution:'MP=1.4×CP. After 10%+15%: single disc = 10+15-150/100 = 23.5%. SP=1.4CP×0.765=1.071CP. Profit=0.071CP=238. CP=238/0.071≈₹3352. Closest ₹3400.',
        hint:'Calculate effective SP using markup and successive discounts' },
      { id:'lp_pct8', difficulty:'hard', question:'Population increases 10% first year, decreases 10% second year. Current pop is 29,700. Pop 2 years ago?', options:['30,000','29,000','28,000','31,000'], correct:0, timeTarget:60,
        solution:'P×1.1×0.9 = 29700 → P×0.99 = 29700 → P = 30,000', hint:'Successive change: +10% then -10%', shortcutRef:'Successive Percentage' },
    ]
  },
  {
    id: 'timeAndWork', title: 'Time & Work', icon: 'Hammer', color: '#fb923c',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
    description: 'Work rates, combined work, pipes & cisterns, efficiency problems',
    estimatedTime: '2.5 hours',
    theory: { sections: [
        { title: 'Rate, Efficiency & Time', content: ['Work = Rate × Time. Usually, we assume total work is 1 piece of work. If A can complete the work in X days, A\'s rate is 1/X of the work per day.', 'Efficiency is inversely proportional to time.'], formulas: [
          { formula: 'Work = Rate × Time', example: 'Rate=1/10, Time=10 → Work=1 (complete)' },
          { formula: 'Together = (ab)/(a+b)', example: 'A=10, B=15 → 150/25 = 6 days' },
        ]},
        { title: 'Chain Rule & Negative Work', content: ['Chain Rule: (M₁D₁H₁)/W₁ = (M₂D₂H₂)/W₂. Very useful for variable group sizes.', 'Pipes & Cisterns: Outlets perform negative work. Assign negative rates to leaks or drains.'], formulas: [
          { formula: 'M₁D₁H₁ / W₁ = M₂D₂H₂ / W₂', example: '10 men × 5 days = 25 men × D days → D=2' },
          { formula: 'Net rate = Inlet(+1/a) + Outlet(-1/b)', example: 'Fill 4h, Empty 6h → Net = 1/4 - 1/6 = 1/12' },
        ]},
    ]
    },
    quickMethods: [
      { id: 'tw_m1', name: 'LCM Method (Best for Multiple Workers)', difficulty: 'Easy', timeEstimate: '15 seconds',
        problem: 'A completes in 10 days, B in 15 days. Together?',
        steps: ['LCM(10,15) = 30 units total work', 'A rate = 30/10 = 3 units/day', 'B rate = 30/15 = 2 units/day', 'Combined = 5 units/day', 'Time = 30/5 = 6 days'],
        answer: '6 days', tip: 'LCM method eliminates fractions — always faster!'
      },
      { id: 'tw_m2', name: 'Direct Formula (2 Workers)', difficulty: 'Easy', timeEstimate: '5 seconds',
        problem: 'A=10 days, B=15 days. Together?',
        steps: ['Formula: Time = (a×b)/(a+b)', '= (10×15)/(10+15)', '= 150/25 = 6 days'],
        answer: '6 days'
      },
      { id: 'tw_m3', name: 'Part-Work Method', difficulty: 'Medium', timeEstimate: '30 seconds',
        problem: 'A and B work 3 days together, then A finishes remaining in 5 days. B alone = 15 days. Find A.',
        steps: ["B's 3 days = 3/15 = 1/5", 'Remaining = 4/5 done by A in 5 days', "A's rate = (4/5)/5 = 4/25", 'A alone = 25/4 = 6.25 days'],
        answer: '6.25 days'
      }
    ],
    shortcuts: [
      { id: 'tw_s1', name: 'Ratio Method', description: 'If efficiency ratio m:n and B takes t days → A = t×(n/m)',
        example: { problem: 'A:B efficiency = 3:2, B=20 days', solution: 'A = 20×(2/3) = 13.33 days' },
        whenToUse: 'Efficiency ratios given', whenNotToUse: 'Direct time values given'
      },
      { id: 'tw_s2', name: 'Alternate Day Work', description: 'Count complete 2-day cycles first, then remaining',
        example: { problem: 'A=10d, B=15d, alternate starting A', solution: '2-day cycle = 1/10+1/15 = 1/6. 5 cycles (10 days) = 5/6. Remaining 1/6 by A in 10/6 ≈ 1.67d. Total ≈ 11.67 days' },
        whenToUse: 'Alternate day problems', whenNotToUse: 'Simultaneous work problems'
      },
      { id: 'tw_s3', name: 'Efficiency Percentage', description: 'A is x% more efficient → Time(A) = Time(B)×100/(100+x)',
        example: { problem: 'A 25% more efficient, B=15 days', solution: 'A = 15×100/125 = 12 days' },
        whenToUse: 'Efficiency comparison given in %', whenNotToUse: 'Direct rates given'
      },
      { id: 'tw_s4', name: 'Work & Wages', description: 'Wages proportional to work done (rate × time)',
        example: { problem: 'A:B:C work ratio = 2:3:4, total ₹900', solution: 'A=900×2/9=₹200, B=₹300, C=₹400' },
        whenToUse: 'Wage distribution problems', whenNotToUse: 'Pure time/work problems'
      }
    ],
    practice: [
      { id:'lp_tw1', difficulty:'easy', question:'A can do work in 15 days, B in 20 days. Together they finish in:', options:['8 4/7 days','9 days','7.5 days','10 days'], correct:0, timeTarget:30,
        solution:'Combined = 1/15+1/20 = 7/60. Time = 60/7 = 8 4/7 days', hint:'Use formula ab/(a+b)', shortcutRef:'Direct Formula' },
      { id:'lp_tw2', difficulty:'easy', question:'A and B together do a job in 12 days. A alone in 20 days. B alone takes:', options:['25 days','30 days','28 days','35 days'], correct:1, timeTarget:30,
        solution:'B rate = 1/12 - 1/20 = 2/60 = 1/30. B = 30 days', hint:'Subtract rates' },
      { id:'lp_tw3', difficulty:'easy', question:'20 men finish work in 15 days. Men needed for 10 days:', options:['25','30','28','35'], correct:1, timeTarget:20,
        solution:'Man-days = 300. For 10 days: 300/10 = 30 men', hint:'Man-days constant', shortcutRef:'Man-Days' },
      { id:'lp_tw4', difficulty:'medium', question:'A pipe fills in 6 hours, another empties in 8 hours. Both open, tank fills in:', options:['20 hrs','24 hrs','18 hrs','12 hrs'], correct:1, timeTarget:45,
        solution:'Net = 1/6 - 1/8 = 1/24. Time = 24 hours', hint:'Filling rate minus emptying rate' },
      { id:'lp_tw5', difficulty:'medium', question:'A works twice as fast as B. Together in 12 days. A alone takes:', options:['18 days','15 days','20 days','24 days'], correct:0, timeTarget:60,
        solution:'A=2x, B=x. 3x=1/12, x=1/36. A=2/36=1/18 → 18 days', hint:'Set up efficiency ratio' },
      { id:'lp_tw6', difficulty:'hard', question:'Two pipes fill in 20 and 30 min. Outlet empties in 15 min. All open, fills in:', options:['60 min','45 min','30 min','Never'], correct:0, timeTarget:90,
        solution:'Rate = 1/20+1/30-1/15 = 3/60+2/60-4/60 = 1/60. Time = 60 min', hint:'Sum all rates (inlets positive, outlets negative)' },
    ]
  },
  {
    id: 'timeSpeedDistance', title: 'Time, Speed & Distance', icon: 'Timer', color: '#818cf8',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    description: 'Speed calculations, trains, boats & streams, relative speed',
    estimatedTime: '2.5 hours',
    theory: { sections: [
        { title: 'Fundamentals & Average Speed', content: ['Distance = Speed × Time. When distance is constant, speed and time are inversely proportional. Always ensure units match (e.g., km/hr with hours, m/s with seconds). To convert km/hr to m/s, multiply by 5/18.', 'Average speed is NOT the average of speeds. Average Speed = Total Distance / Total Time. If a person covers two equal distances at speeds S1 and S2, the average speed is 2*S1*S2/(S1+S2).'], formulas: [
          { formula: 'Distance = Speed × Time', example: '60 km/hr for 2 hours = 120 km' },
          { formula: 'Average Speed = Total Distance / Total Time', example: 'Travel 100km in 2h, then 100km in 3h → avg = 200/5 = 40 km/h' },
          { formula: 'Conversion: km/hr to m/s', example: 'Multiply by 5/18' }
        ]},
        { title: 'Relative Speed & Trains', content: ['When two objects move in the SAME direction, their relative speed is the DIFFERENCE of their speeds (|S1 - S2|). When moving in OPPOSITE directions, their relative speed is the SUM of their speeds (S1 + S2).', 'For train crossing problems, the total distance covered is the sum of the lengths of the objects. If a train of length L passes a platform of length P, distance = L + P. If it passes a pole, distance = L.'], formulas: [
          { formula: 'Relative Speed (Same Dir) = |S1 - S2|', example: 'Car at 80 chases at 50 → relative = 30' },
          { formula: 'Relative Speed (Opposite) = S1 + S2', example: 'Trains at 60 and 40 approach → relative = 100' },
        ]},
    ]
    },
    quickMethods: [
      { id: 'tsd_m1', name: 'Unit Conversion Trick', difficulty: 'Easy', timeEstimate: '3 seconds',
        problem: 'Convert 54 km/hr to m/s',
        steps: ['Multiply by 5/18', '54 × 5/18 = 15 m/s'],
        answer: '15 m/s', tip: '×5/18 for km/hr→m/s, ×18/5 for m/s→km/hr'
      },
      { id: 'tsd_m2', name: 'Average Speed Formula', difficulty: 'Easy', timeEstimate: '5 seconds',
        problem: 'Goes at 40 km/hr, returns at 60 km/hr. Average speed?',
        steps: ['WRONG: (40+60)/2 = 50 ❌', 'CORRECT: 2xy/(x+y) = 2×40×60/(40+60)', '= 4800/100 = 48 km/hr ✓'],
        answer: '48 km/hr', tip: 'Never average speeds directly when distances are equal!'
      },
      { id: 'tsd_m3', name: 'Train Crossing Calculation', difficulty: 'Medium', timeEstimate: '20 seconds',
        problem: '100m train at 72 km/hr, 80m train at 54 km/hr (opposite). Time to cross?',
        steps: ['Convert: 72 km/hr = 20 m/s, 54 km/hr = 15 m/s', 'Total distance = 100+80 = 180m', 'Relative speed = 20+15 = 35 m/s', 'Time = 180/35 ≈ 5.14 seconds'],
        answer: '≈ 5.14 seconds', tip: 'Always convert to m/s for train problems!'
      }
    ],
    shortcuts: [
      { id: 'tsd_s1', name: 'Train Crossing Quick', description: 'Total length / Combined speed (convert to m/s first)',
        example: { problem: '200m+300m trains, 72 & 36 km/hr same direction', solution: 'Relative=36km/hr=10m/s. 500/10=50 sec' },
        whenToUse: 'All train problems', whenNotToUse: 'N/A — always applicable'
      },
      { id: 'tsd_s2', name: 'Boats Golden Rule', description: 'If down:up time = a:b → Boat:Stream = (a+b):(b-a)',
        example: { problem: 'Down 2 hrs, Up 3 hrs', solution: 'Boat:Stream = 5:1' },
        whenToUse: 'Time ratios for upstream/downstream given', whenNotToUse: 'Speed values directly given'
      },
      { id: 'tsd_s3', name: 'Head Start Formula', description: 'Lead distance / Relative speed = Time to catch',
        example: { problem: 'A gives B 100m start in 1km. A=10m/s, B=9m/s', solution: 'Time = 100/(10-9) = 100s. A finishes (1000m), B at 900m' },
        whenToUse: 'Race/chase problems with head start', whenNotToUse: 'Same starting point problems'
      },
      { id: 'tsd_s4', name: 'Average Speed Cases', description: 'Equal distances → 2xy/(x+y). Equal times → (x+y)/2',
        example: { problem: 'Equal dist at 40 & 60', solution: '2×40×60/100 = 48 km/hr (NOT 50!)' },
        whenToUse: 'Any average speed problem', whenNotToUse: 'N/A — identify the case first'
      }
    ],
    practice: [
      { id:'lp_tsd1', difficulty:'easy', question:'A car travels 180 km in 3 hours. Speed is:', options:['50 km/hr','60 km/hr','70 km/hr','80 km/hr'], correct:1, timeTarget:15,
        solution:'Speed = 180/3 = 60 km/hr', hint:'Speed = Distance/Time' },
      { id:'lp_tsd2', difficulty:'easy', question:'A train 150m long passes a pole in 15 seconds. Speed in km/hr:', options:['36','40','32','45'], correct:0, timeTarget:30,
        solution:'Speed = 150/15 = 10 m/s = 10×18/5 = 36 km/hr', hint:'Convert m/s to km/hr', shortcutRef:'Unit Conversion' },
      { id:'lp_tsd3', difficulty:'easy', question:'A car goes at 40 km/hr and returns at 60 km/hr. Average speed:', options:['50','48','45','52'], correct:1, timeTarget:30,
        solution:'2×40×60/(40+60) = 4800/100 = 48 km/hr', hint:'Equal distances → use harmonic mean', shortcutRef:'Average Speed Formula' },
      { id:'lp_tsd4', difficulty:'medium', question:'Two trains 200m and 300m at 72 & 36 km/hr same direction. Time to cross:', options:['50 sec','40 sec','45 sec','60 sec'], correct:0, timeTarget:60,
        solution:'Relative = 36km/hr = 10m/s. Distance = 500m. Time = 50 sec', hint:'Same direction → subtract speeds' },
      { id:'lp_tsd5', difficulty:'medium', question:'Boat goes 12 km upstream in 48 min, downstream in 36 min. Stream speed:', options:['2 km/hr','2.5 km/hr','3 km/hr','1.5 km/hr'], correct:1, timeTarget:60,
        solution:'Up=15 km/hr, Down=20 km/hr. Stream=(20-15)/2=2.5', hint:'Find both speeds first, then (D-U)/2' },
      { id:'lp_tsd6', difficulty:'hard', question:'A man rows 40 km upstream in 8 hrs, 36 km downstream in 6 hrs. Speed in still water:', options:['5.5 km/hr','5 km/hr','6 km/hr','4.5 km/hr'], correct:0, timeTarget:60,
        solution:'Up=5, Down=6. Still=(5+6)/2 = 5.5 km/hr', hint:'Still water = average of upstream and downstream speeds' },
    ]
  },
  {
    id: 'numberSystems', title: 'Number Systems', icon: 'Hash', color: '#22d3ee',
    gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
    description: 'HCF, LCM, divisibility, prime numbers, remainders',
    estimatedTime: '2 hours',
    theory: { sections: [
        { title: 'Classifications & Divisibility', content: ['Numbers are classified into Reals, Rationals, Primes, and Composites. Two numbers are Co-Prime if their HCF is 1 (they share no common factors).', 'Divisibility rules speed up calculations. For 3 and 9, sum the digits. For 4, check the last 2 digits. For 8, the last 3. For 11, the sum of odd-placed digits minus sum of even-placed digits must be 0 or a multiple of 11.'], formulas: [
          { formula: 'Sum of first n naturals = n(n+1)/2', example: 'Sum of 1 to 10 = 10(11)/2 = 55' },
          { formula: 'Divisibility by 11: |Sum(odd places) - Sum(even places)|', example: '1331: (1+3)-(3+1) = 0 (divisible)' },
        ]},
        { title: 'LCM, HCF & Remainders', content: ['For any two numbers A and B: LCM(A, B) × HCF(A, B) = A × B. The HCF of fractions is HCF(numerators)/LCM(denominators).', 'To find the unit digit of large powers (like 2^45), divide the exponent by 4 (the cyclicity of 2, 3, 7, 8). The remainder gives the effective power. Remainder 1 -> 2^1=2.'], formulas: [
          { formula: 'LCM × HCF = Product of Numbers', example: 'LCM(12,15)=60, HCF=3 → 12×15=180=60×3' },
          { formula: 'Cyclicity of 2, 3, 7, 8 is 4', example: 'Unit digit of 2^7 = 2^(remainder of 7/4) = 2^3 = 8' },
        ]},
    ]
    },
    quickMethods: [
      { id:'ns_m1', name:'Prime factorization for HCF/LCM', difficulty:'Easy', timeEstimate:'15 seconds',
        problem:'Find HCF and LCM of 36 and 84',
        steps:['36 = 2²×3²', '84 = 2²×3×7', 'HCF = 2²×3 = 12', 'LCM = 2²×3²×7 = 252'], answer:'HCF=12, LCM=252' },
      { id:'ns_m2', name:'Unit digit by cycle', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Unit digit of 7^253?', steps:['Cycle of 7: 7,9,3,1 (length 4)','253 mod 4 = 1','Unit digit = 7'], answer:'7' },
      { id:'ns_m3', name:'LCM for bells/events', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Bells toll at 9,12,15 min intervals. Together at 8AM. Next?',
        steps:['LCM(9,12,15) = 180 min = 3 hrs','8AM + 3hrs = 11AM'], answer:'11 AM' },
    ],
    shortcuts: [
      { id:'ns_s1', name:'Product = HCF × LCM', description:'For two numbers, product always equals HCF × LCM',
        example:{ problem:'LCM=360, HCF=12, one number=60. Other?', solution:'60×x = 12×360 → x=72' },
        whenToUse:'Two numbers with HCF/LCM given', whenNotToUse:'More than 2 numbers' },
      { id:'ns_s2', name:'Unit Digit Cycles', description:'Powers of 2,3,7,8 cycle every 4; 4,9 cycle every 2',
        example:{ problem:'Unit digit of 3^75', solution:'75 mod 4 = 3. Cycle: 3,9,7,1. Answer: 7' },
        whenToUse:'Finding unit digits of powers', whenNotToUse:'Full number calculation needed' },
      { id:'ns_s3', name:'Divisibility Quick Check', description:'Break number into parts for quick divisibility testing',
        example:{ problem:'Is 7248 divisible by 8?', solution:'Last 3 digits: 248 ÷ 8 = 31. Yes!' },
        whenToUse:'Checking divisibility', whenNotToUse:'Finding exact quotient' },
      { id:'ns_s4', name:'Remainder Theorem', description:'Remainder of product = product of remainders (mod n)',
        example:{ problem:'47 × 53 mod 5', solution:'(2 × 3) mod 5 = 6 mod 5 = 1' },
        whenToUse:'Finding remainders of large expressions', whenNotToUse:'Small numbers (direct division faster)' },
    ],
    practice: [
      { id:'lp_ns1', difficulty:'easy', question:'Find HCF of 36, 84 and 120.', options:['6','12','18','24'], correct:1, timeTarget:45, solution:'36=2²×3², 84=2²×3×7, 120=2³×3×5. HCF=2²×3=12', hint:'Prime factorize each number' },
      { id:'lp_ns2', difficulty:'easy', question:'LCM of two numbers is 360, HCF is 12. If one is 60, other is:', options:['72','60','48','84'], correct:0, timeTarget:30, solution:'LCM×HCF = Product. 360×12=60×x → x=72', hint:'Product = HCF × LCM', shortcutRef:'Product = HCF × LCM' },
      { id:'lp_ns3', difficulty:'easy', question:'Unit digit of 7^253:', options:['1','3','7','9'], correct:2, timeTarget:20, solution:'Cycle: 7,9,3,1. 253 mod 4 = 1. Unit digit = 7', hint:'Find power mod 4', shortcutRef:'Unit Digit Cycles' },
      { id:'lp_ns4', difficulty:'medium', question:'Largest 4-digit number divisible by 88:', options:['9944','9956','9988','9968'], correct:0, timeTarget:45, solution:'9999 ÷ 88 = 113.6. 113×88 = 9944', hint:'Divide 9999 by 88, take floor' },
      { id:'lp_ns5', difficulty:'medium', question:'How many primes between 50 and 100?', options:['8','10','12','9'], correct:1, timeTarget:60, solution:'53,59,61,67,71,73,79,83,89,97 = 10', hint:'Check each odd number for primality' },
      { id:'lp_ns6', difficulty:'hard', question:'Remainder when 2^256 is divided by 17:', options:['0','1','2','16'], correct:1, timeTarget:90, solution:'By Fermat: 2^16≡1(mod 17). 256=16×16. 2^256=(2^16)^16≡1', hint:"Use Fermat's Little Theorem" },
    ]
  },
  {
    id: 'ratioAndProportion', title: 'Ratio & Proportion', icon: 'Scale', color: '#34d399',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    description: 'Ratios, direct/inverse proportion, partnerships',
    estimatedTime: '1.5 hours',
    theory: { sections: [
      { title: 'Core Ratios', content: ['A ratio compares the relative sizes of two or more quantities. It is fundamental to understand that a ratio does not give absolute values, but rather the relationship between them. For instance, if A and B are in the ratio 2:3, A could be 20 and B could be 30, or A could be 200 and B could be 300.', 'The most important skill in ratio problems is "equalizing" ratios that share a common term. If you know A:B and B:C, you must find the Least Common Multiple (LCM) of the two values representing B to express A, B, and C in a single, combined ratio.'], formulas: [
        { formula: 'a:b and b:c → a:b:c (equalize common term)', example: 'A:B=2:3, B:C=4:5 → A:B:C = 8:12:15' },
        { formula: 'Compound ratio of a:b and c:d = ac:bd', example: '2:3 and 4:5 → 8:15' },
        { formula: 'Duplicate ratio of a:b = a²:b²', example: 'Dup of 3:4 = 9:16' },
      ]},
      { title: 'Proportion', content: ['A proportion exists when two ratios are equal (a:b = c:d). Direct proportion means as one quantity increases, the other increases at the same rate. Inverse proportion means as one increases, the other decreases (e.g., more workers = less time to finish a job).', 'In inverse proportion problems, always use the product equivalence: a1 × b1 = a2 × b2. This simple rule is the foundation for almost all "Time and Work" group-efficiency questions.'], formulas: [
        { formula: 'Direct: a₁/b₁ = a₂/b₂', example: 'If 5 pens cost ₹50, 8 pens = ₹80' },
        { formula: 'Inverse: a₁ × b₁ = a₂ × b₂', example: '15 workers×48 hrs = x workers×30 hrs → x=24' },
      ]},
    ]},
    quickMethods: [
      { id:'rp_m1', name:'LCM Method for Combining Ratios', difficulty:'Easy', timeEstimate:'15 seconds',
        problem:'A:B=2:3 and B:C=4:5. Find A:B:C',
        steps:['B is common: LCM(3,4)=12','A:B = 8:12, B:C = 12:15','A:B:C = 8:12:15'], answer:'8:12:15' },
      { id:'rp_m2', name:'Inverse Proportion Shortcut', difficulty:'Easy', timeEstimate:'5 seconds',
        problem:'15 workers build wall in 48 hours. Workers for 30 hours?',
        steps:['Workers × Hours = constant','15×48 = x×30','x = 720/30 = 24'], answer:'24 workers' },
      { id:'rp_m3', name:'Distribution by Ratio', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Divide ₹720 in ratio 2:3:4',
        steps:['Total parts = 2+3+4 = 9','Each part = 720/9 = ₹80','Shares: ₹160, ₹240, ₹320'], answer:'₹160, ₹240, ₹320' },
    ],
    shortcuts: [
      { id:'rp_s1', name:'Equalize Common Term', description:'Use LCM to make common term equal across ratios',
        example:{ problem:'A:B=3:4, B:C=5:7', solution:'LCM(4,5)=20. A:B=15:20, B:C=20:28. A:B:C=15:20:28' },
        whenToUse:'Combining two ratios with common element', whenNotToUse:'Single ratio problems' },
      { id:'rp_s2', name:'Partnership Ratio', description:'Profit share = Capital × Time ratio',
        example:{ problem:'A invests ₹5000 for 12 months, B ₹6000 for 10 months', solution:'A:B = 5000×12:6000×10 = 60:60 = 1:1' },
        whenToUse:'Business partnership problems', whenNotToUse:'Simple division problems' },
      { id:'rp_s3', name:'Componendo-Dividendo', description:'If a/b = c/d → (a+b)/(a-b) = (c+d)/(c-d)',
        example:{ problem:'(x+y)/(x-y) = 7/3. Find x:y', solution:'By C-D: x/y = (7+3)/(7-3) = 10/4 = 5:2' },
        whenToUse:'Ratio equations with sums and differences', whenNotToUse:'Simple ratio problems' },
      { id:'rp_s4', name:'Milk & Water Ratio', description:'After removal and replacement, ratio changes predictably',
        example:{ problem:'60L milk, 6L removed & replaced with water, 3 times', solution:'Milk = 60×(54/60)³ = 60×0.729 = 43.74L' },
        whenToUse:'Repeated replacement problems', whenNotToUse:'Simple mixing problems' },
    ],
    practice: [
      { id:'lp_rp1', difficulty:'easy', question:'If A:B=2:3 and B:C=4:5, find A:B:C:', options:['8:12:15','2:3:5','4:6:5','6:9:10'], correct:0, timeTarget:30, solution:'A:B=8:12, B:C=12:15. A:B:C=8:12:15', hint:'Equalize B using LCM' },
      { id:'lp_rp2', difficulty:'easy', question:'15 workers build wall in 48 hours. Workers needed for 30 hours:', options:['18','20','24','22'], correct:2, timeTarget:20, solution:'15×48=x×30 → x=24', hint:'Inverse proportion' },
      { id:'lp_rp3', difficulty:'medium', question:'Divide ₹4830 among A,B,C. After reducing by ₹5,₹10,₹15 ratio is 3:4:5. B share:', options:['₹1600','₹1610','₹1620','₹1590'], correct:1, timeTarget:60, solution:'After reduction total=4800. B=4/12×4800=1600. B share=1600+10=₹1610', hint:'Subtract reductions first' },
      { id:'lp_rp4', difficulty:'hard', question:'Milk:water in 3 vessels is 3:1, 5:3, 5:7. Mixed equally, milk:water ratio:', options:['65:55','11:9','13:7','55:65'], correct:0, timeTarget:90, solution:'Milk per vessel: 3/4, 5/8, 5/12. Sum = 45+37.5+25/60 = 107.5. Water = 72.5. ≈ 65:55', hint:'Find milk fraction in each vessel' },
    ]
  },
  {
    id: 'averages', title: 'Averages', icon: 'Calculator', color: '#a78bfa',
    gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
    description: 'Simple average, weighted average, age problems',
    estimatedTime: '1.5 hours',
    theory: { sections: [
        { title: 'Foundations & Deviations', content: ['Average = Sum of all items / Number of items. If the average of N items is A, their total sum is N × A. If every item in a set is increased by k, the new average also increases by k.', 'The Deviation method is often faster: ASSUME an average, calculate how much each number deviates from it, and balance out these deviations. The true average is your assumed average plus (net deviation / N).'], formulas: [
          { formula: 'Sum = Average × Count', example: 'Avg of 5 numbers is 20 → Sum = 100' },
          { formula: 'New Avg (item added) = Old Avg + (Value - Old Avg)/New Count', example: 'Avg is 20 for 5. Add 26. New = 20 + (26-20)/6 = 21' },
        ]},
        { title: 'Weighted Averages', content: ['When merging two groups with different averages, use the Weighted Average formula: (N₁A₁ + N₂A₂) / (N₁ + N₂). This is essentially finding the total sum of both groups and dividing by the total count.', 'Mixture and Alligation is a reversed form of weighted average, used specifically to find the ratio N₁:N₂ given the group averages.'], formulas: [
          { formula: 'Weighted Average = (w₁x₁ + w₂x₂) / (w₁ + w₂)', example: 'Mix 2kg of $10 and 3kg of $20 → (20+60)/5 = $16' },
        ]},
    ]
    },
    quickMethods: [
      { id:'av_m1', name:'Deviation Method', difficulty:'Medium', timeEstimate:'15 seconds',
        problem:'Average of 78, 82, 75, 85, 80',
        steps:['Assume avg = 80','Deviations: -2, +2, -5, +5, 0','Sum = 0, so avg = 80+0 = 80'], answer:'80', tip:'Pick middle value as assumed mean' },
      { id:'av_m2', name:'Sum Difference Method', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Avg of 8 persons is 25. Two join, avg becomes 26. Avg age of newcomers?',
        steps:['Old sum = 200, New sum = 260','Newcomers sum = 60','Avg = 60/2 = 30'], answer:'30' },
      { id:'av_m3', name:'Natural Numbers Shortcut', difficulty:'Easy', timeEstimate:'3 seconds',
        problem:'Average of first 50 natural numbers?',
        steps:['Formula: (n+1)/2','= (50+1)/2 = 25.5'], answer:'25.5' },
    ],
    shortcuts: [
      { id:'av_s1', name:'Cricket Batting Average', description:'Runs needed = (Target avg) × (n+1) - Current sum',
        example:{ problem:'Avg 48 in 12 innings. Score for avg 50 in 13th?', solution:'Need: 50×13 - 48×12 = 650-576 = 74' },
        whenToUse:'Target average problems', whenNotToUse:'Simple average calculation' },
      { id:'av_s2', name:'Overlapping Groups', description:'When item is counted twice: double-counted = sum of parts - total',
        example:{ problem:'11 results avg 50, first 6 avg 49, last 6 avg 52. 6th result?', solution:'294+312-550 = 56' },
        whenToUse:'Overlapping group averages', whenNotToUse:'Non-overlapping groups' },
      { id:'av_s3', name:'Age Ratio Trick', description:'Use ratio and age difference equation',
        example:{ problem:'A:B age = 5:4, after 8 yrs = 6:5. A now?', solution:'(5x+8)/(4x+8)=6/5 → x=8 → A=40' },
        whenToUse:'Age problems with ratios', whenNotToUse:'Direct age calculations' },
      { id:'av_s4', name:'Deviation Method', description:'Assume a mean, work with deviations only',
        example:{ problem:'Avg of 47,52,48,53,50', solution:'Assume 50. Dev: -3,+2,-2,+3,0. Sum=0. Avg=50' },
        whenToUse:'Numbers close to each other', whenNotToUse:'Widely spread numbers' },
    ],
    practice: [
      { id:'lp_av1', difficulty:'easy', question:'Average of first 50 natural numbers:', options:['25','25.5','26','50'], correct:1, timeTarget:15, solution:'(50+1)/2 = 25.5', hint:'Formula: (n+1)/2' },
      { id:'lp_av2', difficulty:'easy', question:'Avg of 8 persons is 25. Two join, avg 26. Newcomers avg:', options:['30','32','28','35'], correct:0, timeTarget:30, solution:'Old sum=200, New sum=260. Two new=60. Avg=30', hint:'Find sum difference' },
      { id:'lp_av3', difficulty:'easy', question:'Batsman avg 48 in 12 innings. Score for avg 50 in 13th:', options:['72','70','74','76'], correct:2, timeTarget:30, solution:'50×13 - 48×12 = 650-576 = 74', hint:'Target sum - current sum' },
      { id:'lp_av4', difficulty:'medium', question:'A,B,C avg weight 45kg. A&B avg 40, B&C avg 43. B weighs:', options:['31','35','37','27'], correct:0, timeTarget:45, solution:'A+B+C=135, A+B=80, B+C=86. B=80+86-135=31', hint:'Add sub-group sums, subtract total' },
      { id:'lp_av5', difficulty:'medium', question:'A:B age ratio 5:4. After 8 years 6:5. A present age:', options:['40','35','45','50'], correct:0, timeTarget:45, solution:'(5x+8)/(4x+8)=6/5 → 25x+40=24x+48 → x=8 → A=40', hint:'Set up ratio equation' },
    ]
  },
  {
    id: 'simpleCompoundInterest', title: 'Simple & Compound Interest', icon: 'Coins', color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    description: 'SI, CI, difference between SI and CI, installments',
    estimatedTime: '2 hours',
    theory: { sections: [
        { title: 'Simple & Compound Foundations', content: ['Simple Interest (SI) is calculated only on the principal amount. It grows linearly. CI is calculated on the accumulated amount (Principal + previous Interest). It grows exponentially.', 'For the first year (or first compounding period), SI and CI are exactly the same. After that, CI outpaces SI because you earn "interest on your interest".'], formulas: [
          { formula: 'Simple Interest (SI) = P * R * T / 100', example: 'P=1000, R=10%, T=2 → SI=200' },
          { formula: 'Compound Interest Amount = P * (1 + R/100)^n', example: 'P=1000, R=10%, T=2 → A=1000(1.1)² = 1210' },
        ]},
        { title: 'Difference Formulas & Installments', content: ['The difference between CI and SI for 2 years is purely the interest earned on the 1st year\'s interest. Formula: Diff = P(R/100)². For 3 years, Diff = P(R/100)² * (3 + R/100).', 'If compounding happens half-yearly, halve the rate (R/2) and double the time periods (2T).'], formulas: [
          { formula: 'CI - SI difference (2 years) = P(R/100)²', example: 'P=1000, R=10% → Diff = 1000 * (0.1)² = 10' },
          { formula: 'Half-yearly Compounding: Rate=R/2, Time=2T', example: '10% annually for 1 year → 5% for 2 periods' },
        ]},
    ]
    },
    quickMethods: [
      { id:'si_m1', name:'SI Direct Calculation', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Find SI on ₹8000 at 12% for 3 years',
        steps:['SI = 8000 × 12 × 3 / 100','= 8000 × 36/100','= ₹2880'], answer:'₹2880' },
      { id:'si_m2', name:'CI-SI Difference for 2 Years', difficulty:'Easy', timeEstimate:'5 seconds',
        problem:'Difference between CI and SI for ₹5000 at 10% for 2 years?',
        steps:['Diff = P × (R/100)²','= 5000 × (0.1)²','= 5000 × 0.01 = ₹50'], answer:'₹50', tip:'This shortcut works ONLY for 2 years!' },
      { id:'si_m3', name:'Doubling Time Rule of 72', difficulty:'Easy', timeEstimate:'3 seconds',
        problem:'At 8% CI, money doubles in approximately?',
        steps:['Rule of 72: Years ≈ 72/Rate','= 72/8 = 9 years'], answer:'≈ 9 years' },
    ],
    shortcuts: [
      { id:'si_s1', name:'CI-SI Difference (2yr)', description:'Difference = P(R/100)² for 2 years',
        example:{ problem:'P=₹10000, R=5%, 2 years', solution:'Diff = 10000×(5/100)² = ₹25' },
        whenToUse:'2-year CI vs SI comparison', whenNotToUse:'3+ years (formula changes)' },
      { id:'si_s2', name:'Rule of 72', description:'Doubling time ≈ 72/R for compound interest',
        example:{ problem:'At 12% CI, doubles in?', solution:'72/12 = 6 years' },
        whenToUse:'Quick doubling time estimate', whenNotToUse:'Exact calculation needed' },
      { id:'si_s3', name:'Equal Installments', description:'Each installment = Total / [(1+r) + (1+r)² + ...]',
        example:{ problem:'₹2000 at 10% in 2 annual installments', solution:'x/1.1 + x/1.21 = 2000 → x ≈ ₹1152.38' },
        whenToUse:'EMI/installment problems', whenNotToUse:'Lump sum problems' },
      { id:'si_s4', name:'Population Growth', description:'Same as CI: P(1+R/100)^T for growth, P(1-R/100)^T for decay',
        example:{ problem:'Pop 50000, grows 10%/yr, after 2 yrs?', solution:'50000×1.1²= 60500' },
        whenToUse:'Growth/depreciation problems', whenNotToUse:'Linear growth (use SI)' },
    ],
    practice: [
      { id:'lp_si1', difficulty:'easy', question:'SI on ₹5000 at 8% for 3 years:', options:['₹1200','₹1400','₹1000','₹1600'], correct:0, timeTarget:20, solution:'5000×8×3/100 = 1200', hint:'SI = PRT/100' },
      { id:'lp_si2', difficulty:'easy', question:'Sum amounts to ₹6600 in 2 years at 10% SI. Principal:', options:['₹5000','₹5500','₹6000','₹4800'], correct:1, timeTarget:30, solution:'6600 = P(1+0.2) = 1.2P → P=5500', hint:'A = P(1+RT/100)' },
      { id:'lp_si3', difficulty:'medium', question:'CI on ₹10000 at 10% for 2 years:', options:['₹2000','₹2100','₹2200','₹1900'], correct:1, timeTarget:30, solution:'A=10000×1.1²=12100. CI=2100', hint:'A=P(1+R/100)^T' },
      { id:'lp_si4', difficulty:'medium', question:'Difference between CI and SI on ₹8000 at 5% for 2 years:', options:['₹10','₹15','₹20','₹25'], correct:2, timeTarget:20, solution:'Diff = 8000×(5/100)² = 8000×0.0025 = ₹20', hint:'Diff = P(R/100)²', shortcutRef:'CI-SI Difference' },
      { id:'lp_si5', difficulty:'hard', question:'At CI, sum becomes ₹2420 in 2 years and ₹2662 in 3 years. Rate:', options:['8%','10%','12%','15%'], correct:1, timeTarget:60, solution:'Rate = (2662-2420)/2420 × 100 = 242/2420 × 100 = 10%', hint:'3rd year interest / 2nd year amount' },
    ]
  },
  {
    id: 'mixturesAlligations', title: 'Mixtures & Alligations', icon: 'Beaker', color: '#fb7185',
    gradient: 'linear-gradient(135deg, #fb7185, #f43f5e)',
    description: 'Mixing solutions, alligation rule, repeated dilution',
    estimatedTime: '1.5 hours',
    theory: { sections: [
        { title: 'Alligation Rule', content: ['Alligation is a shortcut to solve weighted average problems. If you mix two quantities of prices A and B to get a mixture of price M, the ratio in which they were mixed is (B - M) : (M - A).', 'Always ensure the units are identical! Never mix a Cost Price with a Selling Price. Convert SP to CP first if dealing with profits.'], formulas: [
          { formula: 'Alligation Ratio = (Cheaper diff) : (Dearer diff)', example: 'Mix 10 and 20 to get 14. Ratio = (20-14):(14-10) = 6:4 = 3:2' },
        ]},
        { title: 'Repeated Dilution (Replacement)', content: ['When a container has purely liquid A, and you repeatedly remove Vol V and replace it with water N times, the final amount of liquid A is given by an exponential decay formula.', 'Final Vol = Initial Vol × (1 - Removed/Total)ⁿ. This works because each replacement dilutes the original liquid by the same fraction.'], formulas: [
          { formula: 'Final Amount = Initial × (1 - Replacement_Vol / Total_Vol)^n', example: '100L pure wine. Replace 10L twice. Final = 100 × (1 - 10/100)² = 81L' },
        ]},
    ]
    },
    quickMethods: [
      { id:'ma_m1', name:'Alligation Cross Method', difficulty:'Easy', timeEstimate:'15 seconds',
        problem:'Mix ₹40/kg rice with ₹60/kg rice to get ₹45/kg. Ratio?',
        steps:['Cheaper=40, Dearer=60, Mean=45','Ratio = (60-45):(45-40) = 15:5 = 3:1'], answer:'3:1', tip:'Draw the cross diagram for clarity' },
      { id:'ma_m2', name:'Repeated Replacement', difficulty:'Medium', timeEstimate:'15 seconds',
        problem:'20L milk, 4L replaced with water 3 times. Milk remaining?',
        steps:['Fraction remaining each time = (20-4)/20 = 4/5','After 3 times: 20 × (4/5)³','= 20 × 64/125 = 10.24L'], answer:'10.24 L' },
      { id:'ma_m3', name:'Simple Mixing', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Mix 5L of 20% solution with 10L of 50% solution. Concentration?',
        steps:['Total solute = 5×0.2 + 10×0.5 = 1+5 = 6','Total volume = 15L','Concentration = 6/15 = 40%'], answer:'40%' },
    ],
    shortcuts: [
      { id:'ma_s1', name:'Alligation Cross', description:'Draw cross: (d-m):(m-c) gives ratio of cheaper:dearer',
        example:{ problem:'Wine at ₹38 & ₹46/L for ₹40/L mix', solution:'(46-40):(40-38) = 6:2 = 3:1' },
        whenToUse:'Mixing two items at different prices/concentrations', whenNotToUse:'More than 2 components' },
      { id:'ma_s2', name:'Replacement Formula', description:'After n replacements of x from V: Original × (1-x/V)^n',
        example:{ problem:'40L milk, 8L replaced 2 times', solution:'Milk = 40×(32/40)²= 40×0.64 = 25.6L' },
        whenToUse:'Repeated removal and replacement', whenNotToUse:'Simple one-time mixing' },
      { id:'ma_s3', name:'Weighted Average', description:'Avg = (n₁×a₁ + n₂×a₂)/(n₁+n₂)',
        example:{ problem:'20 boys avg 60, 30 girls avg 70. Combined avg?', solution:'(20×60+30×70)/50 = 2700/50 = 66' },
        whenToUse:'Combining groups with different averages', whenNotToUse:'Equal group sizes (simple avg works)' },
    ],
    practice: [
      { id:'lp_ma1', difficulty:'easy', question:'Mix ₹40/kg and ₹60/kg rice for ₹45/kg. Ratio:', options:['3:1','2:1','1:3','1:2'], correct:0, timeTarget:30, solution:'(60-45):(45-40) = 15:5 = 3:1', hint:'Use alligation cross' },
      { id:'lp_ma2', difficulty:'easy', question:'Mix 5L of 30% with 10L of 60% acid. Concentration:', options:['45%','50%','40%','55%'], correct:1, timeTarget:30, solution:'(1.5+6)/15 = 7.5/15 = 50%', hint:'Total solute / Total volume' },
      { id:'lp_ma3', difficulty:'medium', question:'20L milk, 4L replaced with water twice. Milk remaining:', options:['12.8L','14L','13.2L','11.5L'], correct:0, timeTarget:45, solution:'20×(16/20)² = 20×0.64 = 12.8L', hint:'Use (1-x/V)^n formula' },
      { id:'lp_ma4', difficulty:'medium', question:'A vessel has 60L milk. 12L removed and replaced with water. Done 3 times. Milk left:', options:['30.72L','32L','28.5L','35L'], correct:0, timeTarget:60, solution:'60×(48/60)³ = 60×0.512 = 30.72L', hint:'Repeated replacement', shortcutRef:'Replacement Formula' },
      { id:'lp_ma5', difficulty:'hard', question:'How many kg of ₹25/kg rice mix with 35kg of ₹40/kg for ₹30/kg?', options:['35kg','42kg','28kg','21kg'], correct:2, timeTarget:60, solution:'Ratio = (40-30):(30-25) = 10:5 = 2:1. Cheaper = 35×2/2.5 ≈ 28', hint:'Find ratio then calculate' },
    ]
  },
  {
    id: 'algebra', title: 'Algebra', icon: 'Variable', color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    description: 'Linear equations, quadratics, progressions (AP/GP)',
    estimatedTime: '2.5 hours',
    theory: { sections: [
        { title: 'Identities & Expansions', content: ['Algebraic identities are the bedrock of quick manipulation. Master the basic expansions: (a±b)², (a±b)³, a²-b², and a³±b³.', 'Many competitive questions mask these identities by asking for x + 1/x given x² + 1/x². Remember that (x + 1/x)² = x² + 1/x² + 2.'], formulas: [
          { formula: '(a+b)² = a² + b² + 2ab', example: 'Can be used to find x²+1/x² = (x+1/x)² - 2' },
          { formula: 'a² - b² = (a - b)(a + b)', example: 'Difference of squares' },
          { formula: 'a³ + b³ = (a+b)(a² - ab + b²)', example: 'Sum of cubes' },
        ]},
        { title: 'Quadratics & Roots', content: ['A quadratic equation ax² + bx + c = 0 has at most two real roots. The nature of these roots depends on the discriminant D = b² - 4ac. If D>0, real/distinct. If D=0, real/equal. If D<0, complex.', 'The sum of roots is -b/a. The product of roots is c/a.'], formulas: [
          { formula: 'Sum of roots (α + β) = -b/a', example: 'x² - 5x + 6 = 0 → Sum = 5' },
          { formula: 'Product of roots (αβ) = c/a', example: 'x² - 5x + 6 = 0 → Product = 6' },
        ]},
    ]
    },
    quickMethods: [
      { id:'al_m1', name:'Factorization Method', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Solve x² - 7x + 12 = 0',
        steps:['Find factors of 12 that sum to 7','3 × 4 = 12, 3 + 4 = 7','(x-3)(x-4) = 0','x = 3 or 4'], answer:'x = 3, 4', tip:'Always try factorization before formula!' },
      { id:'al_m2', name:'AP Sum Shortcut', difficulty:'Easy', timeEstimate:'5 seconds',
        problem:'Sum of first 20 terms of AP: 3, 7, 11...',
        steps:['a=3, d=4, n=20','S = 20/2 × [2×3 + 19×4]','= 10 × [6+76] = 820'], answer:'820' },
      { id:'al_m3', name:'Product of Roots', difficulty:'Easy', timeEstimate:'3 seconds',
        problem:'If roots of x²+5x+k=0 are 2 and 3. Find k.',
        steps:['Product of roots = c/a','2×3 = k/1','k = 6'], answer:'k = 6', tip:'But sum should be -5/1=-5, so roots must be -2,-3 → k=6 ✓' },
    ],
    shortcuts: [
      { id:'al_s1', name:'Sum/Product of Roots', description:'For ax²+bx+c=0: sum=-b/a, product=c/a',
        example:{ problem:'x²-8x+15=0. Sum & product of roots?', solution:'Sum=8, Product=15. Roots: 3,5' },
        whenToUse:'Finding relationship between roots', whenNotToUse:'When actual roots needed' },
      { id:'al_s2', name:'AP Middle Term', description:'Average of AP = middle term = (first+last)/2',
        example:{ problem:'AP: 3,7,11,...,39. Average?', solution:'(3+39)/2 = 21' },
        whenToUse:'Finding average of AP', whenNotToUse:'Non-AP sequences' },
      { id:'al_s3', name:'GP Infinite Sum', description:'For |r|<1: S∞ = a/(1-r)',
        example:{ problem:'1 + 1/2 + 1/4 + ...', solution:'S = 1/(1-0.5) = 2' },
        whenToUse:'Infinite geometric series with |r|<1', whenNotToUse:'|r|≥1 (diverges)' },
    ],
    practice: [
      { id:'lp_al1', difficulty:'easy', question:'Solve: x² - 5x + 6 = 0', options:['1,6','2,3','-2,-3','3,4'], correct:1, timeTarget:20, solution:'(x-2)(x-3)=0 → x=2,3', hint:'Find two numbers: product=6, sum=5' },
      { id:'lp_al2', difficulty:'easy', question:'Sum of first 10 terms of AP: 5, 8, 11...', options:['185','175','195','165'], correct:0, timeTarget:30, solution:'S=10/2×[2×5+9×3]=5×[10+27]=185', hint:'S=n/2×[2a+(n-1)d]' },
      { id:'lp_al3', difficulty:'easy', question:'5th term of GP: 3, 6, 12...', options:['48','36','96','24'], correct:0, timeTarget:20, solution:'a₅=3×2⁴=3×16=48', hint:'aₙ=a×r^(n-1)' },
      { id:'lp_al4', difficulty:'medium', question:'If sum of roots of 2x²+kx+6=0 is 5, find k:', options:['-10','10','-5','5'], correct:0, timeTarget:30, solution:'Sum = -k/2 = 5 → k = -10', hint:'Sum = -b/a', shortcutRef:'Sum/Product of Roots' },
      { id:'lp_al5', difficulty:'hard', question:'Sum of infinite GP: 4, 2, 1, 1/2...', options:['8','6','10','7'], correct:0, timeTarget:30, solution:'a=4, r=1/2. S=4/(1-0.5)=8', hint:'S=a/(1-r) for |r|<1', shortcutRef:'GP Infinite Sum' },
    ]
  },
  {
    id: 'geometry', title: 'Geometry & Mensuration', icon: 'Shapes', color: '#c084fc',
    gradient: 'linear-gradient(135deg, #c084fc, #a855f7)',
    description: 'Areas, volumes, triangles, circles, coordinate geometry',
    estimatedTime: '2.5 hours',
    theory: { sections: [
        { title: 'Triangles', content: ['A polygon with 3 sides. The sum of interior angles is 180°. In a right triangle, use Pythagoras: a² + b² = c².', 'Similarity: If two triangles are similar, the ratio of their areas is the square of the ratio of their corresponding sides.'], formulas: [
          { formula: 'Pythagorean Theorem: a² + b² = c²', example: 'Sides 3,4 → Hypotenuse 5' },
          { formula: 'Area = 1/2 × base × height', example: 'Base 10, Height 5 → Area = 25' },
        ]},
        { title: 'Circles & Polygons', content: ['For circles, the angle subtended by an arc at the center is double the angle subtended at the circumference. Angles in the same segment are equal.', 'For regular polygons of N sides, the sum of interior angles is (N-2)×180°. Each interior angle is (N-2)×180° / N.'], formulas: [
          { formula: 'Area of Circle = πr²', example: 'Radius 7 → Area ≈ (22/7)×49 = 154' },
          { formula: 'Sum of interior angles = (N-2)×180°', example: 'Hexagon (N=6): 4×180 = 720°' },
        ]},
    ]
    },
    quickMethods: [
      { id:'ge_m1', name:'30-60-90 Triangle Ratios', difficulty:'Easy', timeEstimate:'5 seconds',
        problem:'In a 30-60-90 triangle, hypotenuse=10. Find sides.',
        steps:['Ratio → 1 : √3 : 2','Hyp=10 → short=5, long=5√3≈8.66'], answer:'5, 5√3, 10' },
      { id:'ge_m2', name:'Pythagorean Triplets', difficulty:'Easy', timeEstimate:'3 seconds',
        problem:'Right triangle with legs 5 and 12. Hypotenuse?',
        steps:['Known triplet: 5-12-13','No calculation needed!'], answer:'13', tip:'Common triplets: 3-4-5, 5-12-13, 8-15-17, 7-24-25' },
      { id:'ge_m3', name:'Sector Area', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Sector angle 60°, radius 21cm. Area?',
        steps:['Sector area = (θ/360) × πr²','= (60/360) × 22/7 × 441','= 1/6 × 1386 = 231 cm²'], answer:'231 cm²' },
    ],
    shortcuts: [
      { id:'ge_s1', name:'Equilateral Triangle', description:'Area = (√3/4)×a², Height = (√3/2)×a',
        example:{ problem:'Equilateral triangle side=6', solution:'Area = (√3/4)×36 = 9√3 ≈ 15.58' },
        whenToUse:'All equilateral triangle problems', whenNotToUse:'Scalene/isoceles triangles' },
      { id:'ge_s2', name:'Diagonal of Square/Rectangle', description:'Square: d=a√2, Rectangle: d=√(l²+b²)',
        example:{ problem:'Square side=10', solution:'Diagonal = 10√2 ≈ 14.14' },
        whenToUse:'Finding diagonals', whenNotToUse:'When diagonals are given' },
      { id:'ge_s3', name:'Ring Area', description:'Area between two concentric circles = π(R²-r²)',
        example:{ problem:'R=14, r=7', solution:'π(196-49) = 147π ≈ 462 cm²' },
        whenToUse:'Annular/ring regions', whenNotToUse:'Single circle problems' },
    ],
    practice: [
      { id:'lp_ge1', difficulty:'easy', question:'Area of equilateral triangle with side 8cm:', options:['16√3','32√3','24√3','12√3'], correct:0, timeTarget:20, solution:'(√3/4)×64 = 16√3', hint:'Use (√3/4)×a²' },
      { id:'lp_ge2', difficulty:'easy', question:'Circumference of circle with radius 14cm:', options:['88cm','44cm','66cm','132cm'], correct:0, timeTarget:15, solution:'2×22/7×14 = 88cm', hint:'C = 2πr' },
      { id:'lp_ge3', difficulty:'easy', question:'Volume of cube with side 5cm:', options:['125cm³','100cm³','150cm³','75cm³'], correct:0, timeTarget:10, solution:'5³ = 125', hint:'V = a³' },
      { id:'lp_ge4', difficulty:'medium', question:'A cylinder has r=7cm, h=10cm. Volume:', options:['1540cm³','1440cm³','1386cm³','1210cm³'], correct:0, timeTarget:30, solution:'22/7×49×10 = 1540', hint:'V = πr²h' },
      { id:'lp_ge5', difficulty:'hard', question:'A cone has slant height 25cm and radius 7cm. Volume:', options:['1232cm³','1540cm³','1386cm³','1024cm³'], correct:0, timeTarget:60, solution:'h=√(625-49)=24. V=1/3×22/7×49×24=1232', hint:'Find height from slant and radius first' },
    ]
  },
  {
    id: 'probabilityCombinatorics', title: 'Probability & Combinatorics', icon: 'Dice', color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    description: 'Permutations, combinations, probability, events',
    estimatedTime: '2 hours',
    theory: { sections: [
        { title: 'Permutations & Combinations', content: ['Permutations are for ARRANGEMENTS (order matters). Combinations are for SELECTIONS (order does not matter). Determine whether the problem cares about order before choosing nPr or nCr.', 'The fundamental counting principle: If action A can be done in M ways and action B in N ways, both can be done in M×N ways if they are independent.'], formulas: [
          { formula: 'nCr (Choosing) = n! / (r! × (n-r)!)', example: '5C2 = 5! / (2! 3!) = 10' },
          { formula: 'nPr (Arranging) = n! / (n-r)!', example: '5P2 = 5! / 3! = 20' },
        ]},
        { title: 'Probability Basics', content: ['Probability = (Favorable Outcomes) / (Total Possible Outcomes). It always ranges from 0 (impossible) to 1 (certain).', 'For independent events, P(A AND B) = P(A) × P(B). For OR events, use the union formula: P(A OR B) = P(A) + P(B) - P(A AND B).'], formulas: [
          { formula: 'P(Event) = Favorable / Total', example: 'Rolling a 4 on a die = 1/6' },
          { formula: 'P(A OR B) = P(A) + P(B) - P(A AND B)', example: 'Mutually exclusive: P(A AND B)=0' },
        ]},
    ]
    },
    quickMethods: [
      { id:'pc_m1', name:'Committee Selection', difficulty:'Easy', timeEstimate:'15 seconds',
        problem:'From 6 men and 4 women, select committee of 3 men and 2 women',
        steps:['Men: 6C3 = 20','Women: 4C2 = 6','Total = 20 × 6 = 120'], answer:'120 ways' },
      { id:'pc_m2', name:'At Least One Probability', difficulty:'Medium', timeEstimate:'10 seconds',
        problem:'3 coins tossed. P(at least 1 head)?',
        steps:['P(none) = P(TTT) = (1/2)³ = 1/8','P(at least 1) = 1 - 1/8 = 7/8'], answer:'7/8', tip:'P(at least 1) = 1 - P(none) is always faster!' },
      { id:'pc_m3', name:'Arrangement with Repetition', difficulty:'Medium', timeEstimate:'10 seconds',
        problem:'Arrangements of MISSISSIPPI?',
        steps:['11 letters: M=1, I=4, S=4, P=2','= 11!/(4!×4!×2!)','= 34650'], answer:'34650' },
    ],
    shortcuts: [
      { id:'pc_s1', name:'Complementary Probability', description:'P(at least 1) = 1 - P(none)',
        example:{ problem:'P(at least 1 six in 3 rolls)', solution:'1 - (5/6)³ = 1 - 125/216 = 91/216' },
        whenToUse:'"At least one" problems', whenNotToUse:'Exact count needed' },
      { id:'pc_s2', name:'Circular Permutation', description:'Arrange n items in circle = (n-1)!',
        example:{ problem:'8 people around round table', solution:'(8-1)! = 7! = 5040' },
        whenToUse:'Circular arrangements', whenNotToUse:'Linear arrangements' },
      { id:'pc_s3', name:'Cards Probability', description:'Standard deck: 52 cards, 4 suits × 13 ranks',
        example:{ problem:'P(drawing 2 aces from 52 cards)', solution:'4C2/52C2 = 6/1326 = 1/221' },
        whenToUse:'Card problems', whenNotToUse:'Dice/coin problems' },
    ],
    practice: [
      { id:'lp_pc1', difficulty:'easy', question:'In how many ways can 5 books be arranged on a shelf?', options:['60','120','24','720'], correct:1, timeTarget:10, solution:'5! = 120', hint:'Permutation: n!' },
      { id:'lp_pc2', difficulty:'easy', question:'From 8 players, select team of 5. Ways:', options:['56','40','336','120'], correct:0, timeTarget:20, solution:'8C5 = 8C3 = 56', hint:'Combination: nCr' },
      { id:'lp_pc3', difficulty:'easy', question:'P(getting a sum of 7 with 2 dice):', options:['1/6','5/36','7/36','1/3'], correct:0, timeTarget:30, solution:'Favorable: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) = 6. P=6/36=1/6', hint:'Count favorable outcomes' },
      { id:'lp_pc4', difficulty:'medium', question:'P(at least one head in 4 coin tosses):', options:['15/16','7/8','3/4','1/2'], correct:0, timeTarget:20, solution:'1-(1/2)⁴ = 1-1/16 = 15/16', hint:'Use 1-P(none)', shortcutRef:'Complementary Probability' },
      { id:'lp_pc5', difficulty:'hard', question:'5 men and 4 women. Committee of 3 men and 2 women:', options:['60','36','90','120'], correct:0, timeTarget:45, solution:'5C3 × 4C2 = 10 × 6 = 60', hint:'Multiply independent selections' },
    ]
  },
  {
    id: 'dataInterpretation', title: 'Data Interpretation', icon: 'BarChart', color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    description: 'Tables, bar charts, pie charts, line graphs, caselets',
    estimatedTime: '2 hours',
    theory: { sections: [
        { title: 'Visual & Tabular Data', content: ['DI tests your ability to extract meaning from Charts (Pie, Bar, Line) and Tables. The key is to approximate early and only calculate precisely if the multiple-choice options are extremely close to each other.', 'Always scan the units before calculating (e.g., "in thousands", "in millions"). Read the axes carefully.'], formulas: [
          { formula: 'Growth Rate = (Final - Initial) / Initial × 100', example: 'Sales from 50k to 60k → 20% growth' },
        ]},
        { title: 'Angles in Pie Charts', content: ['A full pie chart is 360°, representing 100% of the data. Thus, 1% corresponds to 3.6°. If a sector is given as an angle, convert it to percentage by dividing by 360 and multiplying by 100.', 'Example: A 90° sector is 90/360 = 1/4 of the total data (25%).'], formulas: [
          { formula: 'Sector % = (Angle / 360°) × 100', example: '72° sector = 72/360 = 1/5 = 20%' },
        ]},
    ]
    },
    quickMethods: [
      { id:'di_m1', name:'Quick Percentage Calculation', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'What is 347 out of 1200 as a percentage?',
        steps:['347/1200 ≈ 350/1200','= 35/120 ≈ 29.2%'], answer:'≈ 28.9%', tip:'Round numbers for speed, then adjust' },
      { id:'di_m2', name:'Pie Chart Degree to Value', difficulty:'Easy', timeEstimate:'5 seconds',
        problem:'Total = ₹7200, sector = 72°. Value?',
        steps:['Value = (72/360) × 7200','= 1/5 × 7200 = ₹1440'], answer:'₹1440' },
      { id:'di_m3', name:'Year-on-Year Growth', difficulty:'Easy', timeEstimate:'10 seconds',
        problem:'Sales: 2020=500, 2021=600, 2022=750. Growth 2021-22?',
        steps:['Change = 750-600 = 150','Growth = 150/600 × 100 = 25%'], answer:'25%' },
    ],
    shortcuts: [
      { id:'di_s1', name:'Fraction Benchmarks', description:'Memorize: 1/3=33%, 1/4=25%, 1/5=20%, 1/6=17%, 1/7=14%, 1/8=12.5%',
        example:{ problem:'Estimate 312/1560', solution:'312/1560 = 1/5 = 20%' },
        whenToUse:'Quick estimation in DI sets', whenNotToUse:'Exact answers needed' },
      { id:'di_s2', name:'CAGR Estimation', description:'Compound growth rate ≈ (total growth ÷ years) for small rates',
        example:{ problem:'100→121 in 2 years', solution:'21/2 ≈ 10.5%. Exact: √1.21-1 = 10%' },
        whenToUse:'Estimating compound growth', whenNotToUse:'Large growth rates' },
      { id:'di_s3', name:'Pie to Percentage', description:'Sector degree ÷ 3.6 = percentage',
        example:{ problem:'108° sector = ?%', solution:'108/3.6 = 30%' },
        whenToUse:'Converting pie chart angles', whenNotToUse:'Other chart types' },
    ],
    practice: [
      { id:'lp_di1', difficulty:'easy', question:'If a pie chart sector is 90°, what percentage does it represent?', options:['20%','25%','30%','15%'], correct:1, timeTarget:10, solution:'90/360 × 100 = 25%', hint:'Divide by 3.6' },
      { id:'lp_di2', difficulty:'easy', question:'Sales grew from 400 to 500. Percentage growth:', options:['20%','25%','15%','30%'], correct:1, timeTarget:15, solution:'(100/400)×100 = 25%', hint:'Change/Original × 100' },
      { id:'lp_di3', difficulty:'medium', question:'In a pie chart (total ₹36000), 40° sector value:', options:['₹4000','₹3600','₹5000','₹4500'], correct:0, timeTarget:20, solution:'(40/360)×36000 = ₹4000', hint:'Value = (angle/360) × total' },
      { id:'lp_di4', difficulty:'medium', question:'Approximate: 4891/(49.8×10.2) ≈', options:['9.6','10.2','8.5','11.1'], correct:0, timeTarget:30, solution:'≈ 4900/(50×10) = 4900/500 = 9.8 ≈ 9.6 (adjusted)', hint:'Round all numbers first' },
      { id:'lp_di5', difficulty:'hard', question:'Population grows from 50000 to 72000 in 2 years (compound). Annual growth rate:', options:['20%','18%','15%','22%'], correct:0, timeTarget:60, solution:'50000×(1+r)²=72000 → (1+r)²=1.44 → r=0.2=20%', hint:'Set up compound growth equation' },
    ]
  },
];

export const getTopicById = (id) => LEARNING_TOPICS.find(t => t.id === id);
export const getTopicIds = () => LEARNING_TOPICS.map(t => t.id);
