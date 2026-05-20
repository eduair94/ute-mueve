# Vulnerability Report VR-001 — IDOR exposing PII and credit-card metadata via Uruguayan CI

> **Status:** Draft, not yet disclosed to UTE.
> **Reporter:**  `<admin@checkleaked.cc>`
> **Date discovered:** 2026-05-20
> **Severity (CVSS 3.1):** **9.1 / Critical**  — `AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N`
> **Product:** UTE Mueve (electric-mobility platform of Administración Nacional de Usinas y Trasmisiones Eléctricas, Uruguay).
> **Affected surface:** Public REST API at `https://movilidadelectrica.ute.com.uy/api/v2`. Verified against APK `versionCode 9922` (`versionName 1.0.24`).

---

## 1. Summary

`/api/v2` issues anonymous JWTs to any client that presents a self-generated `uniquekeyuser` header. Once a token is held, several user-scoped endpoints (notably `GET /api/v2/customer/card/{key}`) accept a bare Uruguayan cédula (CI) as the path parameter and return the customer's full record — including first and last name, BIN + last 4 of their MercadoPago-linked credit card, card expiration date, brand, internal MercadoPago `payerCardId`, registered RFID account, network subscriptions, and remote-charge history.

The cédula is a 7–9-digit national identifier under ~5 million issued values. There is no observed rate limiting on token issuance or on subsequent reads. Combined, this allows an attacker to enumerate the entire Uruguayan UTE Mueve user base and extract enough financial and personal information to mount highly credible vishing/phishing campaigns, identity-pivoting attacks, and mobility-pattern surveillance.

## 2. Reproduction (three HTTP calls)

```http
POST /api/v2/token HTTP/1.1
Host: movilidadelectrica.ute.com.uy
user-agent: Dart/3.4 (dart:io)
content-type: application/json; charset=utf-8
uniquekeyuser: <ANY-13-HEX-CHARS>     # randomly generated, NOT pre-registered

{"clientIdIDP":"cargaME","identifier":"Anonymous"}
```
Response (truncated): `{ "access_token": "<JWT>", "expires_in": 3600, "token_type": "Bearer", "scope": "apiME" }`.

```http
GET /api/v2/customer/card/<CI> HTTP/1.1
Host: movilidadelectrica.ute.com.uy
authorization: Bearer <JWT>
uniquekeyuser: <same as above>
```
Response shape (real fields, values sanitized — see `packages/openapi/fixtures/customer.card.example.json` for the JSON fixture):
```json
{
  "data": [
    {
      "id": "<REDACTED_INTERNAL_ID>",
      "cardId": "**XXXXXXXXXXXXX",
      "firstSixDigits": "<REDACTED_BIN>",
      "lastFourDigits": "<REDACTED_L4>",
      "expirationMonth": "<REDACTED>",
      "expirationYear": "<REDACTED>",
      "identifType": "CI",
      "identifNumber": "<REDACTED_CI>",
      "paymentMethodId": "<REDACTED_BRAND>",
      "firstName": "<REDACTED_NAME>",
      "lastName": "<REDACTED_NAME>",
      "status": "Habilitada",
      "cvvMandatory": true,
      "payerCardId": "<REDACTED_MP_ID>",
      "issuerId": "<REDACTED>",
      "minPay": 15,
      "cardUseType": 1,
      "cardUseTypeDesc": "Particular"
    }
  ],
  "messages": [], "success": true, "errors": [], "result": 0
}
```

Additional confirmed-exposing endpoints with the same authorization context:
- `GET /api/v2/network/<CI>` → user's enabled charging networks.
- `GET /api/v2/remotecharge/user/<CI>` → mobility-pattern history (timestamps, stations, kWh, cost).
- `POST /api/v2/card/accounts/` with `{"docType":"CI","docNumber":"<CI>","onlyUte":false}` → user's internal accountId + cardId reference.

## 3. Impact

| Data class | Disclosed without authentication |
|---|---|
| Membership (does CI X have a UTE Mueve account?) | ✅ |
| Full name on file | ✅ |
| Card brand | ✅ |
| Card BIN (first 6 PAN digits) | ✅ |
| Card last 4 PAN digits | ✅ |
| Card expiry month + year | ✅ |
| MercadoPago `payerCardId` (cross-platform pivot) | ✅ |
| Account `cvvMandatory` flag | ✅ |
| Internal accountId | ✅ |
| Enabled charging networks per user | ✅ |
| Remote-charge sessions (timestamps, kWh, cost, station/connector) | ✅ |

