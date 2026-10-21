# Shared application engineering — ownership and rollout policy

## Ownership

**FullStackTemplate is the canonical issue owner for reusable application engineering** affecting FullStackTemplate, Notoli, MacroMapper, and, when applicable, JudeAndrewAlabaInfrastructure. Examples: GitHub Actions, AI review publishers, security and dependency policy, CI checks, common application framework, general frontend/backend foundations, shared MCP/OAuth framework, and generic tooling. A parent issue in FullStackTemplate tracks the **entire rollout**, not merely the template implementation.

**JudeAndrewAlabaInfrastructure owns infrastructure source and operations**: shared gateway, host networking, backup, monitoring, rollback/release engine, secrets/deployment authorization, deployment orchestration and production hardening. An Infrastructure-owned change can still require coordinated downstream application PRs; link them from the Infrastructure parent, rather than relocating source ownership.

**Notoli and MacroMapper own product-specific behavior**, domain models, UX, application credentials/configuration, bug reproduction and domain MCP tools. A specific integration bug may be kept in its application repo when the fix is not portable. Shareable improvements discovered there should have a single canonical FullStackTemplate parent with the app issue cross-referenced.

Do not force identical implementations when architectures differ. Record what is intentionally different and why. Notoli's enabled MCP tools and MacroMapper's disabled scaffolding, or Infrastructure's Required CI and extra secrets gate, are not automatic parity defects.

## Shared-ticket definition of done

For every reusable change, the FullStackTemplate issue must:

1. **Inventory affected repositories**: FullStackTemplate, Notoli, MacroMapper, Infrastructure. Mark each *required*, *not applicable* (with reason), *already satisfied* (with evidence), or *explicitly deferred* (with reason, owner and tracking link). Include new applications when relevant.
2. **Implement and validate the canonical implementation** with relevant automated regressions, security review, documentation, and unchanged security/merge/production controls.
3. **Propagate the change** through independent, reviewed PRs in every applicable repository; adapt only deliberate app or infrastructure specifics. For Infrastructure-owned deployment machinery, update the pinned source and downstream vendored consumers according to that project's contract.
4. **Verify the actual downstream results** on final PR heads and `main`: required checks, reviewer verdicts, documentation, acceptance scenarios, and configuration/rulesets where relevant. Do not treat a green upstream PR, a local uncommitted file, or a claimed schedule edit as downstream completion.
5. **Record exact links** to upstream/downstream PRs and issues, commits, test evidence, deployment impact, and any intentional exceptions.
6. **Close the parent only when** all required downstream adoptions are merged and verified, or explicitly deferred under a separate tracked issue with clear responsibility and acceptance. Do not mark an untested or blocked capability complete.

### Canonical issue template

```md
## Shared objective and source of truth
[What reusable policy/implementation changes and why]

## Repository applicability and rollout
- [ ] FullStackTemplate — [PR / evidence / intentional exception]
- [ ] MacroMapper — [PR / evidence / intentional exception]
- [ ] Notoli — [PR / evidence / intentional exception]
- [ ] JudeAndrewAlabaInfrastructure — [PR / evidence / intentional exception]

## Shared acceptance
- [ ] Upstream implementation and regression tests
- [ ] Applicable downstream implementation/verification
- [ ] Existing branch/security/review checks and privileges preserved
- [ ] GitHub settings, operational docs, and project-field effects reviewed
- [ ] Cross-repo PR links, checks, and documented exclusions
```

## Ticket consolidation and history

Prefer one open canonical FullStackTemplate ticket over multiple copies of the *same portable task*. When a downstream issue duplicates that canonical task, preserve its original URL, acceptance/evidence, comments and project history via a bidirectional link and absorb its unique requirements into the parent. Close the redundant downstream issue as **not planned / superseded**, not "completed", until implementation actually passes. If a genuine issue transfer is available and preserves history, prefer it. If only create/link/close is supported, never claim a native transfer occurred.

Retain separate downstream tickets for sizeable app-specific implementations, independent approvals, existing in-flight PRs, security-alert issues managed automatically, and post-release/runtime validation. Keep the FullStackTemplate parent linked to these, rather than creating contradictory duplicate descriptions.

Never add `jules` or other automation-triggering labels just to reorganize issues; preserve appropriate assignees, project fields, statuses, and references. Do not move or close an issue that Codex/Jules is actively implementing without reconciling that active work. No automatic merge, production rollout, changes to live agent schedules, credential rotation, or security bypass is implied by consolidation.

## Drift prevention

Where possible, write parity checks against **behavioral contracts**, immutable source manifests and explicit exceptions, not arbitrary byte-for-byte equality of app-specific workflow files. FullStackTemplate owns reusable checks for workflow emitted names versus required GitHub rulesets, common reviewer outcomes, immutable Actions, security gates, framework pin hashes and downstream adoption. Link changes in the shared policy to the affected consumers before declaring completion.
