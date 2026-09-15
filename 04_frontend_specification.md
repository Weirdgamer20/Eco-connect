# EcoConnect --- Frontend Specification

## 1. Visual direction

### Product aesthetic

**Government system + minimal modern civic interface + soft 2D
illustrated world**

The UI should not look like: - a banking dashboard - a generic SaaS
admin panel - a dark cyberpunk AI product - an overloaded government
portal

It should feel: - trustworthy - calm - civic - lightweight -
approachable - slightly illustrated

## 2. 2D visual language

Use a restrained 2D illustration system inspired by clean anime-style
civic artwork:

-   flat 2D characters
-   simple geometric buildings
-   soft outlines
-   minimal shading
-   subtle paper/halftone texture
-   simple environmental motifs
-   no photorealistic 3D
-   no excessive gradients
-   no glossy glassmorphism

The "anime" influence should be a visual illustration language, not a
literal copyrighted anime imitation.

## 3. Palette

### Base

  Token               Hex         Usage
  ------------------- ----------- ----------------------
  `canvas`            `#F4F5F2`   Main background
  `surface`           `#FFFFFF`   Cards
  `surface-soft`      `#ECEDEA`   Secondary surfaces
  `ink`               `#252827`   Main text
  `ink-muted`         `#68706C`   Secondary text
  `border`            `#D7DBD8`   Borders
  `government-blue`   `#315A78`   Primary action
  `civic-green`       `#5D806A`   Positive/environment
  `warning-amber`     `#B8873D`   Warning
  `danger-red`        `#A84F4F`   Critical
  `info-slate`        `#667783`   Informational

The UI should remain predominantly very light gray/white.

## 4. Typography

Recommended: - Inter - IBM Plex Sans - Noto Sans

Use: - strong 700 headings - 500 labels - 400 body - 300/400 secondary
information

Avoid decorative fonts.

## 5. Layout principles

-   generous whitespace
-   12--16 px base spacing
-   16--24 px card padding
-   12--16 px radius
-   thin borders
-   limited shadows
-   strong information hierarchy

## 6. Main navigation

Citizen:

`Home | Report | Issues | My Reports | Notifications | Profile`

Primary CTA:

**REPORT A PROBLEM**

## 7. Home screen

Report-first layout:

``` text
┌────────────────────────────────────┐
│ EcoConnect                 Profile │
├────────────────────────────────────┤
│                                    │
│      REPORT A PROBLEM              │
│                                    │
│   [ 2D civic illustration ]        │
│                                    │
├────────────────────────────────────┤
│ Nearby Issues                      │
│                                    │
│ [Issue Card]                       │
│                                    │
├────────────────────────────────────┤
│ My active reports                  │
└────────────────────────────────────┘
```

## 8. Report flow

### Step 1 --- Location

-   Request GPS permission.
-   Show map.
-   User confirms pin.
-   Display approximate public area preview.

### Step 2 --- Category

Visual category cards.

Example:

`Roads | Waste | Air | Water | Pollution | Other`

### Step 3 --- Description

-   Large text field
-   Character counter
-   Optional suggested prompts

### Step 4 --- Evidence

-   Camera/upload photo
-   Maximum 2 photos
-   Video upload
-   Maximum 50 MB

Show: - upload progress - compression - preview - remove/retry

### Step 5 --- Review

Show:

`Location + category + description + media`

Then:

**SUBMIT GRIEVANCE**

## 9. AI processing state

After submission:

``` text
Checking evidence...
Identifying the issue...
Finding similar reports...
Finding the responsible authority...
Preparing notification...
```

Do not expose internal model reasoning.

Show user-safe status only.

## 10. Issue card

Card hierarchy:

1.  Evidence image
2.  Problem title
3.  Approximate location
4.  Status
5.  Supporting report count
6.  Community signals
7.  Priority indicator

Swipe gestures:

-   Right → experiencing
-   Left → not experiencing

Also provide accessible buttons for users who do not use gestures.

## 11. Issue details

Sections: - Problem - Evidence - Location - Community reports - Status
timeline - Official response - Resolution - Accountability, if
applicable

## 12. Citizen verification

When official marks resolved:

``` text
Is this problem actually fixed?

[ YES, IT IS FIXED ]

[ NO, IT IS STILL THERE ]
```

If "No": - request new evidence where practical - allow text
explanation - start AI review

## 13. Notification UI

Categories: - Nearby issue - Your grievance - Resolution verification -
Official update - Escalation - Reward

## 14. Official dashboard

The official interface should look more administrative than
citizen-facing.

Main sections:

`Inbox | Active Issues | SLA | Resolved | Warnings | Department Performance`

Issue detail:

``` text
Issue
Evidence
AI Assessment
Affected Citizens
Timeline
Official Action
SLA
Resolution
Dispute
```

## 15. Accessibility

Must support: - keyboard navigation - screen readers - visible focus -
sufficient contrast - large touch targets - no gesture-only
functionality - reduced-motion preference - text alternatives for
illustrations

## 16. Responsive targets

Primary: - mobile - tablet

Secondary: - desktop

Citizen UI is mobile-first.

Official dashboard is desktop/tablet-first.

## 17. Component system

Suggested components:

``` text
AppShell
TopBar
BottomNav
PrimaryCTA
IssueCard
IssueCarousel
CategoryCard
LocationPicker
EvidenceUploader
MediaPreview
StatusBadge
Timeline
VoteControl
VerificationPanel
NotificationItem
ProfileCard
OfficialIssueTable
SLABadge
AccountabilityPanel
Illustration
EmptyState
ErrorState
```

## 18. Motion

Use subtle motion: - card swipe - upload progress - status transition -
notification entry - illustration idle animation

Use Framer Motion.

Do not animate critical government/accountability data excessively.

## 19. Design inspiration

Use existing civic products for information architecture, not visual
copying:

-   FixMyStreet: location-based reporting and authority routing.
    citeturn1search6
-   Libre311: public issue views, service request creation and civic
    administration. citeturn0search1
-   Decidim: participation and accountability patterns.
    citeturn1search0
-   Ushahidi: crowdsourced reports and geospatial presentation.
    citeturn1search4

## 20. Visual rule

The product should look like:

> **"A modern civic government application illustrated as a clean 2D
> civic world."**

Not:

> "Anime-themed government software."

The illustration layer supports trust and identity; it must not reduce
seriousness.
