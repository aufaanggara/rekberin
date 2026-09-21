# REKBERIN_AI_CONTEXT

> Machine-oriented project context. Treat this file as the canonical context for future AI/developer sessions. Prefer explicit facts below over assumptions. Do not infer missing credentials, usernames, dates, or architecture details.

## CONTEXT_META

```yaml
project_name: Rekberin
legacy_or_prd_name: RekberGG
project_type: web_platform
domain: escrow_marketplace_for_game_account_trading
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

current_ui_cleanup_2026_09_21:
  public_admin_directory_routes:
    status: removed
    paths: [/rekber, "/rekber/[username]"]
  admin_selection: retained_through_api_admins_and_buy_panel
  browse_navigation_label: List Akun
  listing_creation_label: Post Akun
  supported_marketplace_games: [eFootball, Mobile Legends, FC Mobile]
  marketplace_filters: selected_game_adaptive; common_filters_only_for_all_games; game_specific_state_resets_on_game_change
  transaction_fee_summary: one_reusable_breakdown_uses_persisted_price_platformFee_and_adminFee_in_buyer_seller_admin_views
  logout: sign_out_then_relative_same_origin_root_navigation; no_localhost_callback_injection

progressive_chat_and_transaction_flow_2026_09_21:
  model: 4_stage_progressive_linear_tabs
  tabs:
    tab_1_negosiasi:
      name: Tahap 1: Negosiasi & Deal
      participants: [BUYER, SELLER]
      access: always_open_pre_order
      features: [price_negotiation_widget, seller_accept_reject, anti_bypass_warning_banner, direct_transfer_keyword_filtering]
      listing_lock: listing_stays_AVAILABLE_during_negotiation; locks_to_IN_TRANSACTION_only_after_offer_accepted_and_checkout_started
    tab_2_bayar_rekber:
      name: Tahap 2: Bayar Rekber
      participants: [BUYER, SELLER, ADMIN]
      access: unlocked_upon_checkout
      features: [dynamic_qris_or_payment_proof, payment_countdown_5_minutes, admin_escrow_verification, dispute_and_mediation]
      payment_timeout: 5_minutes; auto_cancels_transaction_and_releases_listing_if_unpaid
    tab_3_amankan_akun:
      name: Tahap 3: Amankan Akun
      participants: [BUYER, SELLER]
      access: unlocked_when_payment_confirmed_in_escrow
      features: [masked_account_credential_exchange, structured_otp_request_and_response_with_timestamps, rebind_email_password, confirm_account_receipt]
      privacy_rule: admin_cannot_view_account_password; super_admin_access_only_on_escalated_guarantee_dispute
      handover_timeout_and_auto_release:
        seller_inactivity: if_seller_inactive_gt_15_to_30_min_buyer_can_call_admin_for_cancellation_and_refund
        buyer_inactivity_auto_release: if_buyer_does_not_confirm_receipt_and_no_dispute_within_2_hours_funds_auto_release_to_seller
    tab_4_pencairan_dana:
      name: Tahap 4: Pencairan Dana & Selesai
      participants: [BUYER, SELLER, ADMIN]
      access: unlocked_after_account_confirmed_in_stage_3
      features: [seller_bank_payout_account, admin_payout_transfer_execution, proof_of_transfer_upload, buyer_rating_and_review, completed_status]
  multi_buyer_negotiation_and_locking:
    seller_multi_negotiation: 1 Seller can negotiate with multiple prospective buyers concurrently in isolated 1-on-1 rooms on the same listing while listing is AVAILABLE.
    lock_trigger: When Seller ACCs an offer and that specific Buyer clicks 'Lanjut ke Pembayaran Rekber' (Tahap 2), listing locks to IN_TRANSACTION.
    other_buyers_state: Other prospective buyers in Tahap 1 receive a suspended warning banner ('Negosiasi Ditangguhkan Sementara') and price offer actions are temporarily frozen.
    unlock_on_fail: If the active transaction is cancelled or QRIS expires (5 minutes), listing reverts to AVAILABLE and all other negotiation rooms resume automatically.
    close_on_success: When Tahap 4 completes successfully, listing transitions to SOLD and all other buyer negotiation rooms close permanently.
  review_mode:
    status: all_stages_1_to_4_unlocked_for_testing
    note: Tahap 1 sampai 4 saat ini dibuka kuncinya (unlocked) agar developer (Afiq/team) dapat bebas mengklik dan mereview seluruh tampilan antarmuka dan form tanpa terblokir status transaksi.
```

