# REKBERIN_AI_CONTEXT

> Machine-oriented project context. Treat this file as the canonical context for future AI/developer sessions. Prefer explicit facts below over assumptions. Do not infer missing credentials, usernames, dates, or architecture details.

## CONTEXT_META

```yaml
project_name: Rekberin
legacy_or_prd_name: RekberGG
project_type: web_platform
domain: escrow_marketplace_for_eFootball_account_trading
language: Indonesian
phase: Phase 1 / MVP
repository: https://github.com/aufaanggara/rekberin
development_duration: 14 calendar days
testing_duration: 7 calendar days
assignment_rule: exactly_one_assignee_per_issue
team_model: 4 fullstack developers
current_plan_status: implementation_in_progress; DEV-01 completed_on_feature_branch; remaining_issues_follow_backlog
```

## AI_OPERATING_RULES

1. Use `Rekberin` as the current product name. Treat `RekberGG` as a legacy/PRD label only.
2. Treat the latest revisions in `CURRENT_DECISIONS` as higher priority than superseded brainstorming notes in the PRD.
3. Before proposing implementation, inspect the repository and preserve existing UI where practical. Existing UI is mostly present but still uses dummy data; the main engineering goal is integration with real database/API data.
4. Do not silently reassign an issue, add a second assignee, expand scope, or change a business rule. Flag the change for PM/team approval.
5. Keep issue scope simple enough for a student team. Use the existing issue IDs and ownership unless the team explicitly approves a revision.
6. Do not assume production payment settlement, legal compliance, or real-money readiness. Dynamic QRIS is an experimental sandbox target in this phase.
7. Do not place secrets, API keys, passwords, payment credentials, or personal financial data in this context file, issues, commits, or examples.
8. If repository state conflicts with this file, report the conflict and identify the affected issue; do not overwrite working code blindly.
9. For future issue descriptions, use the exact structure in `ISSUE_TEMPLATE`.
10. Planning questions must not mutate the repository. Implement changes only when explicitly requested.

## SOURCE_PRIORITY

```text
1. Latest team decisions in CURRENT_DECISIONS
2. Current issue allocation and issue definitions in ISSUE_BACKLOG
3. Current repository implementation/state after inspection
4. PRD requirements that do not conflict with 1-3
5. Historical PRD brainstorming notes (reference only; never use as current behavior when contradicted)
```

## CURRENT_DECISIONS

```yaml
product_name: Rekberin
buyer_authentication: required_before_transaction
payment_proof_upload: required_feature; buyer can upload proof of payment
dynamic_qris: attempt_in_sandbox; no production payment gateway commitment
chat_transport: polling; do not assume WebSocket
dispute_initiator: buyer
testing_owner: Aufa_only
testing_issue_count: 2
testing_issue_names:
  - TEST-01 Menyusun Alur Testing
  - TEST-02 Melakukan Testing
development_duration_days: 14
testing_duration_days: 7
developer_count: 4
all_developers_fullstack: true
one_issue_one_person: true
```

### CURRENT_TEAM

| Member | Permanent role | Current ownership | Issue range |
|---|---|---|---|
| Ibrahim | PM + Fullstack Developer | Transaction and QRIS | DEV-01–DEV-04 |
| Bagas | Fullstack Developer | Database, authentication/role, listing, marketplace integration | DEV-05–DEV-08 |
| Afiq | Fullstack Developer | Chat, review/rating, notifications/status, CI/CD | DEV-09–DEV-12 |
| Aufa | Fullstack Developer + QA/DevOps | Buyer/seller/admin dashboards, testing ownership | DEV-13–DEV-16, TEST-01–TEST-02 |

```yaml
github_usernames:
  Ibrahim: unknown_do_not_invent
  Bagas: unknown_do_not_invent
  Afiq: unknown_do_not_invent
  Aufa: repository_owner_or_maintainer_context_only
```

### WORKLOAD_ESTIMATE

```yaml
Ibrahim:
  development_issue_days: 13  # 3+4+3+3
  testing_issue_days: 0
Bagas:
  development_issue_days: 14  # 3+4+4+3
  testing_issue_days: 0
Afiq:
  development_issue_days: 13  # 4+3+3+3
  testing_issue_days: 0
Aufa:
  development_issue_days: 13  # 3+3+4+3
  testing_issue_days: 7       # 1+6; sole tester
```

`Estimate` is person-days per issue, not the total calendar duration. Issues can run in parallel subject to dependencies and team workflow.

## PRODUCT_DEFINITION

### ONE_SENTENCE

Rekberin is a web escrow marketplace for safer buying and selling of eFootball accounts: buyer, seller, internal escrow admin, and super admin use one platform for listing, payment, transaction tracking, handover, chat, review, and dispute handling.

