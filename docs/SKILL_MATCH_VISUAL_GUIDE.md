# Skill-Match Jobs Widget - Visual Guide

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD                                │
├─────────────────────────────────────────────────────────────┤
│  Good morning, Engineer 👋                                   │
│  "First, solve the problem. Then, write the code."          │
│                                        [Customize] [Start]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Quick Stats ────────────────────────────────────────┐  │
│  │  🔥 7 Day Streak  |  ✓ 45 Problems  |  ⭐ 85 Score   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Daily Challenge ────────────────────────────────────┐  │
│  │  Today's Problem: Two Sum (Easy)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Quick Actions ──────────────────────────────────────┐  │
│  │  [Practice DSA] [Mock Interview] [System Design]      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ ✨ Jobs Matched to Your Skills ──────────── [↻] ────┐  │
│  │                                                         │  │
│  │  ┌─ Full Stack Developer ──────────────────── 85% ─┐ │  │
│  │  │  💼 Tech Corp                                     │ │  │
│  │  │  📍 Remote  |  💰 $80k - $120k                   │ │  │
│  │  │  [React] [Node.js] [Python]                      │ │  │
│  │  │                              [Apply Now →]        │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌─ Senior Backend Engineer ────────────── 78% ─┐    │  │
│  │  │  💼 StartupXYZ                                │    │  │
│  │  │  📍 Bengaluru, India  |  💰 ₹15-25 LPA       │    │  │
│  │  │  [Node.js] [AWS] [MongoDB]                   │    │  │
│  │  │                              [Apply Now →]    │    │  │
│  │  └───────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │  ┌─ Frontend Developer ──────────────────── 92% ─┐   │  │
│  │  │  💼 Google                                      │   │  │
│  │  │  📍 Hyderabad, India  |  💰 ₹20-35 LPA        │   │  │
│  │  │  [React] [TypeScript] [CSS]                    │   │  │
│  │  │                              [Apply Now →]      │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                                                         │  │
│  │  Updated 2:45 PM                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Interview Readiness ─┐  ┌─ Skill Breakdown ────────┐  │
│  │  Overall: 75%          │  │  DSA: ████░░ 80%         │  │
│  │  [View Details]        │  │  System Design: ███░░ 60%│  │
│  └────────────────────────┘  └──────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Widget Anatomy

```
┌─ ✨ Jobs Matched to Your Skills ──────────────── [↻] ────┐
│  ↑                                                  ↑       │
│  Title with icon                          Refresh button   │
│                                                             │
│  ┌─ Job Card ──────────────────────────────────── 85% ─┐  │
│  │  ↑                                               ↑    │  │
│  │  Job Title                              Match Score   │  │
│  │                                                       │  │
│  │  💼 Company Name                                     │  │
│  │  📍 Location  |  💰 Salary Range                    │  │
│  │  ↑              ↑                                    │  │
│  │  Location       Salary                               │  │
│  │                                                       │  │
│  │  [Skill 1] [Skill 2] [Skill 3]                      │  │
│  │  ↑                                                    │  │
│  │  Matched Skills Tags                                 │  │
│  │                                                       │  │
│  │                              [Apply Now →]           │  │
│  │                              ↑                        │  │
│  │                              Apply Button             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Updated 2:45 PM                                           │
│  ↑                                                          │
│  Last Update Timestamp                                     │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

```
Widget Background:
  Gradient: #667eea (purple) → #764ba2 (darker purple)

Job Cards:
  Background: rgba(255, 255, 255, 0.15) with backdrop blur
  Hover: rgba(255, 255, 255, 0.2) + translateY(-2px)

Match Score Badge:
  Background: rgba(16, 185, 129, 0.9) (green)
  Text: white
  Icon: TrendingUp

Skill Tags:
  Background: rgba(255, 255, 255, 0.25)
  Text: white
  Font size: 10px

Apply Button:
  Background: white
  Text: #667eea (purple)
  Hover: translateX(2px) + shadow

Text Colors:
  Primary: white
  Secondary: rgba(255, 255, 255, 0.9)
  Tertiary: rgba(255, 255, 255, 0.85)
```

## States

### Loading State
```
┌─ ✨ Jobs Matched to Your Skills ──────────────── [↻] ────┐
│                                                             │
│                         ⟳                                   │
│                                                             │
│              Finding jobs that match your skills...        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─ ✨ Jobs Matched to Your Skills ──────────────── [↻] ────┐
│                                                             │
│                         💼                                  │
│                                                             │
│        No matching jobs found. Complete your profile       │
│              to get better matches.                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Refresh Animation
```
[↻]  →  [⟳]  (spinning)
```

## Responsive Behavior

### Desktop (> 1024px)
- Full width widget
- 5 job cards visible
- All metadata displayed

### Tablet (768px - 1024px)
- Full width widget
- 3-4 job cards visible
- Salary may wrap to new line

### Mobile (< 768px)
- Full width widget
- 2-3 job cards visible
- Stacked layout for metadata
- Smaller font sizes

## Interactions

1. **Manual Refresh**
   - Click [↻] button
   - Button spins during fetch
   - Jobs update when complete

2. **Apply to Job**
   - Click "Apply Now" button
   - Opens job link in new tab
   - Button slides right on hover

3. **Auto Refresh**
   - Happens every 5 minutes
   - Silent update (no loading state)
   - Timestamp updates

4. **Toggle Widget**
   - Click "Customize" in dashboard header
   - Toggle "Skill-Matched Jobs" switch
   - Widget appears/disappears

## Data Flow

```
User Profile (skills)
        ↓
Backend /api/jobs/skill-match
        ↓
Fetch External Jobs
        ↓
Calculate Match Scores
        ↓
Sort by Score
        ↓
Return Top 10
        ↓
Frontend Component
        ↓
Display Top 5
        ↓
Auto-refresh every 5 min
```

## Match Score Calculation

```
User Skills: ["React", "Node.js", "Python", "AWS"]
Job Description: "Looking for React and Node.js developer..."

Matched Skills: ["React", "Node.js"]
Match Score: (2 / 4) * 100 = 50%

Display: 50% badge in green
```

## Icons Used

- ✨ Sparkles (widget title)
- ↻ RefreshCw (refresh button)
- 💼 Briefcase (company)
- 📍 MapPin (location)
- 📈 TrendingUp (match score)
- → ExternalLink (apply button)
- ⟳ Loader2 (loading spinner)
