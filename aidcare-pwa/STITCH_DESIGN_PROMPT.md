# AidCare - Complete Design System Prompt for Google Stitch

## Application Overview

**Product Name:** AidCare Pro
**Tagline:** AI-Powered Medical Triage for Community Health Workers
**Platform:** Progressive Web App (PWA) - Works offline, mobile-first
**Primary Users:** Community Health Workers (CHWs) in low-resource settings
**Purpose:** Enable rapid, AI-assisted patient triage using voice or text input with WHO guideline-backed recommendations

---

## Design Philosophy & Requirements

### Core Principles
- **Medical-Grade Professionalism**: Clean, trustworthy, clinical interface
- **Minimal & Modern**: Contemporary design with subtle depth and polish
- **Accessible**: Clear typography, high contrast, easy to use in field conditions
- **Fast & Responsive**: Optimized for mobile devices, works offline
- **Progressive Enhancement**: Graceful degradation for low-bandwidth scenarios

### Visual Style
- **Color Palette**:
  - Primary: Cyan/Teal gradients (#0ea5e9 → #06b6d4)
  - Secondary: Emerald green for success (#10b981)
  - Warning: Amber (#f59e0b)
  - Danger: Rose/Red (#ef4444)
  - Neutrals: Slate grays (#0f172a to #f8fafc)
- **Typography**: System fonts, bold headings (700 weight), -0.03em letter spacing for modern feel
- **Corners**: Rounded (8-16px) for friendly, approachable feel
- **Shadows**: Layered, subtle shadows for depth (0 4px 24px rgba(0,0,0,0.06))
- **Gradients**: Linear gradients for buttons, backgrounds, and progress indicators
- **Spacing**: Generous padding, breathing room between elements

---

## Complete Page Structure & Features

### 1. **Main Dashboard / Triage Input Page**

**Layout:**
- Fixed left sidebar (260px wide)
- Main content area with gradient background
- Header with breadcrumbs
- Central card for primary interaction

**Sidebar Components:**
- Logo area:
  - "AidCare Pro" title (1.625rem, bold)
  - "Community Health Tool" subtitle (uppercase, 0.6875rem)
  - Medical cross icon
- Navigation menu:
  - Home
  - Active Triage (highlighted with gradient)
  - Patient History
  - Offline Records
  - Each nav item: icon + label, rounded corners, gradient on active state
- Sync status indicator:
  - Pulsing green dot
  - "Local Cache Active" text
  - Shows offline capability status

**Main Content States:**

#### State 1: Initial / Ready to Record
- Large centered card with:
  - Heading: "New Patient Assessment"
  - Subtitle: "Begin by recording patient symptoms or enter details manually"
  - Large microphone button (gradient, elevated shadow)
  - OR divider
  - "Switch to Text Input" button (secondary style)

#### State 2: Recording in Progress
- Animated waveform visualization:
  - 40 vertical bars with gradient fills
  - Pulsing animation
  - Bars vary in height to simulate audio input
- Timer display:
  - Large, bold numbers (3.5rem)
  - MM:SS format
  - Split display with "MIN" and "SEC" labels
- Stop recording button:
  - Large square button with gradient
  - Prominent placement

#### State 3: Processing / Loading
- Progress card showing:
  - "Analyzing Assessment" heading
  - Subtitle: "Synthesizing voice data into clinical insights..."
  - Progress bar with gradient fill and glow effect
  - Percentage indicator (large, bold)
  - Multi-step progress tracker:
    - Step icons (square with rounded corners, gradient fills)
    - "Transcribing voice input" (complete ✓)
    - "Analyzing symptoms and history" (processing ⟳)
    - "Applying WHO clinical guidelines" (pending ○)
  - Security notice at bottom:
    - Green gradient background
    - Lock icon
    - HIPAA compliance message

#### State 4: Error State
- Error icon with warning badge
- Clear error message
- "Retry Voice Input" button (primary)
- OR divider
- "Switch to Text Input" button (secondary)

**Info Banner (Always Visible):**
- Cyan gradient background
- Shield icon
- "Data Auto-Saved" heading
- Subtext about local security

---

### 2. **Triage Results / Assessment Report Page**

**Layout:**
- Two-column layout (2/3 main, 1/3 sidebar)
- Full-width header section
- Scrollable content area

**Header Section:**
- Title: "Assessment Report" (3xl, bold)
- Date & time stamps with icons
- Action buttons:
  - Print button (secondary)
  - New Assessment button (primary gradient)

**Main Column (Left):**

#### Urgency Banner (Full Width)
- Three urgency levels with distinct styling:

  **High Urgency:**
  - Rose/red gradient background
  - Large warning icon in rounded square
  - "Urgent Referral Required" heading
  - "HIGH Priority" badge
  - Action-oriented description

  **Medium Urgency:**
  - Amber/orange gradient background
  - Priority icon
  - "Monitor Closely" heading
  - "MEDIUM Priority" badge

  **Low Urgency:**
  - Emerald green gradient background
  - Checkmark icon
  - "Routine Care" heading
  - "LOW Priority" badge

#### Extracted Symptoms Section
- Grid/flex layout of symptom pills
- Cyan gradient background on pills
- Border around each pill
- Icon: medical information

#### Vital Signs Grid (if available)
- 4-column responsive grid
- Each vital card shows:
  - Label (small, gray)
  - Value (large, bold)
  - Unit (tiny, lighter)
  - Warning indicator if abnormal
- Hover effects with shadow transitions

#### Clinical Summary Card
- White background, rounded corners
- "AI Analysis" badge (gradient)
- Medical notes icon
- Large, readable paragraph text
- Prose styling for readability

#### Guidelines Accordion
- Collapsible section
- Book icon
- "Referenced Guidelines" heading
- Expand/collapse animation
- Bulleted list when expanded

**Right Column (Sidebar):**

#### Recommended Actions Card
- Prominent card with ring shadow
- Checklist icon
- Interactive checkboxes:
  - Custom styled checkboxes
  - Cyan gradient when checked
  - Hover states on each item
  - Check animation
- Important Notes section (if applicable):
  - Amber warning icon
  - Amber gradient background
  - List of critical notes

#### Nearest Facility Card
- Map placeholder with icon
- Facility name overlay
- "Open 24/7" status badge
- Two action buttons:
  - Directions
  - Call
- Phone and map icons

#### Legal Disclaimer
- Small gray text
- Centered at bottom
- "AI-assisted assessment for support only" message

---

### 3. **Patient History Page** (Currently Placeholder)

**Required Design:**
- Table/card view of previous assessments
- Filters and search functionality
- Each history entry should show:
  - Patient name/ID (anonymized)
  - Date & time of assessment
  - Urgency level indicator
  - Quick summary
  - "View Full Report" action
- Empty state illustration
- Pagination or infinite scroll

**Features to Design:**
- Search bar with icon
- Date range filters
- Urgency level filters
- Export functionality
- Bulk actions

---

### 4. **Offline Records Page** (Currently Placeholder)

**Required Design:**
- Sync status indicator
- List of cached records
- Storage usage meter
- Each record showing:
  - Sync status (synced/pending)
  - Offline availability
  - Last modified date
  - Size indicator
- Actions:
  - Manual sync trigger
  - Clear cache option
  - Download for offline access

**Visual Elements:**
- Cloud sync icons
- Download indicators
- Progress bars for sync
- Storage usage visualization

---

### 5. **Text Input Form** (Alternative to Voice)

**Design Requirements:**
- Clean form layout
- Form fields:
  - Patient symptoms (large textarea)
  - Duration of symptoms
  - Additional context
  - Optional vitals input
- Character counter
- Submit button (primary gradient)
- Cancel/Reset options
- Validation states
- Help text/placeholders

---

## Component Library to Design

### Buttons
1. **Primary Button:**
   - Gradient background (#0ea5e9 → #06b6d4)
   - White text
   - Rounded corners (10px)
   - Elevated shadow
   - Hover: lift effect (-2px transform)
   - Icon + label layout

2. **Secondary Button:**
   - White background
   - Gray border
   - Gray text
   - Lighter shadow
   - Hover: subtle lift and border color change

3. **Icon Button:**
   - Square/circle
   - Gradient or white background
   - Shadow on hover
   - Various sizes (sm, md, lg)

### Cards
- **Standard Card:** White, rounded (16px), subtle shadow
- **Elevated Card:** Stronger shadow, ring effect
- **Info Card:** Gradient background, icon, heading, description
- **Action Card:** Interactive, hover states

### Forms
- **Text Input:** Rounded, border, focus states with cyan outline
- **Textarea:** Multi-line, auto-resize
- **Checkbox:** Custom styled, gradient when checked
- **Radio Buttons:** Similar to checkbox style
- **Select Dropdown:** Styled dropdown with custom arrow

### Navigation
- **Sidebar Nav Item:**
  - Default: Transparent, gray text
  - Active: Gradient background, white text, subtle glow
  - Hover: Light gray background
  - Icon (18px) + label

### Progress Indicators
- **Progress Bar:**
  - Track: Light gray, rounded (20px)
  - Fill: Gradient with glow effect
  - Smooth animation
- **Loading Spinner:** Gradient spinner or dots
- **Step Indicator:**
  - Numbered steps
  - Icons for states (complete, processing, pending)
  - Connecting lines

### Badges & Pills
- **Status Badge:** Rounded full, small text, color-coded
- **Symptom Pill:** Cyan gradient background, rounded
- **Priority Badge:** Uppercase text, color-coded by urgency

### Alerts & Notifications
- **Info Alert:** Cyan gradient, info icon
- **Success Alert:** Green gradient, checkmark
- **Warning Alert:** Amber gradient, warning icon
- **Error Alert:** Red gradient, error icon

### Icons
- Use Material Symbols Outlined
- Consistent 18-24px sizing
- Proper semantic meaning

---

## Responsive Design Requirements

### Mobile (< 768px)
- Collapsible sidebar (hamburger menu)
- Single column layouts
- Larger touch targets (min 44px)
- Bottom navigation option
- Full-width cards
- Stacked button groups

### Tablet (768px - 1024px)
- Sidebar visible or slide-over
- Two-column where appropriate
- Optimized spacing

### Desktop (> 1024px)
- Fixed sidebar
- Multi-column layouts
- Hover states fully enabled
- Maximum content width (1200px)

---

## Animations & Interactions

### Micro-interactions
- Button hover: Lift effect (-2px transform)
- Card hover: Shadow increase
- Checkbox check: Scale animation
- Progress bar: Smooth width transition
- Loading states: Pulse animations

### Page Transitions
- Fade in/out
- Slide transitions for mobile nav
- Smooth scrolling

### Feedback
- Click feedback on all interactive elements
- Loading states during async operations
- Success/error toast notifications

---

## Accessibility Requirements

- **WCAG 2.1 AA Compliant**
- Color contrast ratios: 4.5:1 minimum for text
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators visible
- Alt text for all images/icons
- Touch targets: minimum 44x44px
- Reduced motion option

---

## Offline/PWA Specific Design

### Offline Indicator
- Banner or toast when offline
- Sync status in sidebar
- Visual indication of cached vs. live data

### Installation Prompt
- Native-looking install banner
- "Add to Home Screen" guidance
- Benefits of installing

### Loading States
- Skeleton screens for content loading
- Progressive image loading
- Optimistic UI updates

---

## Technical Constraints

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS 4 + CSS-in-JS inline styles
- **Icons:** Material Symbols, React Icons
- **PWA:** next-pwa with service worker
- **Mobile-first:** Design for 360px min width
- **Performance:** Lighthouse score 90+
- **Asset sizes:** Optimized images, lazy loading

---

## Brand Assets Needed

### Logo
- Primary logo (SVG)
- Icon-only version (for favicons)
- Horizontal and stacked layouts
- Dark/light mode versions

### Illustrations
- Empty states
- Error states
- Success confirmations
- Onboarding screens
- Medical/health themed

### Icons
- Custom icon set if needed
- Consistent style across app

---

## Design Deliverables Requested

1. **High-fidelity mockups** for all 5 pages (mobile + desktop)
2. **Interactive prototype** showing key user flows:
   - Voice recording → Results
   - Text input → Results
   - Navigating history
   - Offline mode behavior
3. **Component library** with all reusable components
4. **Design system documentation** with:
   - Color palette with hex codes
   - Typography scale
   - Spacing system
   - Shadow/elevation scale
   - Animation specifications
5. **Asset export:**
   - Icons (SVG)
   - Illustrations (SVG)
   - Logo variations
6. **Responsive breakpoints** for all designs
7. **Dark mode version** (optional but preferred)

---

## User Flows to Design

### Primary Flow: Voice Triage
1. Land on dashboard → Click microphone → Record symptoms → Processing → View results → Take actions

### Secondary Flow: Text Triage
1. Land on dashboard → Switch to text → Fill form → Submit → Processing → View results

### Tertiary Flow: Review History
1. Navigate to history → Browse past assessments → Filter/search → Open report → Print/export

---

## Success Metrics for Design

- Time to complete triage: < 3 minutes
- Error rate: < 5%
- User satisfaction: 4.5/5 stars
- Offline functionality: 100% core features
- Mobile performance: Lighthouse 90+
- Accessibility score: 100/100

---

## Additional Context

**Geographic Context:** Designed for community health workers in rural/remote areas with:
- Limited internet connectivity
- Lower-end Android devices primarily
- Multi-language support needed (future)
- Low digital literacy among some users

**Clinical Context:**
- Follows WHO IMCI guidelines
- Integrates with national standing orders
- Must maintain clinical credibility
- Privacy and HIPAA compliance critical

**Competitive Reference:**
- Look at modern medical apps like: Epic MyChart, MDCalc, UpToDate (but simpler)
- Take inspiration from: Linear (clean UI), Vercel (gradients), Stripe (polish)
- Medical credibility of: Mayo Clinic, NHS apps

---

## Questions to Guide Design Decisions

1. How can we make medical data feel trustworthy and professional while remaining approachable?
2. What visual indicators best communicate urgency without causing alarm?
3. How do we design for offline-first while making sync status clear?
4. What's the optimal balance between information density and clarity?
5. How can we make voice recording feel seamless and natural?
6. What empty states and error states will keep users confident?

---

## Final Notes

This application directly impacts patient care in low-resource settings. The design must:
- Build trust through professionalism
- Enable quick decision-making through clarity
- Work reliably in challenging conditions
- Feel modern without being trendy
- Scale gracefully as features expand

Please create a comprehensive design system that captures the medical professionalism, modern aesthetics, and user-centered approach needed for this critical healthcare tool.
