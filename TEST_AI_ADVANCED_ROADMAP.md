# AI Advanced Roadmap - Testing Guide

## Quick Start

The development server is running at: **http://localhost:5173**

Click the preview button in your tool panel to open the app.

## Test Steps for AI Advanced Roadmap

### 1. Navigate to the Page
- Click on "AI Advanced Roadmap" in the sidebar, OR
- Go directly to: http://localhost:5173/advanced-learning-path

### 2. Verify Initial State (Empty State)
Before generating a roadmap, you should see:
- ✅ Title: "Your Personalized AI Learning Roadmap"
- ✅ Badge: "Smart Planner"
- ✅ Two intro cards:
  - "Why This Matters" with 🎯 icon
  - "How to Use" with 💡 icon
- ✅ Empty state message with checklist:
  - 📋 Icon
  - "Your Personalized Roadmap" heading
  - Instructions and tips

### 3. Test Basic Configuration
Try these settings:

**Test Case 1: Standard Setup**
- Duration: 4 months
- Intensity: Standard (3 topics/week)
- Study Days: 5 days
- Tracks: All selected (DSA, Aptitude, SQL, System Design)
- Click "Generate My Roadmap" ✨

**Expected Results:**
- ✅ Success alert with summary
- ✅ Roadmap displays with weeks
- ✅ Each week shows track emoji (🧠, ⚡, 🗄️, 🏗️)
- ✅ Dates formatted as "Jan 15" (not "2024-01-15")
- ✅ Topics listed with difficulty
- ✅ Confidence percentage shown
- ✅ Daily tasks with checkboxes

### 4. Test Validation Messages

**Test Case 2: Short Timeline**
- Set duration to: 1 month
- Click "Generate My Roadmap"

**Expected:**
- ✅ Warning: "⚠️ Tip: For best results, prepare for at least 2-3 months..."

**Test Case 3: Long Timeline**
- Set duration to: 18 months
- Click "Generate My Roadmap"

**Expected:**
- ✅ Tip: "💡 Tip: Consider breaking long preparation into phases..."

**Test Case 4: Past Interview Date**
- Enable "Advanced Options" checkbox
- Set interview date to a past date
- Click "Generate My Roadmap"

**Expected:**
- ✅ Warning: "⚠️ Warning: Your interview date is in the past..."

### 5. Test Advanced Options
Click "Advanced Options" checkbox and verify:
- ✅ Start Date field appears with help text
- ✅ Revision Buffer dropdown appears
- ✅ Target Interview Date field appears
- ✅ Company Focus Mode dropdown appears
- ✅ Daily Study Block selector appears

**Test Company Modes:**
- Balanced: Equal distribution
- FAANG: More DSA + System Design
- Data: More SQL + Aptitude
- Product: DSA + SQL + System Design

### 6. Test Track Selection
- Click each track chip to toggle
- Verify visual feedback:
  - ✅ Hover effect (border color change, slight lift)
  - ✅ Active state (glow effect, background tint)
  - ✅ Icons display correctly
  - ✅ Labels and descriptions visible

### 7. Test Generated Roadmap Features

**Visual Elements:**
- ✅ Week headers with emojis
- ✅ Date ranges with arrow (→)
- ✅ Topic list with "Topics:" label
- ✅ Confidence badge with tooltip
- ✅ Daily task cards
- ✅ Checkboxes for task completion

**Interactive Features:**
- ✅ Click checkbox to mark task complete
- ✅ Completed tasks show strikethrough
- ✅ Scroll through weeks if many

### 8. Test Export Functions
After generating a roadmap:

**Export to Calendar (.ics)**
- ✅ Downloads .ics file
- ✅ Can import to Google Calendar, Outlook, etc.

**Export Google CSV**
- ✅ Downloads CSV file
- ✅ Compatible with Google Calendar import

**Export Plan (JSON)**
- ✅ Downloads JSON file
- ✅ Contains full roadmap data

**Print Roadmap**
- ✅ Opens print dialog
- ✅ Formatted for printing

### 9. Test Auto-reschedule
- Mark some past tasks as incomplete
- Click "Auto-reschedule Missed Tasks"
- ✅ Should move missed tasks to future dates

### 10. Test Send to AI Mentor
- Click "Send to AI Mentor"
- ✅ Should copy plan or send to chat (depending on integration)

### 11. Test Responsive Design

**Desktop (>768px):**
- ✅ Two-column intro cards
- ✅ Multi-column form grid
- ✅ Horizontal track chips
- ✅ Horizontal button layout

**Mobile (<768px):**
- ✅ Single-column intro cards
- ✅ Single-column form grid
- ✅ Full-width track chips
- ✅ Vertical button stack
- ✅ Centered button text

### 12. Test Dark Mode
- Toggle dark mode in your app
- Verify:
  - ✅ Colors adjust properly
  - ✅ Text remains readable
  - ✅ Borders and backgrounds adapt
  - ✅ No contrast issues

### 13. Test Help Text
Hover over or read each field's help text:
- ✅ Preparation Duration: "Recommended: 3-6 months..."
- ✅ Start Date: "Leave blank to start today"
- ✅ Weekly Intensity: "Choose based on your daily availability"
- ✅ Revision Buffer: "Extra weeks reserved for revision..."
- ✅ Study Days: "Be realistic about your weekly commitment"
- ✅ Company Mode: "Different companies emphasize different skills"
- ✅ Daily Block: "Quality over quantity - stay focused..."

### 14. Test Success Message
After generating, verify alert contains:
- ✅ Duration breakdown (weeks + revision weeks)
- ✅ Selected tracks list
- ✅ Daily commitment info
- ✅ Actionable tips:
  - Check off tasks
  - Use auto-reschedule
  - Export to calendar
  - Stay consistent

## Common Issues & Troubleshooting

### Issue: Page doesn't load
**Solution:** Check browser console for errors. Ensure backend is running if needed.

### Issue: Styles look broken
**Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R). Clear browser cache.

### Issue: Buttons don't work
**Solution:** Check browser console for JavaScript errors. Verify all files loaded.

### Issue: Mobile view not working
**Solution:** Use browser DevTools device emulation. Test at various breakpoints.

### Issue: Dark mode colors wrong
**Solution:** Verify CSS variables are defined for dark theme. Check `:root[data-theme="dark"]` styles.

## Performance Checks

- ✅ Page loads in < 2 seconds
- ✅ Roadmap generates in < 1 second
- ✅ Smooth scrolling through weeks
- ✅ Checkbox interactions are instant
- ✅ No lag when toggling advanced options
- ✅ Export functions complete quickly

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility Checks

- [ ] All buttons have clear labels
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works
- [ ] Screen reader can read content
- [ ] Focus indicators visible

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ Responsive on all devices
✅ Dark mode works correctly
✅ All export functions work
✅ Validation messages helpful
✅ UI is intuitive and clear
✅ Performance is smooth

## Next Steps After Testing

1. Document any bugs found
2. Note UX improvement suggestions
3. Test with real users if possible
4. Gather feedback on clarity
5. Monitor usage analytics

---

**Testing Completed By:** ________________  
**Date:** ________________  
**Issues Found:** ________________  
**Overall Rating:** ⭐⭐⭐⭐⭐