### CURRENT_TEAM

| Member | Permanent role | Current ownership | Issue range |
|---|---|---|---|
| Ibrahim | PM + Fullstack Developer | Transaction and QRIS | DEV-01–DEV-04 |
| Bagas | Fullstack Developer | Database, authentication/role, listing, marketplace integration | DEV-05–DEV-08 |
| Afiq | Fullstack Developer | Chat, review/rating, notifications/status, CI/CD | DEV-09–DEV-12 |
| Aufa | Fullstack Developer + QA/DevOps | User/admin dashboards, testing ownership | DEV-13, DEV-15–DEV-16 (DEV-14 merged ke DEV-13), TEST-01–TEST-02 |

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

Rekberin is a web escrow marketplace for safer buying and selling of eFootball, Mobile Legends, and FC Mobile accounts: buyer, seller, internal escrow admin, and super admin use one platform for listing, payment, transaction tracking, handover, chat, review, and dispute handling.

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
PRE_ORDER (Tab 1: Negosiasi, 2-way chat & price offer)
  -> PENDING_PAYMENT (Tab 2: Rekber, 3-way, 5-minute payment countdown)
  -> PAYMENT_CONFIRMED / IN_HANDOVER (Tab 3: Amankan Akun, 2-way private credentials & OTP)
  -> PENDING_BUYER_CONFIRM (Rebind completed, awaiting buyer confirmation)
  -> COMPLETED (All chats locked read-only, funds released to seller)

Allowed exceptional states:
- PENDING_PAYMENT -> CANCELLED (5-minute payment timeout or buyer/admin cancel; listing released back to AVAILABLE)
- PAYMENT_CONFIRMED / IN_HANDOVER -> DISPUTED (Buyer files problem -> mediated by Admin in Tab 2)
- IN_HANDOVER -> AUTO_COMPLETED (2-hour buyer confirmation timeout without dispute -> funds auto-released to seller)
- applicable active state -> CANCELLED by authorized admin/super admin
```

```yaml
completion_trigger: buyer_confirmation_or_2_hour_auto_release
dispute_trigger: buyer_only
admin_actions: confirm_payment, instruct_handover, mediate_dispute, cancel_and_refund
transaction_audit: store important status/activity changes with timestamps
listing_state_rule_latest: listing remains AVAILABLE during negotiation; becomes IN_TRANSACTION upon checkout; becomes SOLD after completion; returns to AVAILABLE upon cancellation
chat_availability: active during respective stage lifecycle; locked to read-only upon COMPLETED/CANCELLED
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
status: waiting_for_review
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
status: completed
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
status: waiting_for_review
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
status: completed
assignee: Afiq
estimate_days: 3
depends_on: []
description: Configure GitHub Actions so code changes are checked consistently before merge and the application can be built automatically.
responsibility: GitHub Actions workflow and build verification
tasks:
  - create GitHub Actions workflow
  - install dependencies automatically
  - run TypeScript checks, automated tests, and build
  - run workflow on pull request and/or push
  - document required environment variables without committing secrets
dod:
  - workflow runs automatically on the agreed GitHub events
  - TypeScript/build checks are executed by the workflow
  - workflow result is visible to all team members
```

### DEV-13 — Menghubungkan Dashboard User (Buyer & Seller Unified)

```yaml
type: development
assignee: Aufa
estimate_days: 4
depends_on: [DEV-01, DEV-06, DEV-07]
description: Connect unified user dashboard (/user) to database/API so a logged-in user can manage both buyer activities (transactions, guarantees, order details) and seller activities (listings, sales orders, balance withdrawal) in a single integrated view.
responsibility: unified user dashboard API integration (buyer & seller)
tasks:
  - fetch transactions where logged-in user is buyer or seller
  - show active and completed transactions with tab filtering (Semua, Pembelian, Penjualan)
  - fetch listings created by the user and connect catalog management
  - connect balance withdrawal and sales inquiry summaries
  - connect buttons to unified transaction detail (/user/transactions/[id])
  - add loading, empty-data, and error states
