# EcoConnect --- Product Requirements Document (PRD)

**Version:** 0.1 --- Research-backed baseline\
**Product:** EcoConnect\
**V1 Scope:** Single fixed jurisdiction/locality; exact official
location name is still a placeholder until confirmed.

## 1. Product vision

EcoConnect is a community-first civic issue reporting and accountability
platform.

Its core loop is:

> Citizen evidence → AI analysis → responsible authority routing →
> official action → citizen/community verification → closure or
> escalation.

EcoConnect is not intended to insert a human field inspector or
EcoConnect administrator between the citizen and the responsible
authority.

## 2. Problem

Citizens often know that a civic problem exists but may not know which
authority is responsible. Existing reporting channels can be fragmented,
difficult to track, and weak at public verification.

EcoConnect addresses this by making the system responsible for
classification, geographic routing, issue clustering, prioritization,
notifications, SLA tracking, and evidence-backed accountability.

## 3. Product principles

1.  **Community-first:** citizens collectively surface and verify
    problems.
2.  **AI-assisted, rule-constrained:** AI performs analysis, but
    government-defined rules constrain priority and routing decisions.
3.  **No operational middleman:** EcoConnect does not assign a human
    field inspector.
4.  **Evidence-first:** photos, video, text, time, metadata, and
    location are treated as evidence signals.
5.  **Fact-based accountability:** the system records observable
    timelines and actions rather than making unsupported legal
    accusations.
6.  **One verified identity:** V1 uses Aadhaar-linked identity
    verification plus mobile verification; Aadhaar is for
    authentication/uniqueness, not public display.
7.  **Public transparency with privacy:** public locations are
    approximate and citizen identity can remain anonymous.
8.  **Automation by default:** routine routing, notification, SLA
    monitoring and escalation are automated.

## 4. V1 actors

### Citizen

-   Authenticate
-   Customize profile
-   Submit grievances
-   Upload up to 2 photos and 1 video (50 MB maximum)
-   View public civic issues
-   Upvote: "I am also experiencing this problem"
-   Downvote: "I am not experiencing this problem"
-   Comment
-   Confirm or reject claimed resolution
-   Configure nearby notifications
-   Receive valid-complaint coupons

### Responsible official

-   Receive grievance by email/SMS
-   View issue, evidence, AI analysis and supporting reports
-   Accept/respond
-   Reject with reason when the issue is outside jurisdiction
-   Mark in progress
-   Mark resolved
-   Provide resolution information/evidence
-   Respond to accountability escalation
-   Receive recognition and contribute to department ranking

### AI system

-   Text classification
-   Image/video analysis
-   Evidence consistency analysis
-   Metadata analysis
-   Duplicate/reuse detection
-   Issue clustering
-   Severity assessment
-   Impact assessment
-   Geographic analysis
-   Authority identification
-   Confidence scoring
-   Reopen/closure review
-   Fraud/suspicious-account detection

### Notification system

-   Email
-   SMS
-   Push notifications

## 5. Core user journey

1.  Citizen logs in.
2.  Citizen opens **Report a Problem**.
3.  Citizen captures/selects location and confirms it.
4.  Citizen selects category.
5.  Citizen writes problem description.
6.  Citizen uploads up to two photographs.
7.  Citizen optionally uploads one video up to 50 MB.
8.  System submits the grievance.
9.  AI analyzes evidence.
10. AI searches existing civic issues for a likely match.
11. If matched, the grievance becomes supporting evidence for the
    existing civic issue.
12. Otherwise, a new civic issue is created.
13. AI determines severity/priority under government rules.
14. AI identifies the responsible authority/official.
15. EcoConnect sends a structured notice by email/SMS.
16. Issue becomes visible in the public feed according to privacy rules.
17. Citizens may support or reject the reported condition.
18. Official takes action and marks the issue resolved.
19. Original reporter receives a 48-hour confirmation window.
20. If confirmed, issue closes.
21. If rejected, AI reviews the new evidence/community signals and may
    reopen the issue.
22. SLA engine monitors unresolved issues.
23. Serious issues can trigger a 24-hour escalation; ordinary issues can
    trigger escalation after more than 10 days.
24. Two-stage warning process precedes public accountability.
25. Public accountability records remain factual and evidence-based.

## 6. Grievance vs civic issue

EcoConnect separates:

-   **Grievance:** one citizen's report.
-   **Civic Issue:** the underlying real-world problem represented by
    one or many grievances.

Example:

`100 citizen grievances → AI clustering → 1 civic issue + 100 supporting reports`

This prevents duplicate reports from becoming duplicate operational
tasks.

## 7. V1 categories

The product taxonomy may contain:

-   Air pollution
-   Water pollution
-   Noise pollution
-   Plastic pollution
-   Waste burning
-   Illegal dumping
-   Sewage leakage
-   Water contamination
-   Illegal tree cutting
-   Construction pollution
-   Potholes
-   Road damage
-   Broken infrastructure
-   Traffic hazards
-   Drain blockage
-   Water leakage
-   Unsafe public spaces
-   Encroachment
-   Carbon hotspots
-   Heat-island zones
-   Urban flooding
-   Water-stress zones
-   Waste hotspots
-   Air-quality hotspots
-   Renewable-energy adoption

Operational routing for the hackathon should initially be limited to the
three agreed departments/authority groups: air quality, waste management
and road condition, unless the fixed jurisdiction requires different
official structures.

## 8. Public issue card

The public issue feed uses a swipe-based interaction.