### PROBLEM

Direct account trading can create payment fraud, unclear handover, weak seller/buyer trust, and dispute handling through scattered chats. Rekberin centralizes the transaction record and escrow workflow.

### USER_PERSONAS

| Persona | Auth role | Main actions |
|---|---|---|
| Buyer | `USER` in buyer context | Browse listing, select admin, create transaction, pay/upload proof, chat, confirm receipt, review, open dispute |
| Seller | `USER` in seller context | Create/manage listing, provide account details, communicate, complete handover |
| Admin Rekber | `ADMIN` | Handle assigned transactions, confirm payment, manage handover, cancel/assist dispute |
| Super Admin | `SUPER_ADMIN` | Manage admin access, monitor platform, resolve escalated dispute |

Business personas buyer and seller are both normal authenticated users. Do not automatically create separate `BUYER` and `SELLER` auth roles unless the team explicitly changes the design. Access to seller actions is controlled by ownership/context; admin actions are controlled by role.

### AUTH_AND_ROLE_RULES

```yaml
auth_roles:
  - USER
  - ADMIN
  - SUPER_ADMIN
buyer_login_required: true
anonymous_user:
  may_browse_public_content: possible_if_existing_route_allows
  may_create_transaction: false
  may_upload_payment_proof: false
  may_open_dispute: false
admin_model: internal_platform_admin; not independent_competing_admins
initial_operator_rule: founder/operator may hold ADMIN + SUPER_ADMIN simultaneously
```

### CORE_FEATURES

```yaml
- authentication: register, login, logout, session, protected routes
- authorization: USER/ADMIN/SUPER_ADMIN access control
- profile_and_user_management: basic profile and admin role management where applicable
- admin_directory: list internal admins and availability/trust information
- marketplace: browse, search, filter, detail listing
- listing_management: seller create, edit, deactivate listing; image/details validation
- transaction: create and monitor escrow transaction from listing
- payment: dynamic QRIS sandbox attempt plus payment-proof upload
- transaction_status: persisted status transitions and activity/timeline data
- handover: admin starts handover; buyer confirms receipt
- chat: per-transaction chat for buyer/seller/admin using polling
- review_rating: post-completion review/rating
- dispute: buyer submits transaction problem; status becomes disputed
- notifications_and_page_states: toast, loading, empty, error feedback
- dashboards: buyer, seller, admin, role-appropriate statistics
- ci_cd: GitHub Actions for checks/build
- pwa_or_offline_support: retain only if already part of repository scope and feasible for MVP
```

### TRANSACTION_STATE_MODEL

```text
PENDING_PAYMENT
  -> PAYMENT_CONFIRMED
  -> IN_HANDOVER
  -> PENDING_BUYER_CONFIRM
  -> COMPLETED

Allowed exceptional states:
- PENDING_PAYMENT -> CANCELLED
- PAYMENT_CONFIRMED -> DISPUTED
- IN_HANDOVER -> DISPUTED
- PENDING_BUYER_CONFIRM -> DISPUTED
- applicable active state -> CANCELLED by authorized admin/super admin
```

```yaml
completion_trigger: buyer_confirmation_only
dispute_trigger: buyer_only
admin_actions: confirm_payment, start_handover, finish_or_mark_handover, cancel
transaction_audit: store important status/activity changes
listing_state_rule_latest: listing becomes SOLD after transaction completion or cancellation, according to the latest team decision; if implementation or business clarification conflicts, flag it before changing behavior
chat_availability: active before COMPLETED/CANCELLED; access limited to transaction participants
```

### FEE_AND_ADMIN_RULES

```yaml
admin_is_internal: true
admin_fee_model: one_platform_fee_policy
fee_is_not: independently negotiated per admin
admin_directory_filter_by_individual_fee: obsolete_or_not_required
admin_availability: may be used for assignment/queue/load balancing
```

## TECHNICAL_BASELINE

These are the PRD/repository targets, not permission to assume that every dependency is already installed. Inspect the repository before changing them.

```yaml
frontend:
  framework: Next.js 14 App Router
  ui: React 18 + TypeScript + TailwindCSS
  existing_ui_state: mostly_built; dummy_data_present
backend:
  style: Next.js API Routes or existing project API pattern
database:
  target: Supabase PostgreSQL
  orm: Prisma
auth_target: NextAuth-style JWT/cookie session and RBAC; verify actual repo implementation
file_upload_target: UploadThing or existing upload implementation; verify repository
hosting_target: Vercel or existing deployment target
automation: GitHub Actions
validation_target: Zod/server-side validation where compatible with existing code
```