dod:
  - user dashboard shows unified data for both buyer and seller roles without separate /buyer or /seller routes
  - status, filters, and transaction details route correctly
  - dashboard data comes from API/database instead of dummy data
```

### DEV-14 — (Merged ke DEV-13) Dashboard Seller

```yaml
status: merged_into_dev_13
assignee: Aufa
note: DEV-14 (Dashboard Seller) telah dilebur/diintegrasikan secara penuh ke dalam DEV-13 (Dashboard User) seiring migrasi arsitektur dari endpoint terpisah (/buyer dan /seller) menjadi single unified dashboard (/user) dengan tab switching antara mode Pembeli dan mode Penjual.
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
depends_on: [DEV-13, DEV-15]
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
  - DEV-13 user dashboard (unified buyer & seller, DEV-14 merged)
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
  current: all dashboard issues DEV-13–DEV-16 are assigned to Aufa (DEV-13 & DEV-14 unified into single DEV-13 User Dashboard)

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

- revision: progressive_chat_and_transaction_flow
  previous: direct admin selection from BuyPanel and single 3-way chat room throughout
  current: 3-Stage Progressive Tab Flow (Tab 1: Negosiasi 2-way with price deal widget & anti-bypass, Tab 2: Rekber 3-way with 5-min payment timer & escrow, Tab 3: Amankan Akun 2-way private credential & OTP handover with 2-hour auto-release rule; Admin cannot view password, Super Admin only accesses on dispute).

- revision: dispute
  previous: generic dispute handling
  current: buyer is the authorized dispute initiator; admin/super admin handle resolution according to role

- revision: dashboard_unification
  previous: DEV-13 (Dashboard Buyer) and DEV-14 (Dashboard Seller) were separate issues and routes (/buyer and /seller)
  current: DEV-13 and DEV-14 are unified into a single DEV-13 — Dashboard User (/user); DEV-14 is merged into DEV-13 because the user role now seamlessly combines Buyer and Seller capabilities in one unified interface

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

### DEV-05 — Menyiapkan Database

```yaml
status: completed
assignee: Bagas
branch: bagas/DatabasePreparation
merged_to_main: true
commits:
  - af70a62 feat : Menyiapkan Database(Dev-05)
  - cf857a4 Fix : Logic error
```

- Prisma schema disiapkan dengan model-model utama (User, Listing, Transaction, ChatMessage, Review, dll).
- Migrasi database berhasil dijalankan.
- Seed data untuk development disediakan.
- PR #20 dan #24 sudah di-merge ke `main`.

---

### DEV-12 — Menyiapkan CI/CD

```yaml
status: completed
assignee: Afiq
branch: feat/dev-12-ci-cd
merged_to_main: true
commits:
  - 7b1d3bb chore: add CI workflow
  - 81b6e0e docs: add AI project context
  - 86125d8 merge main and consolidate AI context
```

- Added `typecheck` script ke `package.json` (`tsc --noEmit`).
- Added `.github/workflows/ci.yml`.
- CI berjalan pada pull request dan push ke `main`.
- CI menggunakan Node.js 20, `npm ci`, `npm run typecheck`, dan `npm run build`.
- Local typecheck dan production build passed.
- PR #21 dan #25 sudah di-merge ke `main`.
- File `Rekberin_AI_Context.md` di-consolidate saat conflict resolution.

The pull request must be reviewed and merged into `main` after this conflict-resolution commit. Do not commit `.env` or `.env.local`; use `.env.example` for documented environment variables.

