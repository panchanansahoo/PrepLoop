#!/usr/bin/env python3
import re

# Read the file
with open('frontend/src/pages/AIInterviewPage.jsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

print("Step 1: Checking current state...")

# Check if imports are already there
if "RealtimeFeedbackProvider" in content and "PerformanceIndicator" in content:
    print("✓ Imports already added")
else:
    print("✗ Imports missing!")
    exit(1)

# Step 2: Check if components need to be added  
if '<PerformanceIndicator />' not in content:
    print("Step 2: Adding feedback components...")
    
    # Find HintBanner and add new components after it
    # The exact pattern from grep: <HintBanner hint={activeHint} onDismiss={() => setActiveHint(null)} />
    pattern = r'(<HintBanner hint=\{activeHint\} onDismiss=\{\(\) => setActiveHint\(null\)\} />)'
    
    replacement = r'\1\n                        <ScoreCue />\n                        <PerformanceIndicator />\n                        <HintSuggestion />\n                        <BehaviorAlert />'
    
    content_new = re.sub(pattern, replacement, content)
    
    if content_new != content:
        print("✓ Found HintBanner component - adding feedback components")
        with open('frontend/src/pages/AIInterviewPage.jsx', 'w', encoding='utf-8') as f:
            f.write(content_new)
        print("✓ Feedback components added successfully")
    else:
        print("✗ Could not find HintBanner component pattern")
        print("   Trying simpler pattern...")
        # Try a simpler pattern
        pattern2 = r'(<HintBanner[^/]*/?>)'
        content_new = re.sub(pattern2, replacement, content)
        if content_new != content:
            print("✓ Found HintBanner with simpler pattern - adding feedback components")
            with open('frontend/src/pages/AIInterviewPage.jsx', 'w', encoding='utf-8') as f:
                f.write(content_new)
            print("✓ Feedback components added successfully")
        else:
            print("✗ Could not find any HintBanner pattern")
            exit(1)
else:
    print("✓ Feedback components already added")

# Step 3: Verify the provider wrapper
print("Step 3: Checking RealtimeFeedbackProvider wrapping...")

if '<RealtimeFeedbackProvider' in content:
    print("✓ RealtimeFeedbackProvider wrapping already in place")
else:
    print("⚠ RealtimeFeedbackProvider wrapping not yet added")
    print("   (May need manual wrapping of interview phase - refer to summary)")

print("\n✅ Integration check complete")