### DATA_ENTITIES_MINIMUM

```text
User
AdminProfile (if separate from User)
Listing
Transaction
Payment / PaymentProof
ChatMessage
Review
Dispute (or dispute fields on Transaction)
TransactionActivity / TimelineEvent
```

Recommended minimum relationships:

```text
User 1--N Listing
User 1--N Transaction as buyer
User 1--N Transaction as seller
User 1--N Transaction as admin
Listing 1--N Transaction (or enforce only one active transaction)
Transaction 1--N ChatMessage
Transaction 1--N TransactionActivity
Transaction 0..N PaymentProof
Transaction 0..N Review
Transaction 0..1 Dispute
```

### SECURITY_BASELINE

```yaml
protect_transaction_routes: true
protect_admin_routes_with_role: true
validate_server_input: true
prevent_cross_user_listing_edit: true
prevent_nonparticipant_chat_access: true
do_not_store_plain_passwords_or_tokens: true
limit_upload_type_and_size: true
do_not_expose_sensitive_payment_data: true
```

## SCOPE_BOUNDARIES

### IN_SCOPE_PHASE_1

```text
eFootball only; web only; authenticated transaction flow; listing marketplace; internal admin handling; payment proof upload; dynamic QRIS sandbox attempt; transaction status; handover; polling chat; reviews; buyer dispute; dashboards; basic notifications; CI/CD; basic testing and release verification.
```

### OUT_OF_SCOPE_OR_NOT_COMMITTED

```text
native iOS/Android app
multi-game support
affiliate/referral system
public third-party API
live-stream account verification
production-grade payment gateway/escrow settlement
complex real-time transport beyond polling
large-scale load testing target
```

Do not expand MVP with these items unless the team explicitly approves a new issue and schedule impact.

## ISSUE_TEMPLATE

Use this exact Markdown shape when creating or revising a GitHub issue:

```md
## Deskripsi

<one-paragraph feature outcome>

## Assignee

- <exactly one team member>

## Pembagian Tugas

**<Name>** - <short implementation responsibility>

## Tasks

- [ ] <concrete task>
- [ ] <concrete task>

## Definition of Done

- [ ] <observable completion condition>
- [ ] <observable completion condition>
```

Rules: one issue = one assignee; tasks should be actionable; DoD should be verifiable; avoid vague phrases such as “finish everything”; keep wording simple; do not add unapproved features.

## ISSUE_BACKLOG

### DEV-01 — Membuat Alur Transaksi

```yaml
type: development
status: completed_on_branch
implementation_branch: ibrahim/transaction-flow
verified_date: 2026-09-19
assignee: Ibrahim
estimate_days: 3
depends_on: [DEV-05, DEV-06, DEV-07]
description: Implement the Rekberin transaction flow so a logged-in buyer can start a transaction from an available listing and all parties can view the persisted transaction status.
responsibility: transaction logic, transaction API, transaction-page integration
tasks:
  - determine transaction statuses used by the MVP
  - create API to start a transaction
  - connect buyer, seller, admin, and listing to the transaction
  - update listing state when a transaction starts
  - connect transaction page to API data
dod:
  - logged-in buyer can start a transaction from an available listing
  - transaction data is persisted and can be reopened
  - transaction/listing status follows the approved flow
```

### DEV-02 — Integrasi Pembayaran QRIS

```yaml
type: development
assignee: Ibrahim
estimate_days: 4
depends_on: [DEV-01, DEV-05]
description: Integrate dynamic QRIS in sandbox mode and payment-proof upload so the buyer can see payment information and the transaction can record payment status.
responsibility: QRIS integration, payment status, payment-proof flow
tasks:
  - configure QRIS sandbox service
  - request dynamic QRIS based on transaction amount
  - show QR, amount, and payment expiry information
  - provide buyer payment-proof upload
  - persist payment/QRIS identity and status
  - update transaction status after successful/failed payment result
dod:
  - QRIS sandbox can be generated from a transaction when service is available
  - amount and payment information are displayed correctly
  - buyer can upload payment proof and the record is linked to the transaction
  - payment status can represent success or failure without exposing secrets
```

### DEV-03 — Membuat Proses Handover

```yaml
type: development
assignee: Ibrahim
estimate_days: 3
depends_on: [DEV-01, DEV-02]
description: Implement account handover after payment confirmation until the buyer confirms receipt.
responsibility: admin handover actions and buyer receipt confirmation
tasks:
  - create admin action to start handover
  - show handover status to buyer and seller
  - create buyer receipt-confirmation action
  - set transaction completed only after buyer confirmation
  - apply the latest listing state rule after completion/cancellation
dod:
  - admin can start the handover process
  - buyer can confirm account receipt
  - completion is triggered by buyer confirmation only
  - resulting transaction/listing state is persisted
```