```yaml
DEV-01_vercel_prerender_fix_2026-09-19:
  trigger:
    branch: ibrahim/transaction-flow
    commit_with_failure: cf46351
    failed_routes: [/login, /admin/transactions, /user/transactions]
    error: ERR_INVALID_URL_input_empty_string
  root_cause:
    module: next-auth/react
    phase: static_prerender_module_initialization
    condition: NEXTAUTH_URL_exists_as_empty_string
    behavior: next-auth_nullish_fallback_does_not_treat_empty_string_as_missing
  implementation:
    file: next.config.mjs
    normalized_env: NEXTAUTH_URL
    precedence: [NEXTAUTH_URL, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL, http://localhost:3000]
    hostname_without_scheme_policy: prefix_https
    public_secret_exposure_added: false
  regression_verification:
    command: npm.cmd run build
    injected_environment:
      NEXTAUTH_URL: empty
      VERCEL_URL: rekberin-preview.vercel.app
      NEXT_PUBLIC_SUPABASE_URL: empty
      NEXT_PUBLIC_SUPABASE_ANON_KEY: empty
    result: pass
    static_pages_generated: 17_of_17
    affected_routes_prerendered: pass
```

---

### Aufa — Dashboard & UI Development (DEV-13/15/16 Progress — DEV-13 Unified User, DEV-14 Merged)

Seluruh progress di bawah ini dikerjakan oleh Aufa pada branch `dashboard` melalui multiple development sessions menggunakan AI pair programming. Berikut kronologi lengkapnya:

#### Dev Session 1 — Foundation & Homepage Revamp

```yaml
commit: c1bf2ff first commit
commit: 1c58882 feat: revamp homepage with Glints style, add bookmark feature, and fix back navigation scroll restoration
commit: cd18903 fix(build): add prisma generate to build and postinstall scripts for Vercel
files_changed: 14 files, +601 -35
```

**Perubahan:**
- Setup project awal Next.js 14 + Prisma + TailwindCSS.
- Revamp halaman homepage dengan desain terinspirasi Glints — hero search, featured grid.
- Tambah fitur bookmark listing.
- Tambah halaman Tentang Kami (`/tentang-kami`).
- Fix scroll restoration saat navigasi back.
- Fix build Vercel dengan menambah `prisma generate` ke script `build` dan `postinstall`.
- Tambah komponen: `HeroSearch`, `FeaturedGrid`, `DetailBackButton`, `SmoothScrollProvider`.

#### Dev Session 2 — PWA Support & Mobile Enhancements

```yaml
commit: 4aad152 feat: add PWA support and mobile enhancements
files_changed: 11 files, +701 -255
```

**Perubahan:**
- Tambah Progressive Web App (PWA) support: `manifest.ts`, service worker (`sw.js`), offline page.
- Generate app icons (192px, 512px, apple-icon).
- Enhance `ListingsExplorer` untuk mobile responsiveness.
- Tambah `ServiceWorkerRegister` provider.

#### Dev Session 3 — Room Chat 3 Arah, Payment Modal, Dispute, Uploader Iklan

```yaml
commit: 60941d6 feat: tambahkan room chat 3 arah, payment modal, vault akun, dispute, dan uploader iklan
files_changed: 29 files, +3629 -205
```

**Perubahan:**
- **Room Chat 3 Arah** (`TransactionChat.tsx`): Chat real-time (polling) antara buyer, seller, dan admin dalam satu transaksi. Fitur: pesan teks, upload gambar, system messages, auto-scroll, typing indicator.
- **Payment Modal** (`PaymentModal.tsx`): Modal pembayaran dengan QRIS placeholder, detail harga, dan upload bukti transfer.
- **Account Vault** (`AccountVaultPanel.tsx`): Panel vault untuk penyerahan detail akun game secara aman.
- **Dispute Modal** (`DisputeModal.tsx`): Form laporan masalah transaksi oleh buyer.
- **Invoice Modal** (`InvoiceModal.tsx`): Preview invoice/nota transaksi.
- **Create Listing Form** (`CreateListingForm.tsx`): Form upload iklan baru dengan multi-image upload, validasi field.
- **Listing Chat Launcher** (`ListingChatLauncher.tsx`): Komponen tanya-jawab pada halaman listing.
- **Image Gallery** (`ImageGallery.tsx`): Galeri gambar listing dengan lightbox.
- **Share Listing Button** (`ShareListingButton.tsx`): Tombol share listing ke social media.
- **Transaction Views**: `BuyerTransactionView.tsx`, `SellerTransactionView.tsx`, `AdminTransactionView.tsx` — tampilan detail transaksi per role.
- **Buyer/Seller transaction pages**: Halaman list dan detail transaksi.
- **BuyPanel.tsx**: Panel beli pada halaman detail listing.
- **Listing Discussion** (`ListingDiscussion.tsx`): Diskusi/tanya jawab publik pada listing.
- Extended `data/dummy.ts` dengan data transaksi, chat, dan review.
- Extended `store/useStore.ts` dengan state management untuk transaksi dan chat.
- Extended `types/index.ts` dengan tipe Transaction, ChatMessage, Review.