A card can contain:

-   Issue image
-   Category
-   Approximate location
-   Report count
-   Support count
-   Not-experiencing count
-   Status
-   Severity/priority indicator
-   Timeline
-   Responsible department
-   Public official accountability information only when the escalation
    policy has been satisfied

Citizen identity is not publicly exposed for anonymous reports.

## 9. Resolution rules

Official: `Mark Resolved`

Then: `48-hour citizen confirmation window`

-   Confirm → Closed
-   Reject → AI/community verification
-   No response → automatic closure under the current V1 rule

This automatic closure rule is a risk item and must be tested
aggressively before production.

## 10. Accountability rules

### Trigger conditions

-   Serious issue: 24-hour trigger
-   Other unresolved issue: \>10 days
-   Severity may accelerate escalation

### Two-stage process

1.  Warning #1
2.  Grace period
3.  Warning #2
4.  Escalation

If an official disputes the accountability record: - Official must
provide a reason/evidence. - Supporting citizens are notified. -
Anonymous community poll may be used. - EcoConnect publishes factual
system evidence, not a legal verdict.

## 11. Trust and fraud

Suspicious media or repeated invalid submissions can cause a user to
enter a verification/fraud state.

The product should not permanently label a user "FAKER" from one weak
signal. A safer implementation is:

`Trusted → Suspicious → Verification → Repeated invalid activity → FAKER`

Rehabilitation:
`FAKER → 10 independently verified legitimate contributions → trust restored`

## 12. Notifications

Nearby civic issue notifications use a 150 m radius by default.

Citizens can configure: - Radius/preferences - Categories - Notification
types

## 13. Rewards

Citizen: - Coupon eligibility for a valid grievance.

Official: - Public appreciation/recognition. - Departmental ranking.

## 14. V1 non-functional requirements

-   Secure authentication
-   Strong authorization
-   Auditability
-   Idempotent grievance creation
-   Media upload limits
-   Rate limiting
-   Abuse detection
-   Reliable notification retries
-   Deterministic state transitions
-   AI confidence tracking
-   Explainable decision records
-   Privacy-preserving public location
-   Recovery from AI/provider failures

## 15. Product risks

### R1 --- AI hallucinated routing

Mitigation: jurisdiction/authority registry + deterministic rules +
confidence thresholds.

### R2 --- False accusations

Mitigation: publish factual timelines and evidence; never generate legal
guilt statements.

### R3 --- Fake media

Mitigation: metadata + perceptual hashing + image/video analysis +
temporal/location consistency.

### R4 --- Vote manipulation

Aadhaar-backed identity reduces multi-account abuse, but does not
eliminate collusion. Voting must still be rate-limited and behavior
monitored.

### R5 --- Automatic closure loophole

The 48-hour auto-close rule can falsely close unresolved issues. V1
should retain a reopen path and monitor non-response rates.

### R6 --- AI provider outage

Store an explicit `AI_PENDING` state; do not silently route an
unreviewed complaint.

## 16. Success criteria for the hackathon

A successful V1 demo must demonstrate:

1.  Verified citizen login.
2.  Complaint creation with media and location.
3.  AI analysis.
4.  Duplicate/issue clustering.
5.  Priority calculation.
6.  Responsible authority identification.
7.  Automatic email/SMS notice.
8.  Public issue card.
9.  Upvote/downvote semantics.
10. Official resolution.
11. Citizen verification.
12. Reopen path.
13. SLA warning/escalation.
14. Evidence-backed accountability record.

## 17. Research inspiration

The architecture should take inspiration from existing civic systems
rather than copy their implementation.

-   **Open311 GeoReport v2:** standardized civic service-request model
    for location-based issues, service discovery, service types, request
    creation and status tracking. It explicitly targets issues such as
    potholes and street cleaning. citeturn0search0
-   **FixMyStreet:** automatically determines the appropriate authority
    from problem location/type and sends reports by email or Open311;
    reported problems are public and can receive updates. This is
    especially close to EcoConnect's routing concept.
    citeturn1search6turn1search7
-   **Libre311:** open-source Open311 implementation with citizen
    submission, map/list/table views, REST API, authentication,
    geocoding and object storage. Its architecture is useful as a
    reference for the non-AI civic service layer. citeturn0search1
-   **Ushahidi:** open-source crowdsourced information collection,
    categorization, geolocation and publication, including SMS/email and
    other inputs. Useful for the community evidence model.
    citeturn1search4turn1search10
-   **Decidim:** open-source participatory-democracy infrastructure with
    identity/authorization, proposals, comments, accountability and
    participation modules. Useful for the community
    participation/accountability layer. citeturn1search0
-   Research on 311 data shows that civic requests can be used as
    spatial/temporal signals of urban conditions and decision support,
    supporting EcoConnect's issue-history and geographic analytics
    direction. citeturn2academia12turn2academia13
-   A 2026 research paper on automated classification/routing of citizen
    appeals describes a microservice architecture using
    NLP/deep-learning approaches for classification and routing,
    supporting the feasibility of an AI routing layer.
    citeturn2academia15

## 18. Important conclusion

EcoConnect is not novel because "citizens can report potholes." That
capability already exists.

The novel combination we should pursue is:

> **AI multimodal evidence analysis + civic-issue clustering +
> jurisdiction routing + community verification + autonomous SLA
> escalation + fact-based public accountability.**

That combination should be the hackathon innovation claim, subject to
validation against the final prior-art search.
