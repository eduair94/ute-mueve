# SECURITY — UTE Mueve APK Static Analysis Report

> **Disclaimer.** This document is the result of a **static analysis only** of the publicly distributed Android application `UTE Mueve.apk` (versionName `1.0.24`, versionCode `9922`, package `movilidad.ute.com.ute_movilidad_app`). **No active probing, exploitation, or live testing against UTE's backend was performed.** The purpose is interoperability research and responsible documentation for users of this repository's bridge API. If you are the maintainer of UTE Mueve and want this report adjusted, removed, or coordinated, contact the repository owner.
>
> **Coordinated disclosure.** Issues marked Medium or higher should be reported to UTE before any public exploitation example is published. This document does **not** include exploitation steps.

---

## Methodology

- Decoded resources with `apktool d`.
- Extracted printable strings from `lib/arm64-v8a/libapp.so` (Flutter AOT binary) using a PowerShell byte-walker.
- Inspected `AndroidManifest.xml`, `res/values/strings.xml`, `assets/flutter_assets/`, `apktool.yml`.

## Summary

| ID | Title | Severity |
|----|-------|----------|
| F-01 | Embedded Google Maps API key | Medium (depends on console restrictions) |
| F-02 | Embedded Firebase project credentials (API key, app ID, DB URL) | Low — *expected*, depends on DB/Auth rules |
| F-03 | OAuth web client ID exposed in app resources | Info — standard for Google Sign-In |
| F-04 | No certificate pinning for `movilidadelectrica.ute.com.uy` | Medium |
| F-05 | Anonymous-only API authentication (`clientIdIDP=cargaME`) | Medium |
| F-06 | `uniquekeyuser` header is device-derived, not tied to user/account | Low |
| F-07 | No app attestation (Play Integrity / SafetyNet) | Medium |
| F-08 | JWT and other API endpoints recoverable from Dart AOT strings | Info |
| F-09 | Tracking/ads permissions declared (AD_ID, ACCESS_ADSERVICES_*) | Info |
| F-10 | Deep-link URI handlers without explicit authentication check | Low |
| F-11 | minSdkVersion 21 widens attack surface for older Android | Info |
| F-12 | Several exported components (Firebase auth helpers, intent activity) | Info — Framework defaults |

---

## Findings

### F-01 — Embedded Google Maps API Key  **(Medium)**

**Evidence** — `apk-decoded/AndroidManifest.xml:30`:
```xml
<meta-data android:name="com.google.android.geo.API_KEY"
           android:value="AIzaSyAMFpy9xfBHPsFoDO9E5H14sVEE3ZcWM-s"/>
```

**Impact** — If this key is not restricted to package `movilidad.ute.com.ute_movilidad_app` + the release signing certificate SHA-1 in the Google Cloud Console, an attacker can use it from arbitrary apps/scripts and burn UTE's Maps quota / generate cost.

**Mitigation** — In GCP Console: API & Services → Credentials → restrict key to "Android apps" with the production SHA-1 and the package name. Additionally restrict to only the specific Maps SDKs used.

---

### F-02 — Embedded Firebase Project Credentials  **(Low, conditional)**

**Evidence** — `apk-decoded/res/values/strings.xml:64-79`:
```xml
<string name="firebase_database_url">https://ute-mueve-app.firebaseio.com</string>
<string name="gcm_defaultSenderId">164828307090</string>
<string name="google_api_key">AIzaSyC2uEnGrsSUJmKdr7tnZOp4bTuAa_F2hNE</string>
<string name="google_app_id">1:164828307090:android:90963ba24f3cfcb5ae904b</string>
<string name="google_crash_reporting_api_key">AIzaSyC2uEnGrsSUJmKdr7tnZOp4bTuAa_F2hNE</string>
<string name="google_storage_bucket">ute-mueve-app.appspot.com</string>
<string name="project_id">ute-mueve-app</string>
```