#### Dev Session 4 — Dashboard UI Enhancement & Listing Discussion Carry-to-Chat

```yaml
commit: 3ad7425 feat: enhance dashboard UI for buyer/seller/admin + listing discussion carry-to-chat
files_changed: 15 files, +3015 -272
```

**Perubahan:**
- **Admin Dashboard** (`admin/page.tsx`): Redesign total — statistik overview, tabel transaksi, panel verifikasi pembayaran, status cards.
- **Buyer Dashboard** (`buyer/page.tsx`): Redesign — statistik pembelian, riwayat transaksi dengan filter, detail transaksi modal, klaim garansi.
- **Seller Dashboard** (`seller/page.tsx`): Redesign — statistik penjualan, inquiry masuk, pesanan aktif, kelola katalog iklan.
- **DashboardSidebar** (`DashboardSidebar.tsx`): Overhaul sidebar — role-based config (buyer/seller/admin), badge verifikasi, menu dinamis, responsive design.
- **Navbar** (`Navbar.tsx`): Update dropdown dashboard navigation.
- **Admin Transactions List** (`admin/transactions/page.tsx`): Tabel daftar transaksi admin.
- **Seller/Buyer Transaction Pages**: Update list transaksi per role.
- **Listing Discussion**: Carry pertanyaan dari diskusi listing ke room chat transaksi.

#### Dev Session 5 — Dashboard Redesign & Unifikasi User Page

```yaml
commit: b6e71f1 feat(dashboard): redesign user dashboard layout with 3-column cards, remove vault and redundant stats/banners, update seller listings
files_changed: 4 files, +1144 -36
```

**Perubahan:**
- **User Dashboard Unified** (`user/page.tsx`): Buat halaman `/user` sebagai single unified dashboard menggantikan `/buyer` dan `/seller` terpisah. Menggunakan tab "Sebagai Pembeli" dan "Sebagai Penjual" dalam satu halaman.
- **Sebagai Pembeli**: Panduan Garansi 48 jam, riwayat pembelian dengan filter dan detail modal, klaim garansi.
- **Sebagai Penjual**: Tarik Saldo (Rp 2.450.000), inquiry masuk, pesanan aktif, kelola katalog iklan, pasang iklan baru.
- **DashboardSidebar**: Tambah config `user` role dengan menu unified.
- **Admin ActionPanel**: Minor update pada panel aksi admin.
- Hapus vault panel dan stats/banners yang redundan.

#### Dev Session 6 — Build Fix (Vercel)

```yaml
commit: 0d50a0a fix(build): wrap user dashboard in Suspense boundary to fix prerender error on Vercel
files_changed: 1 file, +17 -2
```

**Perubahan:**
- Wrap `UserDashboardContent` dalam `<Suspense>` boundary karena menggunakan `useSearchParams()` yang memerlukan Suspense pada Next.js prerender.
- Fix error Vercel deployment.

#### Dev Session 7 — Branding Rename RekberGG → Rekberin

```yaml
commit: 6007aa7 chore(branding): rename brand identity from RekberGG to Rekberin across entire project
files_changed: 37 files, +68 -69
```

**Perubahan:**
- Rename semua referensi "RekberGG" menjadi "Rekberin" di seluruh project.
- Termasuk: halaman auth, dashboard, marketplace, komponen UI, layout, footer, navbar, store, PRD, manifest, service worker, dummy data, package.json.
- 37 file diubah secara konsisten.

#### Dev Session 8 — Migrasi Buyer/Seller ke Unified User Architecture

```yaml
commit: d192815 refactor: migrate buyer/seller endpoints to unified /user architecture
branch: dashboard
files_changed: 18 files, +525 -1651
build_status: passed (0 errors)
```