### DEV-04 — Membuat Fitur Dispute

```yaml
type: development
assignee: Ibrahim
estimate_days: 3
depends_on: [DEV-01, DEV-03, DEV-06]
description: Create a transaction-problem report so the buyer can submit a dispute with a clear reason.
responsibility: dispute form, persistence, transaction status, and related display
tasks:
  - create dispute submission form
  - save the dispute reason against the transaction
  - change transaction status to DISPUTED
  - show dispute information to authorized related parties
  - reject dispute submission for unauthorized/ineligible transactions
dod:
  - buyer can submit a dispute with a reason
  - dispute status/data can be viewed later
  - only the buyer of the related transaction can create the dispute
```

### DEV-05 — Menyiapkan Database

```yaml
type: development
status: completed
assignee: Bagas
estimate_days: 3
depends_on: []
description: Prepare structured storage for users, listings, transactions, chat, payments, reviews, and related Rekberin data.
responsibility: Prisma schema, relations, migrations, and development seed data
tasks:
  - inspect and adjust Prisma schema
  - add data structures needed for QRIS/payment proof
  - define table/entity relationships
  - run database migrations
  - create usable development seed data
dod:
  - core models exist in the database
  - migrations run without error
  - development seed data is usable by the team
```

### DEV-06 — Membuat Authentication dan Role

```yaml
type: development
assignee: Bagas
estimate_days: 4
depends_on: [DEV-05]
description: Implement registration, login, logout, session, and access restrictions; a buyer must be logged in before starting a transaction.
responsibility: auth integration and role-based access control
tasks:
  - connect register form to the database/auth service
  - implement login and logout
  - persist/manage user session
  - support USER, ADMIN, and SUPER_ADMIN roles
  - protect pages and API routes that require authentication/role
dod:
  - users can register, log in, and log out
  - unauthenticated buyer cannot create a transaction
  - admin pages are accessible only to authorized roles
  - seller cannot edit another user's listing through direct request manipulation
```

### DEV-07 — Membuat Pengelolaan Listing

```yaml
type: development
assignee: Bagas
estimate_days: 4
depends_on: [DEV-05, DEV-06]
description: Connect listing features to the database so a seller can create and manage eFootball account listings.
responsibility: listing API and integration with existing listing forms
tasks:
  - create API to add and fetch listings
  - create API to edit and deactivate listings
  - connect listing ownership to the logged-in seller
  - connect create/edit listing forms
  - validate listing fields and images
dod:
  - seller can create and edit their own listing
  - listing is persisted and retrievable
  - seller cannot edit another user's listing
```

### DEV-08 — Menghubungkan Marketplace ke Database

```yaml
type: development
assignee: Bagas
estimate_days: 3
depends_on: [DEV-05, DEV-06, DEV-07]
description: Replace marketplace, listing detail, and admin-directory dummy data with database/API data.
responsibility: marketplace and internal-admin-directory API integration
tasks:
  - fetch listing list from API
  - connect listing search and filters
  - show listing detail by ID
  - fetch internal admin data
  - show basic loading, empty, and error states
dod:
  - marketplace renders database data
  - search, filter, and listing detail work
  - admin directory no longer depends on dummy data
```

### DEV-09 — Membuat Chat Transaksi

```yaml
type: development
assignee: Afiq
estimate_days: 4
depends_on: [DEV-01, DEV-05, DEV-06]
description: Implement per-transaction chat for buyer, seller, and admin using persisted messages and polling.
responsibility: message API and polling-based chat integration
tasks:
  - create API to send/fetch messages
  - connect messages to transaction and sender
  - connect existing chat component to API
  - poll for new messages at a reasonable interval
  - disable sending after transaction completion/cancellation
dod:
  - transaction participants can send and view messages
  - new messages appear through polling
  - users outside the transaction cannot access its chat
```

### DEV-10 — Membuat Review dan Rating

```yaml
type: development
assignee: Afiq
estimate_days: 3
depends_on: [DEV-03, DEV-05, DEV-06]
description: Implement post-transaction review and rating.
responsibility: review persistence, form/API integration, and simple average rating
tasks:
  - create review-save API
  - connect rating and optional comment form
  - allow review only after transaction completion
  - show review history
  - calculate/display a simple average rating
dod:
  - eligible user can submit review after completion
  - review persists and can be displayed again
  - average rating is calculated from stored reviews
```

### DEV-11 — Membuat Notifikasi dan Status Halaman

