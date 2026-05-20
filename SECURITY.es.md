# SEGURIDAD — Análisis estático del APK UTE Mueve

> **Aviso.** Este documento es resultado de un **análisis estático únicamente** de la aplicación Android distribuida públicamente `UTE Mueve.apk` (versionName `1.0.24`, versionCode `9922`, paquete `movilidad.ute.com.ute_movilidad_app`). **No se realizó probing activo, explotación ni testing en vivo contra el backend de UTE más allá de lo necesario para caracterizar la forma de la vulnerabilidad F-05 con consentimiento del titular del CI.** Propósito: investigación de interoperabilidad y documentación responsable para usuarios del puente de este repositorio. Si sos mantenedor de UTE Mueve y querés que este reporte se ajuste, retire o coordine: contactá al dueño del repositorio.
>
> **Divulgación coordinada.** Los hallazgos con severidad Media o superior se deberían reportar a UTE antes de publicar cualquier ejemplo de explotación. Este documento **no** incluye pasos de explotación.

---

## Metodología

- Decodificación de recursos con `apktool d`.
- Extracción de strings imprimibles desde `lib/arm64-v8a/libapp.so` (binario AOT de Flutter) usando un byte-walker en PowerShell.
- Inspección de `AndroidManifest.xml`, `res/values/strings.xml`, `assets/flutter_assets/`, `apktool.yml`.

## Resumen

| ID | Título | Severidad |
|----|--------|-----------|
| F-01 | Google Maps API key embebida | Media (depende de restricciones en consola) |
| F-02 | Credenciales del proyecto Firebase embebidas (API key, app ID, DB URL) | Baja — *esperado*, depende de las reglas de DB/Auth |
| F-03 | OAuth web client ID expuesto en recursos | Info — estándar para Google Sign-In |
| F-04 | Sin certificate pinning para `movilidadelectrica.ute.com.uy` | Media |
| F-05 | **IDOR vía CI uruguaya pura expone PII + metadatos de tarjeta de crédito** | **Crítica** (ver [VR-001](docs/security/2026-05-20-VR-001-idor-customer-card.es.md)) |
| F-06 | Header `uniquekeyuser` derivado del dispositivo, no atado al usuario/cuenta | Baja |
| F-07 | Sin app attestation (Play Integrity / SafetyNet) | Media |
| F-08 | JWT y otros endpoints recuperables desde strings del AOT Dart | Info |
| F-09 | Permisos de tracking/ads declarados (AD_ID, ACCESS_ADSERVICES_*) | Info |
| F-10 | Handlers de deep-link URI sin chequeo explícito de autenticación | Baja |
| F-11 | `minSdkVersion` 21 amplía superficie de ataque para Android antiguo | Info |
| F-12 | Varios componentes exportados (helpers Firebase auth, intent activity) | Info — defaults del framework |

---

## Hallazgos

### F-01 — Google Maps API Key embebida  **(Media)**

**Evidencia** — `apk-decoded/AndroidManifest.xml:30`:
```xml
<meta-data android:name="com.google.android.geo.API_KEY"
           android:value="AIzaSyAMFpy9xfBHPsFoDO9E5H14sVEE3ZcWM-s"/>
```

**Impacto** — Si esta key no está restringida al paquete `movilidad.ute.com.ute_movilidad_app` + SHA-1 del certificado de release en Google Cloud Console, un atacante puede usarla desde apps/scripts arbitrarios y quemar la cuota Maps de UTE / generar costo.

**Mitigación** — En GCP Console: API & Services → Credentials → restringir la key a "Android apps" con el SHA-1 de producción y nombre de paquete. Adicionalmente restringir solo a las SDKs Maps usadas.

---

### F-02 — Credenciales Firebase embebidas  **(Baja, condicional)**

**Evidencia** — `apk-decoded/res/values/strings.xml:64-79`:
```xml
<string name="firebase_database_url">https://ute-mueve-app.firebaseio.com</string>
<string name="gcm_defaultSenderId">164828307090</string>
<string name="google_api_key">AIzaSyC2uEnGrsSUJmKdr7tnZOp4bTuAa_F2hNE</string>
<string name="google_app_id">1:164828307090:android:90963ba24f3cfcb5ae904b</string>
<string name="google_crash_reporting_api_key">AIzaSyC2uEnGrsSUJmKdr7tnZOp4bTuAa_F2hNE</string>
<string name="google_storage_bucket">ute-mueve-app.appspot.com</string>
<string name="project_id">ute-mueve-app</string>
```