**Perubahan:**
- **ARSITEKTUR BESAR**: Migrasi dari endpoint terpisah `/buyer` dan `/seller` menjadi satu endpoint unified `/user`.
- **Navbar** (`Navbar.tsx`): Dropdown hanya menampilkan "Dashboard User" (`/user`) dan "Dashboard Admin" (`/admin`). Mobile drawer juga diupdate 2 kolom.
- **DashboardSidebar** (`DashboardSidebar.tsx`): Config `buyer` dan `user` disinkronkan — badge "USER Terverifikasi", title "Akun Saya", menu: Dashboard, Riwayat Transaksi, Katalog Akun Game, Pasang Iklan Baru. Path matching dibersihkan (hapus `/buyer` dan `/seller` dari exclusion array).
- **User Dashboard** (`user/page.tsx`): Semua link internal diupdate — `/seller/transactions/...` → `/user/transactions/...`, `/seller/listings/new` → `/listings/new`, `/buyer/transactions/...` → `/user/transactions/...`. Fix transactionId mismatch (`tx_1` → `trx_1`).
- **[NEW] User Transactions** (`user/transactions/page.tsx`): Halaman riwayat transaksi unified dengan filter (Semua, Pembelian, Penjualan).
- **[NEW] User Transaction Detail** (`user/transactions/[id]/page.tsx`): Halaman detail transaksi & room chat — auto-detect apakah user sebagai buyer atau seller berdasarkan data transaksi.
- **BuyerTransactionView** & **SellerTransactionView**: Sidebar diupdate ke `<DashboardSidebar role="user" />`, back link ke `/user/transactions`.
- **BuyPanel.tsx**: Redirect setelah beli → `/user/transactions/...`.
- **ListingChatLauncher.tsx**: Link room chat → `/user/transactions/...`.
- **[DELETED] `app/(dashboard)/buyer/`**: Seluruh direktori dihapus (page.tsx, transactions/page.tsx, transactions/[id]/page.tsx).
- **[DELETED] `app/(dashboard)/seller/`**: Seluruh direktori dihapus (page.tsx, transactions/page.tsx, transactions/[id]/page.tsx, listings/page.tsx, listings/new/page.tsx).
- **Verifikasi**: `npm run build` passed (0 errors), grep scan seluruh codebase — 0 referensi `/buyer` atau `/seller` tersisa.

**Route structure setelah migrasi:**

```text
/user                     → Dashboard User (Static)
/user/transactions        → Riwayat Transaksi Unified (Static)
/user/transactions/[id]   → Detail Transaksi & Room Chat (Dynamic)
/admin                    → Dashboard Admin (Static)
/admin/transactions       → Daftar Transaksi Admin (Static)
/admin/transactions/[id]  → Detail Transaksi Admin (Dynamic)
/listings                 → Marketplace (Dynamic)
/listings/[id]            → Detail Listing (Dynamic)
/listings/new             → Pasang Iklan Baru (Static)
/login                    → Login (Static)
/register                 → Register (Static)
/rekber                   → Daftar Rekber (Static)
/rekber/[username]        → Profil Rekber (Dynamic)
/tentang-kami             → Tentang Kami (Static)
```

#### Dev Session 9 — Refaktor UI Dashboard Seller & Integrasi Navigasi Sidebar (Clean UI & Separation)

```yaml
focus: seller_dashboard_ui_refactor
branch: main
files_changed:
  - app/(dashboard)/user/page.tsx
  - components/layout/DashboardSidebar.tsx
changes_type: UI / Layout Refactoring & Navigation Separation
build_status: passed (0 errors)
```

**Latar Belakang & Masalah:**
- Tampilan Seller Dashboard (`/user?tab=seller`) sebelumnya terasa menumpuk ("numpuk") karena memuat terlalu banyak elemen dalam satu halaman overview: metrik redundan, tab bar internal di atas, serta quick-nav cards.
- Pengguna merasa metrik seperti "Listing Aktif Masuk", "Pertanyaan Masuk", dan "Dana di Escrow" tidak esensial atau tumpang tindih (double) dengan informasi Saldo Rekber dan katalog iklan.
- Fitur "Pusat Diskusi & Chat" serta "Pesanan & Serah Terima" yang sedang berjalan dipisahkan ke menu navigasi sidebar (Akun Saya) agar alur kerja penjual lebih terstruktur, fokus, dan tidak bertele-tele.

