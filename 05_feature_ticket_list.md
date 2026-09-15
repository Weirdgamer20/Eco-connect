# EcoConnect --- Feature Ticket List

## Epic E01 --- Project Foundation

### EC-001 --- Repository structure

**Priority:** P0\
Create frontend/backend/shared types structure.

### EC-002 --- Environment configuration

**Priority:** P0\
Set up environment variables and secret handling.

### EC-003 --- CI pipeline

**Priority:** P1\
Lint, typecheck, unit tests, build.

### EC-004 --- Error handling

**Priority:** P0\
Global API and frontend error model.

------------------------------------------------------------------------

## Epic E02 --- Authentication & Identity

### EC-010 --- Citizen registration

**P0**

### EC-011 --- Mobile verification

**P0**

### EC-012 --- Aadhaar verification integration boundary

**P0** Create provider abstraction. Do not hard-code a specific provider
until the authorized integration is known.

### EC-013 --- One verified identity constraint

**P0**

### EC-014 --- Anonymous public identity mode

**P0**

### EC-015 --- Citizen profile

**P1**

------------------------------------------------------------------------

## Epic E03 --- Grievance Submission

### EC-020 --- Report Problem CTA

**P0**

### EC-021 --- GPS location capture

**P0**

### EC-022 --- Map confirmation

**P0**

### EC-023 --- Category selection

**P0**

### EC-024 --- Problem description

**P0**

### EC-025 --- Two-photo upload

**P0**

### EC-026 --- One-video upload

**P0**

### EC-027 --- 50 MB media limit

**P0**

### EC-028 --- Grievance review screen

**P0**

### EC-029 --- Idempotent submission

**P0**

------------------------------------------------------------------------

## Epic E04 --- AI Evidence Engine

### EC-030 --- AI job queue

**P0**

### EC-031 --- Text classification

**P0**

### EC-032 --- Image classification

**P0**

### EC-033 --- Video frame analysis

**P1**

### EC-034 --- Metadata extraction

**P0**

### EC-035 --- Media consistency analysis

**P1**

### EC-036 --- Duplicate/reuse detection

**P1**

### EC-037 --- AI confidence score

**P0**

### EC-038 --- Needs clarification flow

**P1**

------------------------------------------------------------------------

## Epic E05 --- Civic Issue Intelligence

### EC-040 --- Civic issue entity

**P0**

### EC-041 --- Grievance-to-issue matching

**P0**

### EC-042 --- Text embeddings

**P0**

### EC-043 --- Image embeddings

**P1**

### EC-044 --- Vector search

**P0**

### EC-045 --- Geographic candidate filtering

**P0**

### EC-046 --- Issue clustering

**P0**

### EC-047 --- Existing issue merge

**P1**

------------------------------------------------------------------------

## Epic E06 --- Severity & Priority

### EC-050 --- Safety assessment

**P0**

### EC-051 --- Environmental impact assessment

**P0**

### EC-052 --- People affected estimate

**P0**

### EC-053 --- Geographic spread

**P0**

### EC-054 --- Severity assessment

**P0**

### EC-055 --- Time-unresolved factor

**P0**

### EC-056 --- Citizen support factor

**P0**

### EC-057 --- Government rule engine

**P0**

### EC-058 --- Priority decision record

**P0**

------------------------------------------------------------------------

## Epic E07 --- Authority Routing

### EC-060 --- Jurisdiction model

**P0**

### EC-061 --- Department model

**P0**

### EC-062 --- Official model

**P0**

### EC-063 --- Category-to-authority rules

**P0**

### EC-064 --- Location-to-jurisdiction rules

**P0**

### EC-065 --- AI authority candidate generation

**P0**

### EC-066 --- Deterministic authority validation

**P0**

### EC-067 --- Automatic rerouting

**P0**

------------------------------------------------------------------------

## Epic E08 --- Official Workflow

### EC-070 --- Official login

**P0**

### EC-071 --- Official inbox

**P0**

### EC-072 --- Issue detail

**P0**

### EC-073 --- Accept/respond

**P0**

### EC-074 --- Reject with reason

**P0**

### EC-075 --- Mark in progress

**P0**

### EC-076 --- Mark resolved

**P0**

### EC-077 --- Resolution evidence

**P1**

------------------------------------------------------------------------

## Epic E09 --- Notifications

### EC-080 --- Email provider

**P0**

### EC-081 --- SMS provider

**P0**

### EC-082 --- Notification templates

**P0**

