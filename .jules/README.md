# Jules agent operating rules — v3.1

Updated 2026-10-20. Active recurring agents: Nora (architecture) and Marty
(general repository health). Their schedules use the v3.1 Single Open PR, Explicit
Persona Ownership, and Main Synchronization prompts. Repository documentation
records the intended policy; the schedule prompt is deployed and verified separately in Jules.

## Explicit persona ownership and PR inventory

Each agent may have **at most one open PR**, including drafts. The limit applies
independently to Nora and Marty. A repeat trigger maintains that agent's existing
PR instead of finding new work or creating a second branch/PR.

- **Strict Persona Ownership Rules**:
  - A PR belongs to **Marty** if and only if it has title prefix `🦀 Marty:` AND head branch prefix `jules/marty/`.
  - A PR belongs to **Nora** if and only if it has title prefix `🐚 Nora:` AND head branch prefix `jules/nora/`.
  - The shared GitHub App author `google-labs-jules[bot]` ALONE does NOT indicate persona ownership.
  - Dependabot PRs, human PRs, other-persona PRs, and retired-agent PRs (Otto, Kris, Kira) do NOT consume this persona's slot.
  - Body/description mentions or passing references do NOT constitute persona ownership.
- **Paginated Inventory Scanning**:
  - Fetch all open PRs with pagination (`state=open&per_page=100`).
  - Classify each open PR as owned by this persona, owned by another persona, or non-agent (Dependabot/human).

## Continuation and multi-PR behavior

- **With one owned PR**:
  - Reevaluate its objective against current `origin/main`, merged changes, other active work, reviewer feedback, and test checks.
  - Fetch and merge `origin/main` into the existing PR head branch when ahead.
  - Safely resolve understood conflicts, address reviewer feedback, and run relevant checks.
  - Push directly to the existing remote branch while preserving commit history and review context.
  - NEVER create a replacement PR, duplicate branch, or branch with hash suffixes when continuation fails.
- **With multiple owned legacy PRs**:
  - Select the owner-designated canonical PR, or the oldest by creation time then PR number (e.g., #120 for Marty, #108 for Nora in FullStackTemplate).
  - Maintain and update that canonical PR in place.
  - Report all excess legacy PR numbers in the run output.
  - Do NOT stop solely at "limit reached" without maintaining the canonical PR.
- **With zero owned PRs**:
  - Inventory other active PRs and issues to prevent overlap.
  - Choose one demonstrated, non-overlapping objective from current `origin/main`.
  - Create a new branch from current `origin/main` using `jules/nora/<description>` or `jules/marty/<description>`.
  - Refresh live open PR inventory immediately before publication to prevent race conditions.

## Scope, evidence, and reporting

Nora reduces architectural complexity with clear boundaries and safe sequencing;
Marty makes contained, demonstrated health improvements. Preserve behavior and
security, respect human work, and keep changes focused. Do not weaken gates/tests
to get green. Report checks on the actual head, limitations, and PR/main state.
Schedules do not grant approval to merge or deploy.

Otto, Kris, and Kira remain retired. Respect their outstanding work; capture new
backlog/parity work only through explicitly scoped owner-directed tasks. Preserve
historical journals. Do not create journal-only PRs or routine activity entries.

This rollout changes future run behavior. Existing excess PRs need separately
reviewed consolidation; installing v3.1 does not itself merge or close that backlog.
