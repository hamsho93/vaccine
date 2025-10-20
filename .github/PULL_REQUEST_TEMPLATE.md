# Pull Request

## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] CDC guideline update
- [ ] Dependency update

## CDC Compliance

If this PR affects vaccine recommendations:

- [ ] I have verified this aligns with [CDC guidelines](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)
- [ ] I have added or updated QA scenarios in `scripts/qa.ts`
- [ ] I have added or updated unit tests
- [ ] All QA scenarios pass (8/8)
- [ ] I have linked the relevant CDC note section

CDC Reference: [link to specific CDC note]

## Testing Done

- [ ] `npm run check` passes (TypeScript)
- [ ] `npm run lint` passes (ESLint)
- [ ] `npm run build:frontend` succeeds
- [ ] `npm test` passes (unit tests with coverage)
- [ ] `npm run qa` passes (CDC QA scenarios) - requires dev server running
- [ ] Manual testing completed

## Test Coverage

Current coverage: __%

If coverage decreased, explain why:

## Screenshots (if applicable)

Add screenshots for UI changes.

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## Related Issues

Fixes #(issue number)
Closes #(issue number)
Related to #(issue number)

## Additional Notes

Any additional information for reviewers.