### EC-083 --- Delivery status

**P1**

### EC-084 --- Retry system

**P0**

### EC-085 --- Nearby issue push

**P1**

### EC-086 --- Notification preferences

**P1**

------------------------------------------------------------------------

## Epic E10 --- Community

### EC-090 --- Public issue feed

**P0**

### EC-091 --- Tinder-style issue cards

**P0**

### EC-092 --- Upvote / experiencing

**P0**

### EC-093 --- Downvote / not experiencing

**P0**

### EC-094 --- One vote per user per issue

**P0**

### EC-095 --- Public comments

**P1**

### EC-096 --- Comment moderation

**P1**

### EC-097 --- 150 m nearby filtering

**P1**

------------------------------------------------------------------------

## Epic E11 --- Resolution Verification

### EC-100 --- 48-hour confirmation window

**P0**

### EC-101 --- Citizen confirms fixed

**P0**

### EC-102 --- Citizen rejects fixed

**P0**

### EC-103 --- New evidence submission

**P1**

### EC-104 --- AI reopen review

**P0**

### EC-105 --- Community evidence aggregation

**P1**

### EC-106 --- Reopen issue

**P0**

### EC-107 --- Automatic closure

**P0**

------------------------------------------------------------------------

## Epic E12 --- SLA & Accountability

### EC-110 --- SLA configuration

**P0**

### EC-111 --- Serious issue 24-hour trigger

**P0**

### EC-112 --- Standard \>10-day trigger

**P0**

### EC-113 --- Warning #1

**P0**

### EC-114 --- Grace period

**P0**

### EC-115 --- Warning #2

**P0**

### EC-116 --- Escalation

**P0**

### EC-117 --- Fact-based accountability record

**P0**

### EC-118 --- Official dispute

**P1**

### EC-119 --- Community accountability poll

**P1**

------------------------------------------------------------------------

## Epic E13 --- Trust & Fraud

### EC-120 --- Suspicious account state

**P0**

### EC-121 --- Media fraud signals

**P1**

### EC-122 --- Repeated invalid submission detection

**P1**

### EC-123 --- FAKER state

**P0**

### EC-124 --- Verified contribution counting

**P1**

### EC-125 --- Trust restoration

**P1**

------------------------------------------------------------------------

## Epic E14 --- Rewards

### EC-130 --- Valid grievance eligibility

**P1**

### EC-131 --- Coupon issuance

**P1**

### EC-132 --- Coupon history

**P1**

### EC-133 --- Official recognition

**P1**

### EC-134 --- Department ranking

**P1**

------------------------------------------------------------------------

## Epic E15 --- Security

### EC-140 --- RBAC

**P0**

### EC-141 --- Resource-level authorization

**P0**

### EC-142 --- Rate limiting

**P0**

### EC-143 --- Secure file validation

**P0**

### EC-144 --- Malware scanning

**P1**

### EC-145 --- Audit events

**P0**

### EC-146 --- Immutable event history

**P0**

### EC-147 --- Secret management

**P0**

### EC-148 --- Security test suite

**P0**

------------------------------------------------------------------------

## Epic E16 --- Frontend

### EC-150 --- Government/civic visual system

**P0**

### EC-151 --- 2D illustration system

**P1**

### EC-152 --- Mobile-first report flow

**P0**

### EC-153 --- Public issue cards

**P0**

### EC-154 --- Swipe interaction

**P0**

### EC-155 --- Accessible vote buttons

**P0**

### EC-156 --- Citizen dashboard

**P0**

### EC-157 --- Official dashboard

**P0**

### EC-158 --- Notifications UI

**P1**

### EC-159 --- Responsive layout

**P0**

### EC-160 --- Accessibility

**P0**

------------------------------------------------------------------------

## Hackathon implementation order

### Sprint 1

-   Foundation
-   Auth
-   Database
-   Citizen profile
-   Grievance creation
-   Media upload
-   Location

### Sprint 2

-   AI analysis
-   Issue clustering
-   Priority
-   Authority routing
-   Official dashboard

### Sprint 3

-   Public issue cards
-   Voting
-   Resolution
-   Citizen verification
-   Notifications

### Sprint 4

-   SLA
-   Warnings
-   Accountability
-   Fraud
-   Rewards
-   Security hardening
-   Demo polish

## Definition of Done for P0

A P0 ticket is not done until: - API behavior is tested - authorization
is tested - failure path is defined - UI handles loading/error/success -
relevant event is logged - state transition is deterministic