**Impacto** — Según [la documentación de Google](https://firebase.google.com/docs/projects/api-keys), la API key de Firebase **no es un secreto** y es seguro embarcarla. Sin embargo, **la URL de Realtime Database queda pública**: cualquier investigador puede probar `https://ute-mueve-app.firebaseio.com/.json` y rutas similares para chequear si las reglas de seguridad son estrictas. **El riesgo es totalmente función de las reglas de Realtime DB / Firestore / Storage.** Si alguna regla es `allow read: if true` o similar, la exposición es severa.

**Mitigación** — Auditar reglas Firebase. Para `realtime database` confirmar que `.read`/`.write` requieren usuarios autenticados (match Firebase Auth UID). Para `storage` confirmar reglas path-scoped. Para `Authentication` habilitar App Check en todos los backends Firebase.

---

### F-03 — OAuth Web Client ID expuesto  **(Info)**

**Evidencia** — `apk-decoded/res/values/strings.xml:58`:
```xml
<string name="default_web_client_id">164828307090-nsoklmj06pvq3lm3gecgeu7nonuh56lo.apps.googleusercontent.com</string>
```

**Impacto** — Client ID público, esperado que sea visible. Combinado con Firebase Auth, permite iniciar flows Google Sign-In que apuntan a este proyecto. No explotable por sí solo.

**Mitigación** — Ninguna requerida, pero asegurate de que la pantalla de consentimiento OAuth en GCP esté verificada para producción y los dominios autorizados restringidos.

---

### F-04 — Sin Certificate Pinning  **(Media)**

**Evidencia** — Sin atributo `android:networkSecurityConfig` en el elemento `<application>` del `AndroidManifest.xml`. Sin archivo `network_security_config.xml` en `res/xml/`. Sin referencias a `CertificatePinner` de OkHttp ni a `securityContext.setTrustedCertificates` de Dart en los strings extraídos.

**Impacto** — En un dispositivo con CA instalado por el usuario (p.ej. herramientas de debugging/proxy como Burp; en Android 7+ requiere NSC config), el tráfico de `movilidadelectrica.ute.com.uy/api/v2` se puede interceptar en claro, exponiendo JWTs, `uniquekeyuser` y `userId` de la sesión activa.

**Mitigación** — Agregar `network_security_config.xml` con `<pin-set>` para `movilidadelectrica.ute.com.uy` e `identityserver.ute.com.uy` (hash SPKI, mínimo 2 pins — actual + backup).

---

### F-05 — IDOR vía CI uruguaya pura expone PII + metadatos de tarjeta de crédito  **(Crítica)**

Detalle completo en [`docs/security/2026-05-20-VR-001-idor-customer-card.es.md`](docs/security/2026-05-20-VR-001-idor-customer-card.es.md). Resumen:

El JWT de `/api/v2` es anónimo (`aud=apiME`, `client_id=cargaME`, sin claim `sub`). Los endpoints user-scoped (`GET /customer/card/{key}`, `GET /card/{key}`, `GET /network/{key}`, `GET /remotecharge/user/{key}`, `POST /card/accounts/`) aceptan una cédula uruguaya pura (7-9 dígitos) como path o body parameter, sin atadura criptográfica entre el token y el customer solicitado.

Verificado en vivo el 2026-05-20: se generó un `uniquekeyuser` fresco nunca visto antes, se adquirió un token anónimo, y un único `GET /customer/card/<CI>` devolvió: nombre y apellido en file, BIN de tarjeta de crédito (primeros 6 dígitos del PAN), últimos 4 del PAN, mes/año de expiración, marca, `payerCardId` de MercadoPago, accountId interno, redes registradas e historial de cargas remotas.

**Severidad (CVSS 3.1 9.1, Crítica):** IDOR a escala nacional que expone PII y datos parciales de tarjeta de crédito de usuarios UTE Mueve por lookup de CI, sin rate-limiting observado en emisión de tokens ni en GETs user-scoped. Probable incumplimiento de la Ley 18.331 de Protección de Datos Personales del Uruguay.

**Mitigación (urgente, server-side):**
1. Rate-limit `POST /api/v2/token` por IP y por `uniquekeyuser` (p.ej. 60/hora, 10/min).
2. Requerir tokens de usuario autenticado (Firebase ID token o OAuth vía `identityserver.ute.com.uy/connect/*`) en cada endpoint user-scoped; validar que el path `customerKey` coincida con el subject del token.
3. Quitar BIN, últimos 4, expiración, campos de nombre de `GET /customer/card/{key}` hasta que se aplique auth por usuario.

---

### F-06 — Header `uniquekeyuser` derivado del dispositivo  **(Baja)**

**Evidencia** — Strings en `lib/arm64-v8a/libapp.so`: `getUniqueKeyUser`, `ensureUniqueKeysForList`. El valor capturado `76acf13270470` son 13 hex chars (52 bits de entropía si es random; probablemente hash 48-bit del device-id). El mismo valor se usa en todas las calls del `.md` capturado.

**Impacto** — Identificador estable por dispositivo sin rotación. No se puede revocar individualmente. Si se exfiltra junto con el JWT, el replay es trivial. Aporta casi nada de valor de seguridad — probablemente usado por UTE para analytics/detección de abuso.

**Mitigación** — Mover el binding del dispositivo a un challenge criptográfico (firmar nonce con clave de Keystore en hardware). Reconocido como heavy lift; alternativamente, rate-limitear por `uniquekeyuser` server-side.

---

### F-07 — Sin App Attestation  **(Media)**

**Evidencia** — Sin referencias a `Play Integrity API`, `SafetyNet`, `AppCheck` ni `firebase-appcheck` en strings extraídos ni en el manifest.

**Impacto** — Cualquier cliente con reverse-engineering (incluyendo el bridge de este repo) puede producir requests indistinguibles. Sin attestation, UTE no puede diferenciar la app oficial de una herramienta que repite headers. Combinado con F-05, este es el habilitador arquitectónico del puente que estamos construyendo.

**Mitigación** — Habilitar Play Integrity API + Firebase App Check para los backends Firebase, y requerir tokens de attestation en el backend custom de UTE para cualquier operación de modificación de usuario (`customer/card/register`, `remotecharge/start`, etc.).

---

### F-08 — Strings del AOT Dart recuperables  **(Info)**

**Evidencia** — Rutas de endpoints, nombres de modelos (`UteUserCards`, `CardsInfoFilter`, etc.), taxonomías de filtros y el esquema OAuth de redirect se extrajeron con un loop PowerShell de 30 líneas. El AOT de Dart no ofusca string constants por defecto.

**Impacto** — Revela la superficie de la API, nombres internos de modelos y endpoints no usados/experimentales. No es una vulnerabilidad per se; es el equivalente moderno de un hex editor sobre un binario.

**Mitigación** — Buildear con `flutter build apk --obfuscate --split-debug-info=<dir>` para release. Tener en cuenta que esto solo ofusca nombres de símbolos; los strings literales no se pueden esconder sin construcción server-side.

---

### F-09 — Permisos de tracking y ads  **(Info)**

**Evidencia** — `AndroidManifest.xml`:
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_ATTRIBUTION"/>
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_AD_ID"/>
```

**Impacto** — Postura de privacidad. Una app de servicio público (empresa eléctrica) pidiendo identificadores publicitarios amerita disclosure a los usuarios. Los permisos los agrega automáticamente `play-services-measurement`, pero la app importa `firebase-analytics`, así que la dependencia es intencional.

**Mitigación** — Si analytics no es material al producto, dropear la dependencia `play-services-measurement`. Si se mantiene, asegurar que la Política de Privacidad lista Google Analytics/Firebase Analytics explícitamente.

---

### F-10 — Handlers de Deep-Link sin gate explícito de auth  **(Baja)**

**Evidencia** — `AndroidManifest.xml:46-68`:
```xml
<data android:host="movilidad.ute.com.uy" android:pathPrefix="/cp" android:scheme="https"/>
<data android:host="movilidad.ute.com.uy" android:pathPrefix="/tkn" android:scheme="https"/>
<data android:host="movilidad.ute.com.uy" android:pathPrefix="/gf" android:scheme="https"/>
<data android:host="openid" android:scheme="ute"/>
```

**Impacto** — Los prefijos `/cp`, `/tkn`, `/gf` son entry points a flows in-app. Si los handlers in-app actúan sobre la URL sin re-autenticar al usuario (p.ej. aplicar gift card desde `/gf?code=…`), un link de phishing podría disparar acciones no deseadas sobre la sesión activa.

**Mitigación** — Requiere análisis dinámico para confirmar. Se recomienda al mantenedor auditar los handlers de deep-link para re-pedir biometría/PIN antes de cualquier side-effect.

---

### F-11 — `minSdkVersion: 21`  **(Info)**

**Evidencia** — `apk-decoded/apktool.yml:9`. Soporta Android 5.0+.

**Impacto** — Versiones más viejas de Android tienen políticas default de seguridad de red más débiles (cleartext permitido en SDK ≤ 27), sin scoped storage, y vulnerabilidades conocidas de plataforma. Los clientes UTE Mueve en devices legacy están con un baseline de riesgo más alto.

**Mitigación** — Subir `minSdkVersion` a 24 (Android 7.0) o superior cuando la adopción lo permita.

---

### F-12 — Componentes exportados  **(Info)**

**Evidencia** — `android:exported="true"` en `FlutterActivity` (entry activity, esperado), `FlutterFirebaseMessagingReceiver` (FCM), `GenericIdpActivity` + `RecaptchaActivity` (flows Firebase Auth) y `RevocationBoundService` (Google Sign-In revocation). Todos son componentes provistos por el framework; nada custom está exportado.

**Impacto** — No se encontraron componentes exportados específicos de la app, que es la postura deseada. Documentado aquí solo por completitud.

**Mitigación** — Ninguna requerida.

---

## Fuera de scope (No encontrado / no verificado)

- **Riesgo de tokenización MercadoPago**: confirmada la presencia de la librería (strings `api.mercadopago.com`, `v1/card_tokens`) pero el flow de tokenización es client-side por diseño de MP, que es el modelo de integración documentado.
- **Rate limiting backend**: no se puede evaluar sin testing activo.
- **Bugs de autorización server-side**: solo inferidos (F-05) desde la estructura del token; no verificados.
- **Corrección de implementación criptográfica**: fuera del scope de análisis estático del APK.

---

## Versionado

Este reporte cubre `versionName 1.0.24` (`versionCode 9922`), extraído el 2026-05-20. Re-correr cuando salgan APKs más nuevos — campos como las API keys probablemente se mantengan estables entre versiones hasta rotación.
