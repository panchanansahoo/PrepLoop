# Skill-Match Jobs - Testing Guide

## Quick Test Checklist

### Backend API Test

1. **Test Endpoint Directly**
```bash
# Start backend server
cd backend
npm run dev

# Test with curl (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/jobs/skill-match
```

Expected Response:
```json
{
  "jobs": [...],
  "userSkills": ["React", "Node.js", ...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

2. **Test Without Profile**
- Create new user without skills
- Should return jobs with 50% default match score

3. **Test With Profile**
- Add skills to user profile: "React, Node.js, Python"
- Should return jobs with calculated match scores

### Frontend Widget Test

1. **Start Development Server**
```bash
cd frontend
npm run dev
```

2. **Navigate to Dashboard**
- Go to http://localhost:5173/dashboard
- Login with test account

3. **Verify Widget Appears**
- [ ] Widget shows below "Quick Actions"
- [ ] Purple gradient background
- [ ] Title: "Jobs Matched to Your Skills"
- [ ] Refresh button visible

4. **Test Loading State**
- [ ] Spinner appears on initial load
- [ ] "Finding jobs..." message shows
- [ ] Loading completes within 5 seconds

5. **Test Job Cards**
- [ ] Up to 5 job cards display
- [ ] Each card shows:
  - [ ] Job title
  - [ ] Company name with briefcase icon
  - [ ] Location with map pin icon
  - [ ] Salary range (if available)
  - [ ] Match score badge (green, percentage)
  - [ ] Up to 3 skill tags
  - [ ] "Apply Now" button

6. **Test Interactions**
- [ ] Click refresh button - jobs reload
- [ ] Refresh button spins during load
- [ ] Hover over job card - slight lift effect
- [ ] Hover over "Apply Now" - button slides right
- [ ] Click "Apply Now" - opens in new tab

7. **Test Auto-Refresh**
- [ ] Wait 5 minutes
- [ ] Jobs refresh automatically
- [ ] Timestamp updates
- [ ] No loading spinner (silent update)

8. **Test Empty State**
- [ ] Remove all skills from profile
- [ ] Briefcase icon shows
- [ ] Message: "No matching jobs found..."

9. **Test Customization**
- [ ] Click "Customize" in dashboard header
- [ ] Find "Skill-Matched Jobs" in list
- [ ] Toggle off - widget disappears
- [ ] Toggle on - widget reappears
- [ ] Setting persists on page reload

### Match Score Verification

Test with different skill sets:

**Test Case 1: High Match**
```
User Skills: React, Node.js, JavaScript, TypeScript
Job Description: "React and TypeScript developer needed"
Expected: 50% match (2/4 skills matched)
```

**Test Case 2: Perfect Match**
```
User Skills: Python, Django, PostgreSQL
Job Description: "Python Django developer with PostgreSQL experience"
Expected: 100% match (3/3 skills matched)
```

**Test Case 3: Low Match**
```
User Skills: Java, Spring Boot, MySQL
Job Description: "React frontend developer"
Expected: 0% match (0/3 skills matched)
```

### Responsive Design Test

1. **Desktop (1920px)**
- [ ] Widget full width
- [ ] All 5 jobs visible
- [ ] No horizontal scroll

2. **Laptop (1366px)**
- [ ] Widget full width
- [ ] All content readable
- [ ] Proper spacing

3. **Tablet (768px)**
- [ ] Widget full width
- [ ] Job cards stack properly
- [ ] Text doesn't overflow

4. **Mobile (375px)**
- [ ] Widget full width
- [ ] Cards stack vertically
- [ ] Buttons remain clickable
- [ ] Text readable

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance Test

1. **Initial Load Time**
- [ ] Widget loads within 3 seconds
- [ ] No blocking of other widgets

2. **Memory Usage**
- [ ] No memory leaks after 10 auto-refreshes
- [ ] Interval cleanup on unmount

3. **Network Requests**
- [ ] Only 1 request per refresh
- [ ] Respects rate limiting
- [ ] Uses cached results when available

### Error Handling Test

1. **Network Error**
- [ ] Disconnect internet
- [ ] Widget shows error gracefully
- [ ] Reconnect - widget recovers

2. **API Error**
- [ ] Stop backend server
- [ ] Widget handles 500 error
- [ ] Shows fallback message

3. **Invalid Token**
- [ ] Use expired token
- [ ] Widget handles 401 error
- [ ] Redirects to login

### Integration Test

1. **Profile Update Flow**
- [ ] Update skills in profile
- [ ] Refresh jobs widget
- [ ] New match scores reflect changes

2. **Multi-Widget Test**
- [ ] All dashboard widgets load
- [ ] No conflicts between widgets
- [ ] Proper spacing maintained

3. **Navigation Test**
- [ ] Navigate away from dashboard
- [ ] Return to dashboard
- [ ] Widget state preserved
- [ ] Auto-refresh continues

## Manual Testing Script

### Setup
1. Create test user account
2. Add skills to profile: "React, Node.js, Python, AWS, Docker"
3. Navigate to dashboard

### Test Sequence

**Step 1: Initial Load**
- Observe loading state
- Verify jobs appear
- Check match scores

**Step 2: Verify Data**
- Confirm job titles are relevant
- Check companies are real
- Verify locations make sense
- Ensure salary ranges are reasonable

**Step 3: Test Interactions**
- Click refresh button
- Hover over job cards
- Click "Apply Now" on first job
- Verify new tab opens with correct URL

**Step 4: Test Customization**
- Open customize panel
- Toggle widget off
- Verify widget disappears
- Toggle widget on
- Verify widget reappears

**Step 5: Test Auto-Refresh**
- Note current timestamp
- Wait 5 minutes
- Verify timestamp updates
- Check if jobs changed

**Step 6: Test Profile Changes**
- Update profile skills to "Java, Spring Boot"
- Refresh jobs widget
- Verify new jobs match Java/Spring Boot

**Step 7: Test Empty State**
- Remove all skills from profile
- Refresh jobs widget
- Verify empty state message

**Step 8: Cleanup**
- Restore original profile
- Verify widget returns to normal

## Automated Test Ideas

```javascript
// Example Jest test for SkillMatchJobs component
describe('SkillMatchJobs', () => {
  it('renders loading state initially', () => {
    render(<SkillMatchJobs />);
    expect(screen.getByText(/finding jobs/i)).toBeInTheDocument();
  });

  it('displays jobs after loading', async () => {
    render(<SkillMatchJobs />);
    await waitFor(() => {
      expect(screen.getByText(/full stack developer/i)).toBeInTheDocument();
    });
  });

  it('shows match score for each job', async () => {
    render(<SkillMatchJobs />);
    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });

  it('refreshes jobs on button click', async () => {
    render(<SkillMatchJobs />);
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);
    expect(refreshBtn).toBeDisabled();
  });
});
```

## Common Issues & Solutions

### Issue: No jobs showing
**Solution**: 
- Check if user has skills in profile
- Verify backend is running
- Check external job APIs are responding

### Issue: Match scores all 50%
**Solution**:
- User profile has no skills
- Add skills to profile and refresh

### Issue: Widget not appearing
**Solution**:
- Check if widget is toggled on in customize panel
- Verify component is imported in Dashboard.jsx
- Check browser console for errors

### Issue: Auto-refresh not working
**Solution**:
- Check if interval is set correctly
- Verify cleanup function runs on unmount
- Check browser console for errors

### Issue: Apply links not working
**Solution**:
- Verify job.apply_link is valid URL
- Check if popup blocker is enabled
- Test with different browser

## Success Criteria

✅ Widget loads within 3 seconds
✅ Jobs display with correct data
✅ Match scores calculate accurately
✅ Refresh button works
✅ Auto-refresh works every 5 minutes
✅ Apply links open in new tab
✅ Empty state shows when appropriate
✅ Widget can be toggled on/off
✅ Responsive on all screen sizes
✅ No console errors
✅ No memory leaks
✅ Proper error handling

## Performance Benchmarks

- Initial load: < 3 seconds
- Refresh: < 2 seconds
- Memory usage: < 50MB
- CPU usage: < 5% idle
- Network: < 100KB per request