### Attack scenarios

1. **Mass enumeration of UTE Mueve userbase.** A 5-million-call sweep over the issued CI range exhausts the surface; at 100 req/s it completes in ~14 hours.
2. **High-credibility vishing.** Caller can verify name + brand + last 4 + expiry month/year, prompting the victim to "confirm CVV" or "approve a transaction."
3. **Targeted phishing.** Email containing the victim's name + last 4 + believable UTE / MercadoPago context.
4. **Mobility-pattern surveillance** of public figures, activists, journalists, judges — UTE Mueve usage discloses charging-station visits with timestamps.
5. **Cross-platform pivot** via `payerCardId` to enumerate MercadoPago account state where applicable.

### Regulatory exposure

- **Uruguayan Ley 18.331 (Personal Data Protection):** processing and unsecured exposure of national identifiers and financial metadata, without consent, by a state-owned enterprise.
- **BCU expectations** for payment-card data handling under the Sistema Nacional de Pagos.
- **GDPR equivalence considerations** if Uruguayan UTE Mueve customers reside or travel in the EU.

## 4. Root cause

The `apiME`-audience JWT has no `sub` claim binding it to a user. The path parameter (`{customerKey}`) is the *only* authorization signal on user-scoped endpoints. The `uniquekeyuser` header is a free-form opaque tag that the server accepts for any value — a fresh random hex string is enough. The lookup endpoint (`POST /api/v2/card/accounts/`) explicitly accepts `docType: "CI"` as a search modality.

## 5. Recommended fixes (priority order)

1. **Immediate (within hours):** Add per-IP and per-`uniquekeyuser` rate limit on `POST /api/v2/token` (e.g., 60 tokens/IP/hour). Add per-IP rate limit on `GET /customer/card/*`, `/card/accounts/*`, `/network/*`, `/remotecharge/user/*` (e.g., 20 req/min). Reject `uniquekeyuser` values that don't match a server-issued pattern (HMAC-signed device key).
2. **Short term (within weeks):** Require authenticated user tokens (Firebase ID token validation against the project's verifier, or full OAuth user flow via `identityserver.ute.com.uy/connect/*`) on every user-scoped endpoint. Validate that the path `customerKey` matches the token's `sub`/`uid`.
3. **Medium term:** Move card / payment data fields out of `GET /customer/card/{key}` (return only safe summary fields like `cardId` masked, brand, last 4). Make BIN, expiration, `payerCardId`, `issuerId`, `firstName`, `lastName` available only via a separate authenticated endpoint scoped to the owner.
4. **Long term:** Adopt App Check / Play Integrity for the official Flutter app and enforce attestation on the backend. Issue per-user JWTs with `sub` set to the customer key. Audit-log every CI-based lookup.

## 6. Disclosure timeline (proposed)

| Day | Event |
|---|---|
| 0 (2026-05-20) | Vulnerability discovered and reproduced. This report drafted. |
| 0 – 3 | Contact attempts: UTE security mailbox if present, otherwise the CERTuy national CSIRT (`certuy.gub.uy`) and AGESIC, Uruguayan technology agency. |
| 3 – 7 | Acknowledgement received. Triage call scheduled. |
| 30 | Recommended deadline for mitigations #1 (rate limit + uniquekeyuser binding) to be deployed. |
| 90 | Public disclosure of conceptual report (this document). No exploit code published. |

## 7. What this repository contains

- **This report**, conceptually describing the issue.
- **`SECURITY.md`**, an aggregate static-analysis report including this finding plus other lower-severity items.
- **An interoperability bridge** that handles UTE's anonymous-token lifecycle and exposes the read-only endpoints to which any consumer of the underlying API already has access. The bridge does **not** implement nor encourage enumeration; user-scoped endpoints in the bridge require the consumer to pass the customer key explicitly.
- **Sanitized JSON fixtures** illustrating the response shapes that demonstrate the disclosure.

## 8. What this repository does NOT contain

- Live captures with real CIs, names, card numbers, JWTs, or `payerCardId` values. All real data observed during research was used only to characterize the bug shape and has been replaced with `<REDACTED_*>` placeholders or generic schemas.
- An enumeration script or any automation that demonstrates mass scraping.
- Any tooling that lowers the bar to exploit.

## 9. Contact

`admin@checkleaked.cc` — reporter.

For UTE: this document and supporting evidence can be shared under coordinated-disclosure terms on request.
