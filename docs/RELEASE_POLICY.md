# Release Policy

This document defines release gates for xcopterCalc.

## Release Types
- `alpha`: internal development snapshots
- `beta`: external testing, limited trust
- `stable`: production release

## Mandatory Gates for Stable Release
1. Quality gates
- `npm run lint`
- `npm run test:ci`
- `npm run build`

2. Data provenance gates
- `npm run verify:provenance` must pass
- Every preset used in strict mode must have row-level provenance
- Verified records must contain `sourceName`, `sourceUrl`, `verifiedAt`

3. Security gates
- `npm run audit:deps` with no moderate/high/critical vulnerabilities
- Pinned dependency versions in `package.json`

4. Product/legal gates
- Safety disclaimer accepted in UI before usage
- Safety and liability statement present in docs

## Rollback Policy
- Keep previous stable build artifacts for immediate rollback.
- If a production defect affects safety calculations, roll back immediately and publish incident notes.

## Incident Policy
- Any calculation defect impacting limits/warnings is severity-high.
- Patch release should be published as soon as a validated fix is available.
