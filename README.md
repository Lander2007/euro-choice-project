# PRTCMS — Petroleum Refinery Task & Certificate Management System

Role-based permit-to-work and certificate management prototype for petroleum refinery operations. Requesters submit work permits, receivers process them, approvers review and sign off, and admins have full system access.

> Demonstration prototype — no real authentication, static mock data only.

## Features

- **Role-based login** — Requester, Receiver, Approver, Administrator. Permissions and pending work adapt to the selected role.
- **Task lifecycle** — Create, submit, receive, approve, begin work, close, return, reject, cancel, and clone tasks.
- **Task detail view** — Status stepper, linked certificates, remarks thread, and full action history (audit log).
- **Certificates** — Gas Test, Fire Watch, Mechanical/Electrical Isolation, and Cold Work Pre-Check certificates with verify/unverify workflow.
- **Dashboard** — Role-aware pending-work queue plus status overview.
- **History** — Global audit trail across all task transitions.
- **Roles & Permissions matrix** — Documents what each role can do.
- **Toasts & confirm modals** — Feedback for every action; destructive actions require confirmation; return/reject require a reason.
- **Session persistence** — Login survives reloads via `localStorage` (`prtcms_user`, `prtcms_role`).

## Task status workflow

```
created → submitted → received → approved → ongoing → closed
              ↘           ↘
            returned     rejected
                ↓
            (resubmit → submitted)

cancelled / expired are terminal (expired cannot be transitioned at all).
```

Legacy seed data uses `pending` as an alias of the `submitted` stage.

## Permissions

| Permission    | Requester | Receiver | Approver | Admin |
| ------------- | --------- | -------- | -------- | ----- |
| create        | ✓         |          |          | ✓     |
| submit        | ✓         |          |          | ✓     |
| receive       |           | ✓        |          | ✓     |
| approve       |           |          | ✓        | ✓     |
| reject/return |           |          | ✓        | ✓     |
| cancel        |           |          |          | ✓     |
| clone         | ✓         | ✓        |          | ✓     |
| verify_cert   |           | ✓        | ✓        | ✓     |
| view_all / manage_users / export | |   |          | ✓     |

## Demo accounts

| Role          | Name                  | Badge   |
| ------------- | --------------------- | ------- |
| Requester     | Ahmed Al-Rashidi      | REQ-001 |
| Requester     | Fatima Al-Zahrawi     | REQ-002 |
| Requester     | Omar Khalid           | REQ-003 |
| Receiver      | Samir Okafor          | RCV-001 |
| Receiver      | Nadia Petrov          | RCV-002 |
| Approver      | Col. James Harrington | APR-001 |
| Approver      | Eng. Layla Mansour    | APR-002 |
| Administrator | System Administrator  | ADM-001 |

Sign-in flow: pick a role → pick an operator ID → Enter System → `/dashboard`.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 3.4 + custom enterprise design tokens in `app/globals.css`
- TypeScript 5.7
- Node.js 22, pnpm 10 (see `.mise.toml`)
- Formatting: `oxfmt`

## Getting started

Prerequisites: Node.js 22+.

```bash
# install dependencies (npm or pnpm — both lockfiles are present)
npm install
# or
pnpm install

# run the dev server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any demo account above.

## Scripts

| Script         | Command      | Description              |
| -------------- | ------------ | ------------------------ |
| `npm run dev`    | `next dev`   | Start development server |
| `npm run build`  | `next build` | Production build         |
| `npm run start`  | `next start` | Serve production build   |
| `npm run lint`   | `next lint`  | Run Next.js lint         |
| `npm run format` | `oxfmt`      | Format codebase          |

## Project structure

```
app/
  page.tsx               # Sign-in (role + operator picker)
  layout.tsx             # Root layout + metadata
  Providers.tsx          # AppProvider + ToastHost wiring
  globals.css            # Design tokens, tables, buttons, badges, stepper
  store/
    AppStore.tsx         # Global state: tasks, certs, remarks, logs,
                         #   permissions, status machine, seed data
  components/
    ConfirmModal.tsx     # Confirmation dialog for destructive actions
    NewTaskModal.tsx     # Create-task form (manual ID with auto fallback)
    StatusBadge.tsx      # Status pill badges
    ToastHost.tsx        # Toast notifications
  (app)/                 # Authenticated shell (sidebar + header)
    layout.tsx
    dashboard/page.tsx   # Role-aware pending queue + overview
    tasks/page.tsx       # Task list with filters
    tasks/[id]/page.tsx  # Task detail: stepper, certs, remarks, history
    certificates/page.tsx
    history/page.tsx     # Global audit trail
    roles/page.tsx       # Roles & Permissions matrix
```

## Data notes

- Seed data (15 tasks, 11 certificates) lives in `app/store/AppStore.tsx` and is anchored to a demo clock of **Dec 2024** (`TODAY = "2024-12-13"`).
- New tasks start as `created`; operators can type the Task ID manually (paper-workflow parity) or leave it blank for an auto-generated `TSK-2024-XXXX` ID.
- Cloned tasks restart at `created` with a fresh ID and today's validity start.
- `expired` tasks are read-only by design.
