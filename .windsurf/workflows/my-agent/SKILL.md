---
name: pr-checker
description: PR review automation for code quality, tests, and validation
---

# pr-checker

Automated PR review assistant that validates pull requests against quality standards.

## Instructions

When invoked, perform these steps:

1. **Fetch PR Details**: Use `gh pr view --json number,title,body,headRefName,baseRefName,author,files` to get PR information

2. **Check PR Quality**:
   - Verify title follows conventional format (feat:/fix:/docs:/refactor:)
   - Ensure description explains WHAT and WHY (not just "fix bug")
   - Check for linked issues (e.g., "Closes #123", "Fixes #456")
   - Flag missing screenshots for UI changes

3. **Analyze Code Changes**: Run `gh pr diff` and check:
   - PR size: flag if >500 lines changed (suggest splitting)
   - Test coverage: new features should include tests
   - Documentation: API changes need doc updates
   - Breaking changes: flag any API modifications

4. **Run Project Checks** (auto-detect project type):
   - **TypeScript/JavaScript**: `npm run lint`, `npm run type-check`, `npm run test`
   - **Python**: `python -m pytest`, `python -m flake8`, `python -m mypy`
   - **Rust**: `cargo check`, `cargo test`, `cargo clippy`
   - **Go**: `go build ./...`, `go test ./...`, `golangci-lint run`

5. **Validate Commits**: Run `git log --format="%s" $(git merge-base HEAD origin/main)..HEAD` and verify conventional commit format

6. **Security Scan**: Check for:
   - Hardcoded secrets/tokens/API keys
   - SQL injection patterns
   - Unsafe eval() or Function() usage
   - Console.log/debug statements in production code

7. **Generate Report**: Create structured output with:
   - Passed checks
   - Warnings (large PRs, missing tests)
   - Critical issues (failing tests, security risks)
   - Overall status: APPROVE / NEEDS_CHANGES / COMMENT

8. **Post Results**: If in CI context, comment on PR with findings

## Examples

**Input:**
```json
{
  "command": "/pr-check",
  "pr_number": 42
}
```

**Expected Output (Success):**
```
 PR #42 - feat(auth): add user login with JWT
 PR description includes context and linked issue
 All tests passing (15/15)
 Lint clean, no security issues
 3 commits follow conventional format
 Ready for merge
```

**Expected Output (Issues Found):**
```
 PR #42 - fix(auth): resolve login bug
 No tests added for bug fix
 PR description missing linked issue
 Large PR (650 lines) - consider splitting
 1 console.log found in src/auth.ts:45
 Review complete - needs changes before merge
```

**Input:**
```json
{
  "command": "/pr-check --security-only"
}
```

**Expected Output:**
```
 Security scan results:
 No hardcoded secrets found
 No SQL injection patterns
 Found console.log at src/api.ts:12 (remove before merge)
 Found eval() usage at src/utils.ts:45 (review security impact)