```yaml
type: development
assignee: Afiq
estimate_days: 3
depends_on: [DEV-07, DEV-08, DEV-09, DEV-10]
description: Add understandable feedback for successful actions, loading, empty data, and failures across main Rekberin features.
responsibility: toast and page-state handling
tasks:
  - show success/failure toast after important actions
  - add loading states for data fetching
  - show empty-data messages
  - show understandable error messages
  - apply these states to major features
dod:
  - important actions have clear feedback
  - main pages have loading, empty, and error states
  - user-facing messages are understandable
```

### DEV-12 — Menyiapkan CI/CD

```yaml
type: development
assignee: Afiq
estimate_days: 3
depends_on: []
description: Configure GitHub Actions so code changes are checked consistently before merge and the application can be built automatically.
responsibility: GitHub Actions workflow and build verification
tasks:
  - create GitHub Actions workflow
  - install dependencies automatically
  - run TypeScript checks and build
  - run workflow on pull request and/or push
  - document required environment variables without committing secrets
dod:
  - workflow runs automatically on the agreed GitHub events
  - TypeScript/build checks are executed by the workflow
  - workflow result is visible to all team members
```

### DEV-13 — Menghubungkan Dashboard Buyer

```yaml
type: development
assignee: Aufa
estimate_days: 3
depends_on: [DEV-01, DEV-06]
description: Connect buyer dashboard to real data so a logged-in buyer can see their transaction summary and list.
responsibility: buyer-dashboard API integration
tasks:
  - fetch transactions belonging to the logged-in buyer
  - show active and completed transactions
  - show status and payment amount
  - connect buttons to transaction detail
  - add loading and empty-data states
dod:
  - dashboard shows only the logged-in buyer's transactions
  - status and transaction detail can be opened
  - dashboard no longer uses dummy transaction data
```

### DEV-14 — Menghubungkan Dashboard Seller

```yaml
type: development
assignee: Aufa
estimate_days: 3
depends_on: [DEV-07, DEV-06]
description: Connect seller dashboard to database/API so the seller can see their listings and related transactions.
responsibility: seller-dashboard listing/transaction integration
tasks:
  - fetch listings belonging to the logged-in seller
  - show listing status
  - fetch transactions related to seller listings
  - connect edit/detail actions
  - add loading and empty-data states
dod:
  - seller sees only their own listings and related transactions
  - dashboard data comes from API/database
  - edit/detail buttons route correctly
```

### DEV-15 — Menghubungkan Dashboard Admin

```yaml
type: development
assignee: Aufa
estimate_days: 4
depends_on: [DEV-01, DEV-02, DEV-03, DEV-06]
description: Connect admin dashboard to API so an authorized admin can view and process assigned transactions.
responsibility: admin transaction list and action integration
tasks:
  - fetch transactions handled by the admin
  - show transaction status and information
  - connect payment-confirmation action
  - connect handover and cancellation actions
  - add loading, error, and action-confirmation feedback
dod:
  - authorized admin sees handled transactions
  - admin actions update status through API
  - dashboard clearly shows action results and errors
```

### DEV-16 — Membuat Statistik Dashboard

```yaml
type: development
assignee: Aufa
estimate_days: 3
depends_on: [DEV-13, DEV-14, DEV-15]
description: Show simple role-appropriate activity summaries on dashboards.
responsibility: summary-data retrieval and dashboard statistic cards
tasks:
  - define important statistics per dashboard role
  - fetch listing and transaction counts
  - count transactions by status
  - render values in statistic cards
  - add loading and error states
dod:
  - statistics come from database/API data
  - statistics differ according to user role/context
  - values refresh when the dashboard is loaded again
```

### TEST-01 — Menyusun Alur Testing

```yaml
type: testing
assignee: Aufa
estimate_days: 1
depends_on: [DEV-01..DEV-16]
description: Define the sequence and checklist used to test Rekberin's main features.
responsibility: testing scenarios and expected results
tasks:
  - list features to test
  - write main-flow test steps
  - prepare test accounts/data
  - define expected results
dod:
  - testing-flow document/checklist exists
  - main Rekberin flow is covered
  - required test accounts/data are ready
```

### TEST-02 — Melakukan Testing

```yaml
type: testing
assignee: Aufa
estimate_days: 6
depends_on: [TEST-01]
description: Execute the testing flow to verify that Rekberin's main features are usable and record discovered problems.
responsibility: execute tests, record results, and recheck fixes
tasks:
  - execute the prepared testing flow
  - test the main path from login through transaction completion
  - record results and discovered problems
  - create report/issues for important problems
  - retest features after fixes
dod:
  - main Rekberin flow has been tested
  - results and discovered problems are recorded
  - important fixes have been rechecked
```