**Impact** — Per [Google's documentation](https://firebase.google.com/docs/projects/api-keys), the Firebase API key is **not a secret** and is safe to ship. However, the **Realtime Database URL is now public**: any researcher can probe `https://ute-mueve-app.firebaseio.com/.json` and similar paths to check whether the security rules are tight. **The risk is entirely a function of Firebase Realtime DB / Firestore / Storage rules.** If any rule is `allow read: if true` or similar, exposure is severe.

**Mitigation** — Audit Firebase rules. For `realtime database` confirm `.read`/`.write` require authenticated users (Firebase Auth UID match). For `storage` confirm path-scoped rules. For `Authentication` enable App Check on all Firebase product backends.

---

### F-03 — OAuth Web Client ID Exposed  **(Info)**

**Evidence** — `apk-decoded/res/values/strings.xml:58`:
```xml
<string name="default_web_client_id">164828307090-nsoklmj06pvq3lm3gecgeu7nonuh56lo.apps.googleusercontent.com</string>
```

**Impact** — Public client ID, expected to be visible. Combined with Firebase Auth, allows initiation of Google Sign-In flows that would target this project. Not exploitable on its own.

**Mitigation** — None required, but ensure GCP OAuth consent screen is production-verified and authorized domains are restricted.

---

### F-04 — No Certificate Pinning  **(Medium)**

**Evidence** — No `android:networkSecurityConfig` attribute in `<application>` element of `AndroidManifest.xml`. No `network_security_config.xml` found in `res/xml/`. No references to OkHttp `CertificatePinner` or Dart `securityContext.setTrustedCertificates` in extracted strings.

**Impact** — On a device with a user-installed CA (e.g., debugging/proxy tools like Burp on Android 7+ behaves correctly only with NSC config), traffic from `movilidadelectrica.ute.com.uy/api/v2` can be intercepted in clear text, exposing JWTs, `uniquekeyuser`, and `userId` of the active session.

**Mitigation** — Add a `network_security_config.xml` with `<pin-set>` for `movilidadelectrica.ute.com.uy` and `identityserver.ute.com.uy` (SPKI hash, 2 pins minimum — current + backup).

---

### F-05 — Anonymous-Only API Authentication  **(Medium)**

**Evidence** — `lib/arm64-v8a/libapp.so` strings:
```
clientIdIDP
cargaME
identifier
Anonymous
/api/v2/token
```
Token capture (in `UteMueveConsultas.md`) decodes to: `aud=apiME`, `client_id=cargaME`, `scope=[apiME]`, no subject (`sub`) claim. All authenticated endpoints validate **only** that a valid `apiME`-audience JWT is present; user-specific endpoints (e.g., `/customer/card/{userId}`) accept the `userId` as a **path parameter** with no cryptographic binding between the token and the requested userId.

**Impact** — If an attacker discovers or enumerates a valid `userId` (24-char URL-safe base64-style string), they can read that user's registered RFID cards, network preferences, and remote-charge history from any device with a valid anonymous token. Enumeration risk depends on UTE's `userId` entropy and rate-limiting.

**Mitigation (server-side)** — Bind tokens to user identity via OAuth user flow (already partially scaffolded — `identityserver.ute.com.uy/connect/authorize` and the `ute://openid` deep link in the manifest). Validate that path `userId` matches the token's subject claim.

---

### F-06 — `uniquekeyuser` Header is Device-Derived  **(Low)**

**Evidence** — `lib/arm64-v8a/libapp.so` strings: `getUniqueKeyUser`, `ensureUniqueKeysForList`. Captured value `76acf13270470` is 13 hex chars (52 bits of entropy if random; likely 48-bit device-id hash). The same value is used across all calls in the captured `.md`.

**Impact** — Device-stable identifier with no rotation. Cannot be revoked individually. If exfiltrated alongside the JWT, replay is trivial. Provides almost no security value — likely used for analytics/abuse detection by UTE.

**Mitigation** — Move device binding into a cryptographic challenge (sign nonce with hardware-backed Keystore key). Acknowledged this is a heavy lift; alternatively rate-limit per `uniquekeyuser` server-side.

---

### F-07 — No App Attestation  **(Medium)**

**Evidence** — No references to `Play Integrity API`, `SafetyNet`, `AppCheck`, or `firebase-appcheck` in extracted strings or manifest.

**Impact** — Any reverse-engineered client (this repository's bridge included) can produce indistinguishable requests. Without attestation, UTE cannot differentiate the official app from a tool that replays headers. Combined with F-05, this is the architectural enabler of the bridge we are building.

**Mitigation** — Enroll Play Integrity API + Firebase App Check for the Firebase backend, and require attestation tokens on the UTE custom backend for any user-modifying operation (`customer/card/register`, `remotecharge/start`, etc.).

---

### F-08 — Dart AOT Strings Recoverable  **(Info)**

**Evidence** — Endpoint paths, model names (`UteUserCards`, `CardsInfoFilter`, etc.), filter taxonomies, and the OAuth redirect scheme were extracted with a 30-line PowerShell loop. Dart AOT does not obfuscate string constants by default.

**Impact** — Reveals API surface, internal model names, and unused/experimental endpoints. Not a vulnerability per se; it is the modern equivalent of a hex editor on a binary.

**Mitigation** — Build with `flutter build apk --obfuscate --split-debug-info=<dir>` for release. Note this only obfuscates symbol names; literal strings cannot be hidden without server-side construction.

---

### F-09 — Tracking & Ads Permissions  **(Info)**

**Evidence** — `AndroidManifest.xml`:
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_ATTRIBUTION"/>
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_AD_ID"/>
```

**Impact** — Privacy posture. A public utility app (electricity company) requesting advertising identifiers warrants user-facing privacy disclosure. The permissions are auto-added by `play-services-measurement`, but the app pulls in `firebase-analytics`, so the dependency is intentional.

**Mitigation** — If analytics is not material to the product, drop `play-services-measurement` dependency. If kept, ensure Privacy Policy lists Google Analytics/Firebase Analytics explicitly.

---

### F-10 — Deep-Link Handlers Without Explicit Auth Gate  **(Low)**

**Evidence** — `AndroidManifest.xml:46-68`:
```xml
<data android:host="movilidad.ute.com.uy" android:pathPrefix="/cp" android:scheme="https"/>
<data android:host="movilidad.ute.com.uy" android:pathPrefix="/tkn" android:scheme="https"/>
<data android:host="movilidad.ute.com.uy" android:pathPrefix="/gf" android:scheme="https"/>
<data android:host="openid" android:scheme="ute"/>
```

**Impact** — `/cp`, `/tkn`, `/gf` deep-link prefixes are entry points to in-app flows. If the in-app handlers act on the URL without re-authenticating the user (e.g., apply a gift card from `/gf?code=…`), a phishing link could trigger unwanted actions on the active session.

**Mitigation** — Dynamic analysis required to confirm. Recommend the maintainer audit deep-link handlers to re-prompt for biometric/PIN before any side-effect.

---

### F-11 — `minSdkVersion: 21`  **(Info)**

**Evidence** — `apk-decoded/apktool.yml:9`. Supports Android 5.0+.

**Impact** — Older Android versions have weaker default network security policies (cleartext allowed on SDK ≤ 27), no scoped storage, and known platform vulnerabilities. UTE Mueve customers on legacy devices are at higher baseline risk.

**Mitigation** — Raise `minSdkVersion` to 24 (Android 7.0) or higher when adoption permits.

---

### F-12 — Exported Components  **(Info)**

**Evidence** — `android:exported="true"` set on `FlutterActivity` (entry activity, expected), `FlutterFirebaseMessagingReceiver` (FCM), `GenericIdpActivity` + `RecaptchaActivity` (Firebase Auth flows), and `RevocationBoundService` (Google Sign-In revocation). All are framework-provided components; nothing custom is exported.

**Impact** — No app-specific exported components were found, which is the desired posture. Documented here only for completeness.

**Mitigation** — None required.

---

## Out of Scope (Not Found / Not Verified)

- **MercadoPago tokenization risk**: confirmed library presence (`api.mercadopago.com`, `v1/card_tokens` strings) but the tokenization flow is client-side per MP's design, which is the documented integration model.
- **Backend rate limiting**: cannot be assessed without active testing.
- **Server-side authorization bugs**: only inferred (F-05) from token structure; not verified.
- **Cryptographic implementation correctness**: outside scope of static APK analysis.

---

## Versioning

This report covers `versionName 1.0.24` (`versionCode 9922`) extracted on 2026-05-20. Re-run when newer APKs are released — fields like the API keys are likely to remain stable across versions until rotation.