**Perubahan yang Dilakukan:**
1. **Pembersihan Metrik & Elemen Redundan di Overview Seller (`app/(dashboard)/user/page.tsx`):**
   - Menghapus metric cards redundan di ringkasan penjual: "Listing Aktif Masuk", "Pertanyaan Masuk", dan "Dana di Escrow".
   - Menghapus tab bar internal ("Ringkasan & Iklan", "Pusat Diskusi & Chat", "Pesanan Berjalan") di bagian atas seller dashboard karena navigasi dialihkan sepenuhnya ke menu sidebar.
   - Menghapus card quick-nav ganda dari overview section.
   - Mengatur kontrol tampilan seller melalui state `sellerView` (`overview | chat | orders`) yang tersinkronisasi dengan query parameter URL (`?tab=seller&view=chat` dan `?tab=seller&view=orders`).
   - Merapikan struktur container JSX (`div` dengan spacing konsisten) untuk mencegah potensi layout blowout/horizontal overflow.

2. **Pemisahan Menu Navigasi & Integrasi Suspense (`components/layout/DashboardSidebar.tsx`):**
   - Menambahkan menu baru untuk alur seller di navigasi Akun Saya:
     - **Pusat Diskusi & Chat** (`/user?tab=seller&view=chat`, badge: "3", icon: `MessageCircle`)
     - **Pesanan & Serah Terima** (`/user?tab=seller&view=orders`, badge: "3", icon: `Package`)
   - Memisahkan komponen navigasi menjadi sub-komponen `SidebarNav` dan membungkusnya dengan `<Suspense>` boundary + fallback skeleton loader. Hal ini krusial untuk mencegah hydration error atau client-side de-opt Next.js pada halaman statis yang memanggil `useSearchParams()` (seperti `/user/transactions`).
   - Menyesuaikan active-state detector di navigasi agar mengenali parameter query `view=chat` dan `view=orders` secara tepat dan memberikan highlight aktif sesuai role.
   - Memastikan navigasi internal berjalan dalam tab yang sama (`target="_self"`), mencegah duplikasi tab browser.
   - Penataan area informasi ringkas di sidebar agar informasi garansi/panduan dan saldo tetap mudah dipantau tanpa memakan banyak tempat di layar utama.

3. **Status Saat Ini:**
   - Navigasi seller dashboard terpisah secara modular, bersih, dan langsung dapat diakses dari sidebar.
   - Alur navigasi tidak lagi tumpang tindih; UI lebih intuitif, clean, dan bebas redundansi.
   - Tidak ada breaking change terhadap logic transaksi, chat backend, maupun Prisma schema.

#### Dev Session 10 — Linear 4-Stage Escrow Flow, Active Transaksi & Chat Hub, Multi-Buyer Auto-Locking, Review API & CI/CD Integration

```yaml
focus: 4_stage_progressive_escrow_flow_and_active_chat_hub
participants: Afiq, Aufa, Ibrahim
architecture_updates:
  linear_4_stage_flow:
    tab_1_negosiasi: 2-way chat (Buyer & Seller), price offer form with seller ACC/Reject, anti-bypass security banner at bottom
    tab_2_bayar_rekber: 3-way chat (Buyer, Seller, Admin), dynamic QRIS invoice, 5-minute payment countdown timer, escrow deposit verification
    tab_3_amankan_akun: 2-way private chat (Buyer & Seller), password masked from admin, structured OTP 2FA request/response with timestamps, 2-hour auto-release
    tab_4_pencairan_dana: 3-way chat (Buyer, Seller, Admin), seller bank payout form, admin payout execution & proof of transfer upload, buyer 1-5 star rating & review
  active_transactions_hub:
    path: /user/chat
    sidebar_menu: Transaksi & Chat
    features: List of active transaction cards with game title, progressive stage badge, role badge, last message snippet, stage filtering (Tahap 1-4), and direct click-through to transaction rooms
  multi_buyer_negotiation_and_locking:
    isolated_rooms: Multiple buyers can negotiate on the same listing while listing is AVAILABLE
    lock_trigger: When seller ACCs an offer and that buyer clicks 'Lanjut ke Pembayaran Rekber', listing locks to IN_TRANSACTION
    suspended_alert: Other prospective buyers receive a suspended banner ('Negosiasi Ditangguhkan Sementara') and price offer inputs are frozen
    fail_safe_release: If transaction cancels or QRIS 5-minute timer expires, listing reverts to AVAILABLE and all other negotiation rooms resume automatically
  review_mode:
    status: All 4 stages unlocked in ProgressiveTransactionTabs for developer UI/UX testing
  api_and_cicd_completions:
    review_api: POST /api/transactions/[id]/reviews for persisting star ratings & reviews to Prisma Review model (DEV-10)
    cicd_workflow: Added automated test step (npm test) to GitHub Actions CI workflow (DEV-12)
build_status: passed (0 errors)
unit_tests: 6/6 passed
```