## DELIVERY_SEQUENCE

```yaml
development_window: days_1_to_14
testing_window: days_15_to_21
recommended_foundation_order:
  - DEV-05 database
  - DEV-06 authentication/role
  - DEV-07 listing
  - DEV-01 transaction
  - DEV-02 QRIS/payment proof
  - DEV-03 handover
  - DEV-04 dispute
parallel_or_supporting:
  - DEV-08 marketplace integration
  - DEV-09 chat
  - DEV-10 review
  - DEV-11 page states
  - DEV-12 CI/CD
  - DEV-13 buyer dashboard
  - DEV-14 seller dashboard
  - DEV-15 admin dashboard
  - DEV-16 statistics
testing:
  - TEST-01 before TEST-02
  - TEST-02 after the integrated development build is available
```

The sequence is a dependency guide, not a reassignment. Each issue remains owned by the listed assignee.

## SUPERSEDED_DECISIONS_AND_REVISIONS

```yaml
- revision: product_naming
  previous: RekberGG used in PRD/early discussion
  current: Rekberin is the project/web name used in new context/issues

- revision: team_size_and_roles
  previous: earlier alternatives/partial role splits
  current: Ibrahim, Bagas, Afiq, Aufa; all fullstack; Ibrahim is PM; Aufa owns QA/DevOps/testing

- revision: transaction_ownership
  previous: transaction work was considered broader/shared
  current: transaction + QRIS are assigned to Ibrahim; part of earlier Ibrahim scope is moved to other developers

- revision: dashboard_ownership
  previous: dashboard assignment was not final
  current: all dashboard issues DEV-13–DEV-16 are assigned to Aufa

- revision: ci_cd_ownership
  previous: CI/CD candidate was Afiq or Bagas
  current: CI/CD DEV-12 is assigned to Afiq

- revision: authentication_ownership
  previous: authentication candidate was Bagas or Afiq
  current: authentication/role DEV-06 is assigned to Bagas

- revision: workload_balance
  previous: Ibrahim carried too much transaction-related scope
  current: 4 development issues per developer; Ibrahim transaction/QRIS, Bagas database/auth/listing/marketplace, Afiq chat/review/notifications/CI-CD, Aufa dashboards

- revision: buyer_auth
  previous: PRD brainstorming considered buyer browsing/contact without account
  current: buyer must log in before creating a transaction; do not use the no-login transaction flow

- revision: payment
  previous: manual transfer/payment gateway ambiguity in early PRD
  current: retain payment-proof upload and attempt dynamic QRIS in sandbox; production payment gateway is not committed in Phase 1

- revision: admin_model
  previous: independent admins with individually varying fees were considered
  current: admins are internal platform staff/partners and the platform uses one fee policy

- revision: chat
  previous: polling or WebSocket were both possible
  current: use polling for MVP; do not add WebSocket scope without approval

- revision: dispute
  previous: generic dispute handling
  current: buyer is the authorized dispute initiator; admin/super admin handle resolution according to role

- revision: testing
  previous: testing was distributed broadly among developers in an earlier draft
  current: Aufa alone owns TEST-01 and TEST-02; testing period is 7 days; keep test issue descriptions simple and feature-focused
```

## KNOWN_AMBIGUITIES_TO_FLAG

These are not permission to invent behavior. Ask/flag them when implementation depends on them:

```text
- exact QRIS provider/API and sandbox credentials
- exact auth provider if repository differs from PRD target
- exact upload provider if UploadThing is not present
- exact fee amount and fee calculation formula
- exact admin assignment/queue algorithm
- exact outcome of CANCELLED listing state if team later revises the current SOLD rule
- exact polling interval and pagination strategy
- exact dispute resolution actions/release/refund implementation
- exact GitHub usernames for assignee mentions
```

## NON_GOALS_FOR_FUTURE_AI_SESSIONS

```text
Do not rebuild the UI from zero without repository evidence.
Do not convert polling chat to WebSocket by default.
Do not let an unauthenticated buyer start a transaction.
Do not add buyer/seller separate auth roles automatically.
Do not treat admins as independent fee competitors.
Do not claim QRIS/payment is production-ready from sandbox work.
Do not assign testing to all developers unless the team explicitly changes TEST-01/TEST-02.
Do not add mobile native, multi-game, affiliate, public API, or live verification scope silently.
```

## SESSION_HANDOFF_FORMAT

When an AI/developer starts a new Rekberin session, it should report only what is relevant:

