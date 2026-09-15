# EcoConnect --- Security & Access Control Document

## 1. Security objective

EcoConnect processes: - identity information - mobile numbers -
potentially sensitive location data - citizen-generated evidence -
government official identity/contact information - public accountability
records

Security must therefore be treated as a core system property.

The baseline should follow OWASP ASVS for application security
verification and OWASP API Security Top 10 for API-specific threats.
citeturn3search8turn3search2

## 2. Identity architecture

### Citizen identity

V1 requirements: - Aadhaar-based identity verification - mobile
verification - one verified EcoConnect identity per person

Aadhaar should be used for verification/uniqueness. EcoConnect should
minimize retention of Aadhaar data and should not expose it.

Preferred architecture:

`Identity provider/authorized verification service → verification result/token → EcoConnect`

rather than storing raw Aadhaar information unless legally and
technically required.

## 3. Anonymous reporting

Anonymous public reporting means:

-   Citizen identity remains protected from public users.
-   Internal access is minimized.
-   Public cards display no citizen identity for anonymous reports.
-   Approximate location is displayed instead of exact coordinates.

Anonymous does not mean the system should be incapable of protecting
itself against abuse.

## 4. Roles

### Citizen

Can: - create own grievances - view public issues - vote once per
issue - comment - view own grievance history - confirm/reject own
resolution - manage own notifications

Cannot: - modify another citizen's grievance - view private identity
verification - access official-only data

### Official

Can: - view issues routed to their department/jurisdiction - update
assigned issue status - provide response/reason - mark resolution -
respond to warnings/disputes

Cannot: - modify AI history - modify citizen identity verification -
delete evidence - change immutable accountability events

### System workers

Can: - process jobs - write AI analysis - trigger notifications -
execute SLA transitions

Workers should have narrow service permissions.

## 5. Access control model

Use RBAC plus resource-level authorization.

Example:

`Citizen → grievance.owner_id == authenticated_user.id`

`Official → issue.department_id == official.department_id AND jurisdiction match`

Never rely solely on frontend-hidden buttons.

The API must enforce authorization.

## 6. API security

Mitigate: - Broken Object Level Authorization - Broken Authentication -
Broken Object Property Level Authorization - Unrestricted Resource
Consumption - Broken Function Level Authorization - SSRF - Security
misconfiguration - unsafe third-party API consumption

These map directly to risks identified by OWASP API Security Top 10.
citeturn3search2

## 7. Input security

Validate all: - JSON - query parameters - path IDs - uploaded files -
comments - official responses

Use schema validation such as Zod.

Never trust: - MIME type supplied by client - filename - EXIF -
coordinates - category supplied by client - status supplied by client

## 8. Media security

Pipeline:

`Upload → quarantine → file validation → malware scan → metadata extraction → AI analysis → safe storage → public derivative`

Controls: - max 2 images - max 1 video - max 50 MB video - allowlisted
MIME types - generated storage keys - no user-controlled filesystem
paths - image transcoding - video transcoding - strip unnecessary
metadata from public derivatives

## 9. Location privacy

Store: - exact coordinates internally where operationally necessary -
approximate location for public display

Do not expose: - raw GPS - hidden EXIF GPS - precise citizen location

Public issue cards should use a generalized point/area.

## 10. Voting security

Aadhaar-linked identity prevents multiple ordinary accounts but does not
prevent collusion.

Therefore: - one vote per verified user per issue - unique database
constraint - rate limits - anomaly detection - preserve vote history -
do not allow users to vote repeatedly by toggling without tracking

Vote meanings: - Upvote = "I am also experiencing this problem" -
Downvote = "I am not experiencing this problem"

## 11. AI security

AI output must never be trusted as executable authority.

AI returns structured data:

``` json
{
  "category": "...",
  "confidence": 0.0,
  "severity": "...",
  "authority_candidates": [],
  "evidence_flags": []
}
```

Then deterministic application logic validates it.

Never allow AI-generated text to directly: - execute commands - change
permissions - delete records - expose private information - publish an
official accountability record without policy validation

## 12. AI decision trace

Every material AI decision stores: - model/provider - model version -
prompt/version if applicable - input artifact IDs - output -
confidence - timestamp - policy/rule version - resulting system action

This creates an auditable decision trail.

## 13. Accountability security

Accountability events must be append-only.

Example:

`Issue created → routed → notified → SLA started → warning 1 → warning 2 → escalation`

Do not allow a normal API endpoint to edit historical events.

Corrections should create a new event.

## 14. Official dispute security

Official dispute: - requires authentication - requires reason -
optionally requires evidence - creates immutable event - cannot delete
original accountability event

Public display should distinguish: - system-recorded fact - official
response - community poll result

## 15. Comments

All public comments require: - authenticated user - content validation -
moderation - rate limiting - report/flag capability

AI moderation can detect: - harassment - personal data - threats -
spam - unsupported accusations

## 16. Fraud / FAKER state

Suggested state machine:

`TRUSTED → SUSPICIOUS → VERIFICATION → FAKER`

The system should use multiple signals: - repeated invalid submissions -
reused media - impossible metadata - unrelated media - repeated false
community claims - anomalous behavior

Rehabilitation:
`10 independently verified legitimate contributions → candidate for restoration`

Do not let the user self-remove the FAKER status.

## 17. Secrets

Never place in: - frontend bundle - Git repository - database records -
AI prompts

Use environment secrets/secret manager.

Required secrets include: - database credentials - email API key - SMS
API key - object-storage credentials - AI API credentials - identity
verification credentials

## 18. Logging

Log: - authentication events - authorization failures - grievance state
changes - AI decisions - notification delivery - official actions -
escalation events - fraud signals

Do not log: - raw Aadhaar - unnecessary private media - full sensitive
identity data

## 19. Security testing

V1: - unit tests - API authorization tests - upload abuse tests - IDOR
tests - rate-limit tests - XSS tests - injection tests - CSRF assessment
where applicable - dependency scanning - secret scanning - SAST - basic
DAST - Playwright security-flow tests

Security acceptance should be mapped to OWASP ASVS controls.
citeturn3search8