---

### Progress Summary per DEV Issue

| Issue | Status | Branch | Catatan |
|---|---|---|---|
| DEV-05 Database | ✅ Completed | `bagas/DatabasePreparation` | Merged to main |
| DEV-06 Auth & Role | 🔲 Not started | - | Assigned: Bagas |
| DEV-07 Listing Management | ✅ Done | - | Assigned: Bagas |
| DEV-08 Marketplace Integration | 🔲 Not started | - | Assigned: Bagas |
| DEV-01 Transaction Flow | 🔲 Not started | - | Assigned: Ibrahim |
| DEV-02 QRIS/Payment | 🔲 Not started | - | Assigned: Ibrahim |
| DEV-03 Handover | 🔲 Not started | - | Assigned: Ibrahim |
| DEV-04 Dispute | 🔲 Not started | - | Assigned: Ibrahim |
| DEV-09 Chat | 🟡 Waiting for Review | `feat/afiq-chat-transaction-and-review` | Assigned: Afiq. Polling chat, stage-aware, 4-stage side-by-side room integration |
| DEV-10 Review/Rating | ✅ Completed | `feat/afiq-chat-transaction-and-review` | Assigned: Afiq. API Review (`/api/transactions/[id]/reviews`) + Form Rating 1-5 Bintang di Tahap 4 |
| DEV-11 Notifications | 🟡 Waiting for Review | `feat/afiq-chat-transaction-and-review` | Assigned: Afiq. Toast Sonner, loading skeleton, empty & multi-buyer suspended alerts |
| DEV-12 CI/CD | ✅ Completed | `feat/dev-12-ci-cd` | Assigned: Afiq. GitHub Actions workflow dengan typecheck, npm test, dan build |
| DEV-13 Dashboard User | 🟡 UI Ready (dummy data) | `dashboard` | Assigned: Aufa. Unifikasi Dashboard Buyer (eks DEV-13) & Seller (eks DEV-14) jadi 1 dashboard (`/user`). UI selesai, perlu integrasi API |
| DEV-14 Dashboard Seller | 🔄 Merged ke DEV-13 | `dashboard` | Dilebur ke dalam DEV-13 (Arsitektur Unified User Dashboard) |
| DEV-15 Dashboard Admin | 🟡 UI Ready (dummy data) | `dashboard` | Assigned: Aufa. UI selesai, perlu integrasi API |
| DEV-16 Dashboard Statistics | 🟡 UI Ready (dummy data) | `dashboard` | Assigned: Aufa. UI selesai, perlu integrasi API |
| TEST-01 Alur Testing | 🔲 Not started | - | Assigned: Aufa |
| TEST-02 Testing | 🔲 Not started | - | Assigned: Aufa |

> **Catatan**: DEV-09 (Chat) dan DEV-11 (Notifikasi) berstatus `Waiting for Review` untuk final review tim/Afiq. DEV-10 (Review/Rating) dan DEV-12 (CI/CD) sudah selesai penuh dan terintegrasi. DEV-13 (User Dashboard), DEV-15 (Admin Dashboard), dan DEV-16 (Statistik) sudah memiliki UI lengkap dan menunggu integrasi database.