```yaml
session_start:
  - load this context
  - inspect current repository status and relevant files
  - identify requested issue ID or task
  - check dependencies and current assignee
  - state conflicts before editing
implementation_handoff:
  - issue_id
  - assignee
  - files/components affected
  - API/data impact
  - acceptance conditions
  - verification performed
  - unresolved blockers
```

## HISTORICAL_REFERENCES

```text
PRD rekberin.docx: original PRD; contains brainstorming notes, some of which are superseded above.
Rekberin_Rencana_Issue.md: earlier human-oriented issue summary.
Rekberin_Rencana_Issue.pdf: detailed issue descriptions; current allocation is represented in ISSUE_BACKLOG above.
```

## REPOSITORY_IMPLEMENTATION_PROGRESS

### DEV-01 - TRANSACTION_FLOW

```yaml
issue_id: DEV-01
status: completed_on_branch
branch: ibrahim/transaction-flow
verified_date: 2026-09-19
schema_change: false
migration_change: false
initial_transaction_status: PENDING_PAYMENT
listing_status_on_start: IN_TRANSACTION
transaction_create_atomic: true
listing_claim_strategy: prisma_transaction_plus_conditional_updateMany
single_winner_concurrency_verified: true
request_admin_id_semantics: User.id
fee_policy_change: false
advanced_transaction_actions: read_only_not_implemented
```

```yaml
api_contracts:
  GET /api/listings:
    auth: public
    result: database_listing_list
  POST /api/listings:
    auth: USER_session
    seller_source: session_user_id
    result: persisted_AVAILABLE_listing
  GET /api/listings/[id]:
    auth: public
    result: database_listing_detail_or_404
  GET /api/admins:
    auth: public_selection_data
    filter: role_in_ADMIN_SUPER_ADMIN_and_active_profile
  POST /api/transactions:
    auth: USER_session_only
    request: listingId_plus_adminId_as_User.id
    guards: [listing_exists, listing_AVAILABLE, buyer_not_seller, admin_role_allowed, admin_profile_active]
    success: transaction_201_plus_listing_IN_TRANSACTION
  GET /api/transactions:
    auth: required
    filter: buyerId_or_sellerId_or_adminId_equals_session_user
  GET /api/transactions/[id]:
    auth: required
    participant_access: buyer_or_seller_or_assigned_admin
    nonparticipant_response: 404
```

```yaml
implementation_modules:
  transaction_service: lib/transactions.ts
  transaction_dto_types: types/transaction-api.ts
  transaction_client_validation: lib/transaction-api-client.ts
  transaction_view_mapping: lib/transaction-view-model.ts
  transaction_hooks: hooks/useTransactions.ts
  transaction_routes:
    - app/api/transactions/route.ts
    - app/api/transactions/[id]/route.ts
  admin_selection_route: app/api/admins/route.ts
  listing_service: lib/listings.ts
  listing_dto_types: types/listing-api.ts
  listing_client_validation: lib/listing-api-client.ts
  listing_hooks: hooks/useListings.ts
  listing_routes:
    - app/api/listings/route.ts
    - app/api/listings/[id]/route.ts
  auth_integration:
    - lib/auth.ts
    - lib/supabase.ts
    - app/(auth)/login/page.tsx
  participant_pages:
    - app/(dashboard)/user/transactions/page.tsx
    - app/(dashboard)/user/transactions/[id]/page.tsx
    - app/(dashboard)/admin/transactions/page.tsx
    - app/(dashboard)/admin/transactions/[id]/page.tsx
  marketplace_pages:
    - components/marketplace/ListingsExplorer.tsx
    - app/(marketplace)/listings/[id]/page.tsx
    - app/(marketplace)/listings/[id]/BuyPanel.tsx
    - components/marketplace/CreateListingForm.tsx
```

```yaml
DEV-01_changed_files:
  api:
    - app/api/admins/route.ts
    - app/api/listings/route.ts
    - app/api/listings/[id]/route.ts
    - app/api/transactions/route.ts
    - app/api/transactions/[id]/route.ts
  auth:
    - app/(auth)/login/page.tsx
    - lib/auth.ts
    - lib/supabase.ts
  user_transaction_UI:
    - app/(dashboard)/user/transactions/page.tsx
    - app/(dashboard)/user/transactions/[id]/page.tsx
    - components/dashboard/BuyerTransactionView.tsx
    - components/dashboard/SellerTransactionView.tsx
  admin_transaction_UI:
    - app/(dashboard)/admin/transactions/page.tsx
    - app/(dashboard)/admin/transactions/[id]/page.tsx
    - components/dashboard/AdminTransactionView.tsx
  marketplace_UI:
    - app/(marketplace)/listings/[id]/BuyPanel.tsx
    - app/(marketplace)/listings/[id]/page.tsx
    - components/marketplace/CreateListingForm.tsx
    - components/marketplace/ListingCard.tsx
    - components/marketplace/ListingsExplorer.tsx
  hooks:
    - hooks/useListings.ts
    - hooks/useTransactions.ts
  services_and_mapping:
    - lib/listing-api-client.ts
    - lib/listings.ts
    - lib/transaction-api-client.ts
    - lib/transaction-view-model.ts
    - lib/transactions.ts
  types:
    - types/listing-api.ts
    - types/transaction-api.ts
    - types/transaction-view-model.ts
  tests_and_tooling:
    - scripts/seed-test-auth.ts
    - tests/transaction-flow.test.ts
    - tests/transaction-database.integration.test.ts
    - tests/transaction-http.e2e.ts
    - package.json
  documentation:
    - transaction-flow-temp.md
    - Rekberin_AI_Context.md
```

