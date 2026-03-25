import re
import json

filepath = r"c:\Users\panch\Desktop\Preploop\frontend\src\data\learningPathData.js"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

expanded_theories = {
    'percentages': """theory: { sections: [
        { title: 'Base Values & Changes', content: ['Always identify the "base" value. "A is what % of B" implies B is the base (A/B × 100). "A% increase" means the new value is A% more than the original (New = Old + [A/100]×Old).', 'Successive percentage changes do not simply add up. An increase of A% followed by B% results in an effective change of [A + B + (A×B)/100]%. If A=20 and B=10, the total increase is 20 + 10 + 200/100 = 32%, not 30%.'], formulas: [
          { formula: 'Percentage = (Value / Base) × 100', example: '15 of 60 = 25%' },
          { formula: 'Successive Change = A + B + (AB/100)', example: '20% + 10% = 32%' },
          { formula: 'Population after n years = P(1 ± R/100)^n', example: 'Pop=1000, 10% inc for 2 yrs = 1000(1.1)² = 1210' }
        ]},
    ]
    }""",

    'timeAndWork': """theory: { sections: [
        { title: 'Rate, Efficiency & Time', content: ['Work = Rate × Time. Usually, we assume total work is 1 piece of work. If A can complete the work in X days, A\\'s rate is 1/X of the work per day.', 'Efficiency is inversely proportional to time.'], formulas: [
          { formula: 'Work = Rate × Time', example: 'Rate=1/10, Time=10 → Work=1 (complete)' },
          { formula: 'Together = (ab)/(a+b)', example: 'A=10, B=15 → 150/25 = 6 days' },
        ]},
        { title: 'Chain Rule & Negative Work', content: ['Chain Rule: (M₁D₁H₁)/W₁ = (M₂D₂H₂)/W₂. Very useful for variable group sizes.', 'Pipes & Cisterns: Outlets perform negative work. Assign negative rates to leaks or drains.'], formulas: [
          { formula: 'M₁D₁H₁ / W₁ = M₂D₂H₂ / W₂', example: '10 men × 5 days = 25 men × D days → D=2' },
          { formula: 'Net rate = Inlet(+1/a) + Outlet(-1/b)', example: 'Fill 4h, Empty 6h → Net = 1/4 - 1/6 = 1/12' },
        ]},
    ]
    }""",

    'timeSpeedDistance': """theory: { sections: [
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
    }""",

    'ratioProportion': """theory: { sections: [
        { title: 'Ratios & Scaling', content: ['A ratio compares values. If A:B = m:n, A and B can be represented as mx and nx. To combine ratios (If A:B and B:C are known), equate the common term (B) by finding the LCM of its corresponding values.', 'Proportions represent equality of ratios: if a:b = c:d, then ad = bc. Direct proportion means if x increases, y increases at a constant ratio. Inverse proportion means xy = constant.'], formulas: [
          { formula: 'Combining Ratios', example: 'A:B=2:3, B:C=4:5 → Multiply to make B=12 → A:B:C = 8:12:15' },
          { formula: 'Proportion Extremes: a/b = c/d → ad = bc', example: '2/3 = x/9 → 3x=18 → x=6' },
        ]},
        { title: 'Partnerships', content: ['In partnership problems, the profit share is proportional to the product of Investment and Time periods. Profit Ratio = (I₁ × T₁) : (I₂ × T₂).', 'If a partner joins later or withdraws capital, break their investment into distinct time blocks and sum the products to find their total weight.'], formulas: [
          { formula: 'Profit Share Ratio = I₁T₁ : I₂T₂', example: 'A puts 100 for 12mo, B puts 200 for 6mo → Ratio is 1200:1200 = 1:1' },
        ]},
    ]
    }""",

    'profitLoss': """theory: { sections: [
        { title: 'Cost, Selling & Marked Price', content: ['Profit and Loss are always calculated over Cost Price (CP). Profit = SP - CP. When an item is sold at a profit of P%, SP = CP * (1 + P/100).', 'Discounts are strictly calculated over Marked Price (MP). SP = MP * (1 - D/100). This connects CP and MP directly: MP/CP = (100+P%)/(100-D%).'], formulas: [
          { formula: 'Profit% = (Profit / CP) × 100', example: 'CP=200, SP=250 → Profit=50 → 25%' },
          { formula: 'Loss% = (Loss / CP) × 100', example: 'CP=200, SP=160 → Loss=40 → 20%' },
          { formula: 'MP/CP ratio = (100 + P%) / (100 - D%)', example: 'P=20%, D=10% → MP/CP = 120/90 = 4/3' },
        ]},
        { title: 'Faulty Weights & Successive Discounts', content: ['If a dealer sells at CP but uses a faulty weight (e.g., giving 900g instead of 1kg), the profit% = (Error / True Value Provided) × 100.', 'Successive discounts of A% and B% are NOT equal to (A+B)%. The effective discount is A + B - (AB/100)%.'], formulas: [
          { formula: 'Faulty Weights Profit% = (Error / Given Weight) × 100', example: 'Uses 900g for 1000g → 100/900 = 11.11%' },
          { formula: 'Successive Discount net = A + B - AB/100', example: '20% + 10% → 20 + 10 - 2 = 28% discount' },
        ]},
    ]
    }""",

    'averages': """theory: { sections: [
        { title: 'Foundations & Deviations', content: ['Average = Sum of all items / Number of items. If the average of N items is A, their total sum is N × A. If every item in a set is increased by k, the new average also increases by k.', 'The Deviation method is often faster: ASSUME an average, calculate how much each number deviates from it, and balance out these deviations. The true average is your assumed average plus (net deviation / N).'], formulas: [
          { formula: 'Sum = Average × Count', example: 'Avg of 5 numbers is 20 → Sum = 100' },
          { formula: 'New Avg (item added) = Old Avg + (Value - Old Avg)/New Count', example: 'Avg is 20 for 5. Add 26. New = 20 + (26-20)/6 = 21' },
        ]},
        { title: 'Weighted Averages', content: ['When merging two groups with different averages, use the Weighted Average formula: (N₁A₁ + N₂A₂) / (N₁ + N₂). This is essentially finding the total sum of both groups and dividing by the total count.', 'Mixture and Alligation is a reversed form of weighted average, used specifically to find the ratio N₁:N₂ given the group averages.'], formulas: [
          { formula: 'Weighted Average = (w₁x₁ + w₂x₂) / (w₁ + w₂)', example: 'Mix 2kg of $10 and 3kg of $20 → (20+60)/5 = $16' },
        ]},
    ]
    }""",

    'simpleCompoundInterest': """theory: { sections: [
        { title: 'Simple & Compound Foundations', content: ['Simple Interest (SI) is calculated only on the principal amount. It grows linearly. CI is calculated on the accumulated amount (Principal + previous Interest). It grows exponentially.', 'For the first year (or first compounding period), SI and CI are exactly the same. After that, CI outpaces SI because you earn "interest on your interest".'], formulas: [
          { formula: 'Simple Interest (SI) = P * R * T / 100', example: 'P=1000, R=10%, T=2 → SI=200' },
          { formula: 'Compound Interest Amount = P * (1 + R/100)^n', example: 'P=1000, R=10%, T=2 → A=1000(1.1)² = 1210' },
        ]},
        { title: 'Difference Formulas & Installments', content: ['The difference between CI and SI for 2 years is purely the interest earned on the 1st year\\'s interest. Formula: Diff = P(R/100)². For 3 years, Diff = P(R/100)² * (3 + R/100).', 'If compounding happens half-yearly, halve the rate (R/2) and double the time periods (2T).'], formulas: [
          { formula: 'CI - SI difference (2 years) = P(R/100)²', example: 'P=1000, R=10% → Diff = 1000 * (0.1)² = 10' },
          { formula: 'Half-yearly Compounding: Rate=R/2, Time=2T', example: '10% annually for 1 year → 5% for 2 periods' },
        ]},
    ]
    }""",

    'numberSystems': """theory: { sections: [
        { title: 'Classifications & Divisibility', content: ['Numbers are classified into Reals, Rationals, Primes, and Composites. Two numbers are Co-Prime if their HCF is 1 (they share no common factors).', 'Divisibility rules speed up calculations. For 3 and 9, sum the digits. For 4, check the last 2 digits. For 8, the last 3. For 11, the sum of odd-placed digits minus sum of even-placed digits must be 0 or a multiple of 11.'], formulas: [
          { formula: 'Sum of first n naturals = n(n+1)/2', example: 'Sum of 1 to 10 = 10(11)/2 = 55' },
          { formula: 'Divisibility by 11: |Sum(odd places) - Sum(even places)|', example: '1331: (1+3)-(3+1) = 0 (divisible)' },
        ]},
        { title: 'LCM, HCF & Remainders', content: ['For any two numbers A and B: LCM(A, B) × HCF(A, B) = A × B. The HCF of fractions is HCF(numerators)/LCM(denominators).', 'To find the unit digit of large powers (like 2^45), divide the exponent by 4 (the cyclicity of 2, 3, 7, 8). The remainder gives the effective power. Remainder 1 -> 2^1=2.'], formulas: [
          { formula: 'LCM × HCF = Product of Numbers', example: 'LCM(12,15)=60, HCF=3 → 12×15=180=60×3' },
          { formula: 'Cyclicity of 2, 3, 7, 8 is 4', example: 'Unit digit of 2^7 = 2^(remainder of 7/4) = 2^3 = 8' },
        ]},
    ]
    }""",

    'mixturesAlligations': """theory: { sections: [
        { title: 'Alligation Rule', content: ['Alligation is a shortcut to solve weighted average problems. If you mix two quantities of prices A and B to get a mixture of price M, the ratio in which they were mixed is (B - M) : (M - A).', 'Always ensure the units are identical! Never mix a Cost Price with a Selling Price. Convert SP to CP first if dealing with profits.'], formulas: [
          { formula: 'Alligation Ratio = (Cheaper diff) : (Dearer diff)', example: 'Mix 10 and 20 to get 14. Ratio = (20-14):(14-10) = 6:4 = 3:2' },
        ]},
        { title: 'Repeated Dilution (Replacement)', content: ['When a container has purely liquid A, and you repeatedly remove Vol V and replace it with water N times, the final amount of liquid A is given by an exponential decay formula.', 'Final Vol = Initial Vol × (1 - Removed/Total)ⁿ. This works because each replacement dilutes the original liquid by the same fraction.'], formulas: [
          { formula: 'Final Amount = Initial × (1 - Replacement_Vol / Total_Vol)^n', example: '100L pure wine. Replace 10L twice. Final = 100 × (1 - 10/100)² = 81L' },
        ]},
    ]
    }""",

    'algebra': """theory: { sections: [
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
    }""",

    'geometry': """theory: { sections: [
        { title: 'Triangles', content: ['A polygon with 3 sides. The sum of interior angles is 180°. In a right triangle, use Pythagoras: a² + b² = c².', 'Similarity: If two triangles are similar, the ratio of their areas is the square of the ratio of their corresponding sides.'], formulas: [
          { formula: 'Pythagorean Theorem: a² + b² = c²', example: 'Sides 3,4 → Hypotenuse 5' },
          { formula: 'Area = 1/2 × base × height', example: 'Base 10, Height 5 → Area = 25' },
        ]},
        { title: 'Circles & Polygons', content: ['For circles, the angle subtended by an arc at the center is double the angle subtended at the circumference. Angles in the same segment are equal.', 'For regular polygons of N sides, the sum of interior angles is (N-2)×180°. Each interior angle is (N-2)×180° / N.'], formulas: [
          { formula: 'Area of Circle = πr²', example: 'Radius 7 → Area ≈ (22/7)×49 = 154' },
          { formula: 'Sum of interior angles = (N-2)×180°', example: 'Hexagon (N=6): 4×180 = 720°' },
        ]},
    ]
    }""",

    'probabilityCombinatorics': """theory: { sections: [
        { title: 'Permutations & Combinations', content: ['Permutations are for ARRANGEMENTS (order matters). Combinations are for SELECTIONS (order does not matter). Determine whether the problem cares about order before choosing nPr or nCr.', 'The fundamental counting principle: If action A can be done in M ways and action B in N ways, both can be done in M×N ways if they are independent.'], formulas: [
          { formula: 'nCr (Choosing) = n! / (r! × (n-r)!)', example: '5C2 = 5! / (2! 3!) = 10' },
          { formula: 'nPr (Arranging) = n! / (n-r)!', example: '5P2 = 5! / 3! = 20' },
        ]},
        { title: 'Probability Basics', content: ['Probability = (Favorable Outcomes) / (Total Possible Outcomes). It always ranges from 0 (impossible) to 1 (certain).', 'For independent events, P(A AND B) = P(A) × P(B). For OR events, use the union formula: P(A OR B) = P(A) + P(B) - P(A AND B).'], formulas: [
          { formula: 'P(Event) = Favorable / Total', example: 'Rolling a 4 on a die = 1/6' },
          { formula: 'P(A OR B) = P(A) + P(B) - P(A AND B)', example: 'Mutually exclusive: P(A AND B)=0' },
        ]},
    ]
    }""",

    'dataInterpretation': """theory: { sections: [
        { title: 'Visual & Tabular Data', content: ['DI tests your ability to extract meaning from Charts (Pie, Bar, Line) and Tables. The key is to approximate early and only calculate precisely if the multiple-choice options are extremely close to each other.', 'Always scan the units before calculating (e.g., "in thousands", "in millions"). Read the axes carefully.'], formulas: [
          { formula: 'Growth Rate = (Final - Initial) / Initial × 100', example: 'Sales from 50k to 60k → 20% growth' },
        ]},
        { title: 'Angles in Pie Charts', content: ['A full pie chart is 360°, representing 100% of the data. Thus, 1% corresponds to 3.6°. If a sector is given as an angle, convert it to percentage by dividing by 360 and multiplying by 100.', 'Example: A 90° sector is 90/360 = 1/4 of the total data (25%).'], formulas: [
          { formula: 'Sector % = (Angle / 360°) × 100', example: '72° sector = 72/360 = 1/5 = 20%' },
        ]},
    ]
    }"""
}

updated_count = 0
for topic_id, new_theory in expanded_theories.items():
    # Regex to find the theory object and replace it. 
    # Match the id to make sure we're in the right object.
    pattern = rf"(id:\s*'{topic_id}'[\s\S]*?)theory:\s*\{{\s*sections:\s*\[[\s\S]*?\]\s*\}}\s*,\s*quickMethods:"
    
    def replacer(match):
        global updated_count
        updated_count += 1
        return match.group(1) + new_theory + ",\n    quickMethods:"
        
    content, count = re.subn(pattern, replacer, content, count=1)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Updated {updated_count} topics in learningPathData.js")
