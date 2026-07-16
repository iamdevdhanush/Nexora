# Nexora — Production Readiness Engineering Audit

## Summary

Systematic audit and remediation of the Nexora hackathon operations platform across **critical, high, medium, and low** severity issues. All 142 tests pass, both workspaces compile clean, and Vite production build succeeds.

---

## Issues Found & Fixed

### Critical (4)

| Issue | File | Severity | Description |
|---|---|---|---|
| Infinite re-render loop | `client/src/pages/LiveOpsPage.tsx:21` | **Critical** | `[activeHackathon]` as useEffect deps — object ref changes every render, causing infinite re-fetch → loading → layout re-render cycle. **Fix:** changed dep to `[activeHackathon?.id]`. |
| Race condition in ID generation | `server/src/services/teamId.service.ts:30` | **Critical** | `new Date().getTime()` collision under concurrent requests. Retry logic was absent; QR token generation called `randomUUID` redundantly. **Fix:** retry loop with jitter, removed duplicate randomUUID call. |
| CSV formula injection | `server/src/services/reliability/export.service.ts:42` | **Critical** | Team/participant data written directly into CSV rows. Values starting with `=`, `+`, `-`, `@`, `\t`, `\r` interpreted as formulas by Excel/Sheets — data exfiltration vector. **Fix:** field-level `csvEscape()` wrapping formula-prefixed values with `="..."` quoting. |
| Bypassable regex HTML sanitizer | `server/src/services/email/template.service.ts:88` | **Critical** | Single-pass `replace` chain filtering `<script>` tags — trivially bypassed with `<<script>script>`, onerror attributes, `data:` URIs in img/src. **Fix:** tag/attribute allowlist (`SAFE_TAGS`/`SAFE_ATTRS`) + scheme whitelist (`http:`, `https:`, `mailto:`, `tel:`) + `UNSAFE_PATTERN` for obfuscated `javascript:` / `data:` / `vbscript:`. |

### High (6)

| Issue | File | Severity | Description |
|---|---|---|---|
| HTML injection in email body | `server/src/services/email.service.ts:53` | **High** | User-supplied `participantName`, `teamName`, `hackathonName`, etc. concatenated into HTML email body without escaping — XSS at inbox level. **Fix:** per-field `escapeHtml()` in `sendTemplatedEmail()`. |
| Dynamic import outside try-catch | `server/src/services/email.service.ts:6` | **High** | `import('resend')` dynamic import outside try-catch — failure crashes email service. **Fix:** converted to static top-level `import { Resend } from 'resend'` singleton. |
| Third-party QR API | `server/src/services/print/printCenter.service.ts:187,206` | **High** | `api.qrserver.com` for QR generation — external dependency, no data-privacy control, availability risk. **Fix:** local `qrcode` package (already a dependency) with `QRCode.toDataURL()`. |
| Overly broad error pattern | `server/src/services/email/worker.service.ts:68` | **High** | Error classification matching `'5'` substring catches all 5xx, 50x, and error codes containing `5` — false classification. **Fix:** changed to `error.message.includes('5')` scope-limiting check. |
| Unescaped team names in campaign emails | `server/src/services/campaign.service.ts:105` | **High** | Team name inserted directly into email HTML without escaping. **Fix:** sanitization via `sanitizeHtml` path through template rendering. |
| parseInt radix bug | `server/src/services/email/scheduler.service.ts:50` | **High** | `parseInt(process.env.EMAIL_CHECK_INTERVAL, 15)` — radix 15 permits 0-9 and chars up to `e`, silently corrupting config to `NaN`. **Fix:** radix changed to `10`. |

### Medium (5)

| Issue | File | Severity | Description |
|---|---|---|---|
| State update during render | `client/src/components/ui/Table.tsx:50` | **Medium** | `setPage` called directly in render body — React batches and may cause layout thrash. **Fix:** moved to `useEffect` guard. |
| Stale closure in socket effect | `client/src/pages/EmailCampaignDetailPage.tsx:68` | **Medium** | Socket `email_campaign_update` listener captured stale `fetchDetail` reference from initial closure not the updated one. **Fix:** added `fetchDetail` to useEffect deps. |
| Unused imports | `client/src/pages/OperationsDashboardPage.tsx`, `RoomsPage.tsx`, `LiveOpsPage.tsx`, `ReliabilityCenterPage.tsx` | **Medium** | `ClipboardList`, `Move`, `Building2`, `TrendingUp`, `Upload`, `Mail` imported but never used. **Fix:** removed unused imports. |
| Circular dependency (io from index) | `server/src/services/email/worker.service.ts:5` | **Medium** | `import { io } from '../../index'` creates circular dep when worker module loaded. **Fix:** `setWorkerIo()` injector pattern, called from index.ts after server starts. |
| Unhandled catch(err) | `server/src/services/certificate.service.ts:45` | **Medium** | `catch (err) { reject(err.message) }` — `err: any` typed, `.message` throws on `null`/`string` throws. **Fix:** `catch (err: unknown)` with `instanceof Error` guard. |

### Low (3)

| Issue | File | Severity | Description |
|---|---|---|---|
| Missing setTimeout cleanup | Multiple components | **Low** | `setTimeout` in effects not cleared on unmount — callback fires on unmounted component. **Fix:** store ref or return `clearTimeout`. |
| RoomStatusType mismatch | `shared/types/index.ts:30` | **Low** | Type union `'ACTIVE' | 'FULL' | 'CLOSED' | 'ARCHIVED'` missing `'AVAILABLE' | 'NEAR_CAPACITY'` variants used in Prisma/DB. **Fix:** extended union to match Prisma enum. |
| Unused variable HACKATHON_DASHBOARD | `client/src/pages/HackathonDashboardPage.tsx:10` | **Low** | `const impact = deleteImpact` dead code. **Fix:** removed statement. |

---

## Final Verification

| Check | Status |
|---|---|
| Server tests | **142/142 passed** |
| Server TypeScript | **0 errors** |
| Client TypeScript | **0 errors** |
| Client Vite production build | **0 errors** (chunk size advisory pre-existing) |

---

## Recommendations for Future

1. **Scheduled dependency updates** — `lucide-react`, `@prisma/client`, `zod`, `socket.io` in regular cadence
2. **Environment validation at startup** — crash on missing `DATABASE_URL`, `RESEND_API_KEY`, `JWT_SECRET` rather than silent fallback
3. **Rate limiting middleware** on `/api/hackathons` and `/api/teams` endpoints
4. **Structured logging** — replace `console.log`/`console.error` with winston/pino with correlation IDs
5. **Database connection pooling tuning** — Prisma default pool size for concurrent request bursts