```yaml
auth_runtime_for_DEV_01:
  nextauth_strategy: jwt
  credentials_verifier: isolated_Supabase_Auth_client
  application_identity_lookup: Prisma_User_by_normalized_email
  jwt_fields: [userId, role]
  session_fields: [user.id, user.role]
  test_identity_check_command: npm run auth:check
  test_identity_sync_command: npm run auth:seed
  test_identity_password_documented_here: false
```

```yaml
DEV-01_external_test_state:
  Supabase_Auth_and_Prisma_test_identities:
    buyer@test.com: USER
    seller@test.com: USER
    admin@rekberin.com: ADMIN
    superadmin@rekberin.com: SUPER_ADMIN_nonparticipant_fixture
  synchronization_status: ready
  synchronization_command: npm run auth:seed
  credential_value_recorded_in_context: false
  persistent_transaction_or_listing_fixture_created: false
```

```yaml
verification:
  unit:
    command: npm test
    result: pass_6_of_6
    coverage: [DTO_validation, public_admin_profile_contract, timeline, start_policy, participant_policy, listing_claim_helper]
  database_integration:
    command: npm run test:integration
    result: pass_2_of_2
    database: configured_Supabase_PostgreSQL
    coverage: [relation_persistence, initial_statuses, DTO_roundtrip, concurrent_single_winner]
    fixture_cleanup: automatic
  http_e2e:
    command: npm run test:e2e
    result: pass
    coverage: [NextAuth_Supabase_login, seller_listing_create, buyer_transaction_create, transaction_reopen, listing_status_update, buyer_seller_admin_read, nonparticipant_404]
    fixture_cleanup: automatic
  typecheck:
    command: npm run typecheck
    result: pass
  production_build:
    command: npm run build
    result: pass
  diff_check:
    command: git diff --check
    result: pass_with_Windows_line_ending_warnings_only
```

```yaml
dependency_bridge_status:
  DEV-06:
    provided: [login, session_user_id, session_role, transaction_API_auth]
    not_claimed_complete: [registration, logout, exhaustive_route_protection]
  DEV-07:
    provided: [listing_create, listing_list, listing_detail, seller_from_session]
    not_claimed_complete: [listing_edit, listing_deactivate, ownership_update_API]
  DEV-08:
    provided: [marketplace_database_list, database_listing_detail, transaction_admin_selector]
    not_claimed_complete: [full_admin_directory_page_audit]
  DEV-13_DEV-14_DEV-15:
    provided: [participant_transaction_list, participant_transaction_detail, assigned_admin_transaction_views]
    not_claimed_complete: [dashboard_statistics, seller_listing_management, admin_status_mutations]
```

```yaml
DEV-01_scope_exclusions_preserved:
  - QRIS
  - payment_proof
  - payment_status_mutation
  - account_handover
  - credential_vault
  - dispute
  - transaction_chat
  - transaction_notifications
  - post_initial_status_transition_endpoints
```

### DEV-12 - CI/CD

DEV-12 is assigned to Afiq and has been implemented on branch `feat/dev-12-ci-cd`.

- Added the `typecheck` script to `package.json` using `tsc --noEmit`.
- Added `.github/workflows/ci.yml`.
- CI runs on pull requests and pushes to `main`.
- CI uses Node.js 20 and installs dependencies with `npm ci`.
- CI runs `npm run typecheck` and `npm run build`.
- Local typecheck and production build both passed.
- The CI check on the pull request passed.
- The implementation commit is `7b1d3bb chore: add CI workflow`.
- The context update was originally committed as `81b6e0e docs: add AI project context` and is being consolidated into this canonical file during conflict resolution.

The pull request must be reviewed and merged into `main` after this conflict-resolution commit. Do not commit `.env` or `.env.local`; use `.env.example` for documented environment variables.
