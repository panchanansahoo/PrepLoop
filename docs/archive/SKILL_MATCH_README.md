# 🎯 Skill-Match Live Job Recommendations

> Personalized job recommendations on your professional dashboard, powered by AI-driven skill matching.

## 📋 Overview

The Skill-Match Live Job Recommendations feature automatically finds and displays jobs that match your profile skills. Jobs are scored based on skill overlap, updated every 5 minutes, and displayed prominently on your dashboard.

## ✨ Key Features

- **🎯 Smart Matching**: Analyzes your skills against job requirements
- **📊 Match Scores**: Shows percentage match for each job (0-100%)
- **🔄 Live Updates**: Auto-refreshes every 5 minutes
- **🏷️ Skill Tags**: Displays which of your skills match each job
- **🚀 One-Click Apply**: Direct links to job applications
- **🎨 Beautiful UI**: Gradient purple design with smooth animations
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile
- **⚙️ Customizable**: Toggle on/off via dashboard settings

## 🚀 Quick Start

### For Users

1. **Complete Your Profile**
   - Navigate to Profile page
   - Add your skills (e.g., "React, Node.js, Python")
   - Save changes

2. **View Matched Jobs**
   - Go to Dashboard
   - Scroll to "Jobs Matched to Your Skills" widget
   - Browse top 3 matched jobs

3. **Apply to Jobs**
   - Click "Apply Now" on any job card
   - Opens job application in new tab

### For Developers

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Test the Feature**
   ```bash
   # Test backend endpoint
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:5000/api/jobs/skill-match
   
   # Open frontend
   open http://localhost:5173/dashboard
   ```

## 📁 File Structure

```
PrepLoop/
├── backend/
│   └── routes/
│       └── jobs.js                    # Added skill-match endpoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── SkillMatchJobs.jsx    # New widget component
│   │   └── pages/
│   │       └── Dashboard.jsx          # Updated with widget
└── docs/
    ├── SKILL_MATCH_JOBS.md           # Full documentation
    ├── SKILL_MATCH_VISUAL_GUIDE.md   # Visual guide
    └── SKILL_MATCH_TESTING.md        # Testing guide
```

## 🔧 Technical Details

### Backend API

**Endpoint**: `GET /api/jobs/skill-match`

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "jobs": [
    {
      "id": "rem_123",
      "title": "Full Stack Developer",
      "company": "Tech Corp",
      "location": "Remote",
      "salary_range": "$80k - $120k",
      "matchScore": 85,
      "matchedSkills": ["React", "Node.js"],
      "apply_link": "https://example.com/apply"
    }
  ],
  "userSkills": ["React", "Node.js", "Python"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Frontend Component

**Component**: `SkillMatchJobs.jsx`

**Props**: None (uses auth context)

**Features**:
- Auto-polling every 5 minutes
- Manual refresh button
- Loading/empty states
- Responsive design
- Smooth animations

### Match Score Algorithm

```javascript
// Calculate match percentage
matchScore = (matchedSkills.length / totalUserSkills.length) * 100

// Example:
// User Skills: ["React", "Node.js", "Python", "AWS"]
// Job Requirements: "React and Node.js developer"
// Matched: ["React", "Node.js"]
// Score: (2 / 4) * 100 = 50%
```

## 🎨 Design

### Color Palette
- **Widget Background**: Linear gradient `#667eea` → `#764ba2`
- **Job Cards**: `rgba(255, 255, 255, 0.15)` with backdrop blur
- **Match Badge**: `rgba(16, 185, 129, 0.9)` (green)
- **Apply Button**: White background, purple text

### Typography
- **Title**: 16px, weight 600
- **Job Title**: 14px, weight 600
- **Company**: 12px, weight 400
- **Tags**: 10px, weight 500

### Spacing
- **Widget Padding**: 20px
- **Card Gap**: 12px
- **Card Padding**: 14px

## 📊 Data Flow

```
┌─────────────┐
│ User Profile│
│  (skills)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Backend API         │
│ /jobs/skill-match   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Fetch External Jobs │
│ (Indeed, Remotive)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Calculate Matches   │
│ & Sort by Score     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Frontend Widget     │
│ Display Top 5       │
└─────────────────────┘
```

## 🧪 Testing

### Manual Testing
1. Complete user profile with skills
2. Navigate to dashboard
3. Verify widget appears with jobs
4. Check match scores are accurate
5. Test refresh button
6. Wait 5 minutes for auto-refresh
7. Test apply links

### Automated Testing
```javascript
// Example test
it('displays matched jobs', async () => {
  render(<SkillMatchJobs />);
  await waitFor(() => {
    expect(screen.getByText(/full stack developer/i)).toBeInTheDocument();
  });
});
```

See [SKILL_MATCH_TESTING.md](docs/SKILL_MATCH_TESTING.md) for complete testing guide.

## 📈 Performance

- **Initial Load**: < 3 seconds
- **Refresh Time**: < 2 seconds
- **Memory Usage**: < 50MB
- **Auto-Refresh**: Every 5 minutes
- **Cache Duration**: 10 minutes
- **Rate Limit**: 10 requests/minute per user

## 🔒 Security

- ✅ JWT authentication required
- ✅ User can only see their own matches
- ✅ Rate limiting enabled
- ✅ External URLs validated
- ✅ XSS protection via React
- ✅ CORS configured

## 🐛 Troubleshooting

### No jobs showing?
- Ensure you've added skills to your profile
- Check if backend server is running
- Verify external job APIs are responding

### Low match scores?
- Add more relevant skills to your profile
- Use industry-standard skill names (e.g., "React" not "React.js")

### Widget not appearing?
- Check if widget is enabled in Customize panel
- Clear browser cache and reload
- Check browser console for errors

## 🚀 Future Enhancements

- [ ] Advanced filtering (location, salary, type)
- [ ] Save/bookmark jobs
- [ ] Application tracking
- [ ] Email notifications for new matches
- [ ] AI-powered match explanations
- [ ] Skill gap analysis
- [ ] Company insights integration
- [ ] Interview preparation for matched jobs

## 📚 Documentation

- **[Full Documentation](docs/SKILL_MATCH_JOBS.md)** - Complete feature guide
- **[Visual Guide](docs/SKILL_MATCH_VISUAL_GUIDE.md)** - UI/UX reference
- **[Testing Guide](docs/SKILL_MATCH_TESTING.md)** - Testing checklist
- **[Implementation Summary](SKILL_MATCH_IMPLEMENTATION.md)** - Technical details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/improvement`)
3. Make changes and test thoroughly
4. Commit changes (`git commit -m 'Add improvement'`)
5. Push to branch (`git push origin feature/improvement`)
6. Open Pull Request

## 📝 License

This feature is part of PrepLoop and follows the same license as the main project.

## 💬 Support

- **Issues**: Open a GitHub issue
- **Questions**: Contact the development team
- **Feedback**: We'd love to hear your thoughts!

## 🎉 Credits

Built with ❤️ by the PrepLoop team

---

**Happy Job Hunting! 🚀**
