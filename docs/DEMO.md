# PapaStock — Guía de demo

Guía operativa para presentar PapaStock. Contexto técnico completo en
`docs/PROJECT_CONTEXT.md`.

URL: `https://papastock.onrender.com`

---

## Antes de presentar

Hacelo **10 minutos antes**, no en vivo.

Al abrir la app aparece el login operativo. Usá la cuenta configurada mediante
`PAPASTOCK_AUTH_USERNAME` y `PAPASTOCK_AUTH_PASSWORD_HASH` en Render. Express
valida la identidad y entrega una cookie HttpOnly; **Salir** revoca la sesión.

### 1. Despertar el servicio

El plan Free de Render suspende el servicio por inactividad. La primera request
después de la suspensión puede tardar **decenas de segundos**.

```bash
curl https://papastock.onrender.com/health
```

Si tarda, esperá y repetí hasta obtener `{"status":"ok"}`. Después abrí la app en
el navegador y navegá una vez por cada pantalla que vas a mostrar, para que el
bundle quede en caché.

### 2. Comprobar `/health`

```bash
curl https://papastock.onrender.com/health
# → {"status":"ok"}
```

`/health` no consulta la base: responde OK aunque PostgreSQL esté caído. **No
alcanza como chequeo.**

`/ready` consulta PostgreSQL con timeout. Devuelve `{"status":"ready"}` o 503
con `{"status":"unavailable"}`. Render todavía usa `/health` hasta que el cambio
de `healthCheckPath` sea aprobado y desplegado por separado.

### 3. Comprobar la base de datos

Después de iniciar sesión, el dashboard tiene que mostrar `PostgreSQL`. El
endpoint `/api/snapshot` exige una sesión válida y ya no es público.

### 4. Comprobar que la UI no está en mock

Abrí el dashboard. Abajo a la derecha, en “Última consolidación”, tiene que decir
**PostgreSQL**. Si dice **API no disponible**:

- la app no está mostrando datos operativos;
- aparece un aviso de advertencia;
- las mutaciones quedan deshabilitadas.

Si dice **Mock explícito**, el build fue iniciado deliberadamente con
`VITE_DATA_SOURCE=mock`; nunca es consecuencia automática de una caída.

Verificá también que no haya un `VITE_DATA_SOURCE=mock` metido en el build.

### 5. Comprobar Groq

No hay endpoint de diagnóstico para esto. Se verifica por el resultado:

- Entrá a `/lots/A-204` y apretá **Analizar con IA**.
- Si el badge dice **“Analizado con IA”** → `engine: llm`, Groq responde.
- Si dice **“Análisis local de respaldo”** → `engine: heuristic`. Puede ser falta
  de `GROQ_API_KEY` en Render, cuota agotada, o timeout de 8 s.

Hacelo antes de la demo, no durante: es la única forma de saber en qué motor
estás. La demo funciona igual con heurística, pero conviene saberlo de antemano.

### 6. Comprobar los datos de A-204

En `/lots/A-204`:

- Declarado **25.000 kg**
- Verificado **24.000 kg**
- Diferencia **−1.000 kg** en rojo
- `MV-1032` presente en la lista de movimientos, 1.000 kg, **pendiente**
- Panel de análisis de discrepancia visible

Si algo de esto no coincide, la demo de N02 no va a mostrar lo que tiene que
mostrar.

### 7. Comprobar el estado de A-310

En `/exports/new` con A-310 → Brasil → Analizar.

- Si muestra **5 de 5 requisitos completos**, A-310 **ya tiene el tratamiento
  persistido** en la base. Es el estado actual conocido. El panel de dato
  faltante no va a aparecer.
- Si muestra **4 de 5** con “Tratamiento fitosanitario” faltante, tenés el
  escenario original disponible.

Decidí antes de presentar cuál de los dos caminos de la sección **Demo N03** vas
a usar.

No importes la planilla real de movimientos durante la demo: suma lotes y
ubicaciones operativas, pero no altera A-204 ni A-310. El botón está en
`/stock`. Además, el upload está temporalmente deshabilitado en producción por
hardening del parser; la carga manual de stock sigue disponible.

---

## Demo N01 — Movimiento con lenguaje natural

Ruta: `/movements/new`

### Elegir un lote seguro

**No uses A-204.** Está bloqueado por discrepancia: el preview lo va a rechazar
con `UNRESOLVED_DISCREPANCY`. Tampoco **C-102** (discrepancia de −500 kg) ni
**F-301** (verificación pendiente).

Lotes seguros hoy: **B-118, B-221, D-405, E-090, G-512, H-118** y **A-310**.

El botón “Usar ejemplo seguro” de la página propone A-310 desde Frigorífico
Central. Funciona, pero mueve stock del lote que usa la demo N03. Para mantener
los escenarios separados, es preferible un lote que no participe de N02 ni N03:

```text
Mové 200 kg del lote H-118 del Frigorífico Central al Galpón Principal.
```

Otra opción, si querés reproducir exactamente la prueba ya hecha:

```text
Mové 100 kg del lote B-118 del Frigorífico Norte al Galpón Principal.
```

> Cada corrida **escribe en la base de demo** y es permanente: descuenta del
> origen, acredita en el destino y crea un movimiento `MV-N01-*`. Si vas a
> ensayar varias veces, usá cantidades chicas y tené presente que los números que
> muestres en la presentación van a diferir del seed.

### Qué mostrar

1. **Texto** — escribí la orden en lenguaje natural.
2. **Interpretación** — apretá “Interpretar y validar”. Señalá el badge:
   “Interpretado con IA” (Groq) o “Parser local de respaldo”.
3. **Preview** — lote, ruta y cantidad extraídos, y el disponible verificado en
   origen. Remarcá el mensaje: *“Todavía no se modificó ningún dato.”*
4. **Validación** — “Validación aprobada”. Explicá que la validación es
   determinística y server-side, no del modelo.
5. **Confirmar** — el diálogo de confirmación humana dice exactamente qué se va a
   descontar y acreditar, en una única transacción.
6. **Movimiento** — “Movimiento registrado · PostgreSQL actualizado” con la
   referencia `MV-N01-*`. Andá a `/stock` y mostrá los dos registros del lote con
   los saldos ya actualizados.

### Contraste opcional

Repetí la misma orden con **A-204**:

```text
Mové 500 kg del lote A-204 del Frigorífico Sur al Galpón Principal.
```

El preview devuelve **“Movimiento bloqueado”** con la discrepancia sin resolver.
Es una forma rápida de mostrar que la IA interpretó bien pero el sistema no la
dejó escribir.

### Voz

No está implementada. Si preguntan, la respuesta es que el pipeline
(interpretación → preview → validación → confirmación → transacción) ya está
listo para recibir voz sin cambiar la lógica de escritura.

---

## Demo N02 — Discrepancia y bloqueo de despacho

Ruta: `/lots/A-204`

1. **Dashboard primero.** En `/` mostrá la tarjeta de discrepancias y la alerta
   de stock. Entrá desde “Revisar lote”.
2. **La diferencia.** 25.000 declarado, 24.000 verificado, **−1.000 kg**.
3. **Analizar con IA.** Apretá el botón del panel de discrepancia.
   - Badge esperado: **“Analizado con IA”** → `engine: llm`.
   - Resumen apuntando a **`MV-1032`**.
   - Movimiento relacionado: `MV-1032`. Explicado: **1.000 kg**. Sin explicar: **0 kg**.
   - Acción sugerida: siempre requiere revisión humana.
4. **Señalá la restricción.** El modelo no puede inventar referencias: si cita un
   movimiento que no existe en la evidencia, la respuesta se descarta y cae a la
   heurística.
5. **Intentar el despacho.** Bajá a “Emitir despacho”, dejá 5.000 kg y apretá
   “Emitir despacho”.
   - Resultado: **“Despacho bloqueado”** con
     *“Este lote presenta una discrepancia de stock sin resolver.”*
6. **El punto de la demo.** La IA explicó la diferencia con evidencia. El sistema
   **igual bloquea**. Explicar no es conciliar: mientras la discrepancia no esté
   resuelta por una persona, `validateDispatch` no habilita nada. La IA no puede
   levantar ese bloqueo.

> La resolución humana de la discrepancia todavía no está implementada, así que la
> demo termina en el bloqueo. Es el cierre correcto del relato: el sistema
> prioriza no despachar mal.

---

## Demo N03 — Exportación y compliance

Ruta: `/exports/new`

### Situación actual

A-310 → Brasil **ya está en 5/5**: la base de demo tiene un tratamiento
(Mancozeb, 2026-08-18) persistido por una corrida previa. El panel de dato
faltante no aparece.

Elegí uno de estos dos caminos **antes** de presentar.

### Opción A — Usar otro lote (recomendada, no destructiva)

Cualquier lote sin evento de tratamiento arranca en 4/5 con “Tratamiento
fitosanitario” faltante. Sirven **H-118, B-221, D-405, E-090, G-512** y **C-102**.

1. Lote **H-118**, destino **Brasil**, peso neto **13.000 kg**. Se pueden agregar
   más lotes con “Agregar lote”; cada uno lleva su propio peso.
2. “Analizar documentación” → **4 de 5**, falta el tratamiento.
3. En “Información faltante”, escribir:
   `El lote fue tratado con Mancozeb el 18 de agosto.`
4. “Interpretar información” → revisar producto y fecha extraídos.
5. Confirmar → se persiste en `traceability_events` → **5 de 5**.
6. “Emitir paquete documental” → se abre la proforma en `/documents/:id`, con
   navegación a factura, lista de empaque y remito. También se puede emitir
   cada documento por separado. Listo para imprimir o exportar a PDF.

> Esto también escribe en la base: consume un lote por ensayo. Reservá uno para la
> presentación en vivo y ensayá con otro.

### Opción B — Restablecer A-310 a 4/5

Requiere **eliminar un único evento de trazabilidad** de la base:

```text
tabla:      public.traceability_events
id:         trace-d65ac952-7088-41bd-b7c1-33c1de86cd33
lot_id:     lot-a310
event_type: treatment
event_date: 2026-08-18
```

Condiciones para hacerlo:

- **Verificar el `id` primero.** Consultá `/api/snapshot` y confirmá que el evento
  de tratamiento de `lot-a310` sigue teniendo ese `id` exacto antes de tocar nada.
  El `id` fue generado con UUID y es específico de esta base.
- **Un `DELETE` acotado por ese `id` únicamente**, ejecutado desde el Shell de
  Render por una persona, revisado antes de correr.
- **Nunca** un `DELETE` por `lot_id`, por `event_type` ni sin `WHERE`.
- **Nunca** dentro de un script de deploy, un `preDeployCommand` ni una migración.
- `npm run db:seed` **no** sirve para esto: sólo hace upsert de las filas del seed
  y no borra filas nuevas. Correrlo no cambia el estado de A-310.

No existe todavía una herramienta de reset segura en el repositorio. Está
registrado como pendiente en `docs/PROJECT_CONTEXT.md` §20. Hasta que exista,
**la Opción A es la recomendada.**

### Qué contar en N03

- La validación de requisitos es **determinística**: cada campo se resuelve
  contra datos reales del lote y de su trazabilidad. No la decide un modelo.
- El texto libre sólo **propone** un dato estructurado; el operador lo confirma
  antes de que se persista.
- La documentación se arma con datos trazables de cada lote más empaque, precio,
  comprador y transportista. Si hay varios lotes, el documento lista una fila
  por lote y el total de la operación.
- Aclarar que los requisitos son simulados para la demo (la propia pantalla lo
  dice) y que proforma/factura son documentos no fiscales.

---

## Plan B

### Si Groq falla

No pasa nada visible más que el badge. El sistema cae a la heurística canónica
server-side y devuelve `engine: heuristic`.

- La UI muestra **“Análisis local de respaldo”** en lugar de “Analizado con IA”.
- Para A-204 el resultado es **el mismo**: la heurística encuentra `MV-1032` por
  coincidencia exacta de cantidad y ubicación, con 95 % de confianza.
- En N01, el parser local extrae lote, cantidad y las dos ubicaciones; el badge
  dice “Parser local de respaldo”.
- **Aprovechalo como argumento:** el sistema no depende de que el modelo esté
  disponible, y nunca disfraza un análisis local de análisis de IA.

### Si la base falla

El frontend no reemplaza el estado real por un snapshot demo:

- aviso de advertencia visible en la UI;
- el dashboard dice **“API no disponible”**;
- no hay lotes ni stock presentados como si fueran reales;
- las operaciones quedan deshabilitadas.

Para un ensayo separado se puede iniciar explícitamente con
`VITE_DATA_SOURCE=mock`. Ese modo conserva A-204/MV-1032 y A-310 4/5, se etiqueta
como mock y sus cambios son temporales.

### Si Render está dormido

Es el plan Free: se suspende por inactividad.

1. `curl https://papastock.onrender.com/health` y esperar el arranque frío.
2. Repetir hasta obtener `{"status":"ok"}`.
3. `curl https://papastock.onrender.com/api/snapshot` y confirmar
   `"source": "database"`.
4. Abrir la app y navegar una vez por cada pantalla de la demo.

Durante la presentación, mantené una pestaña activa para que el servicio no se
suspenda entre secciones.

### Si algo se rompe en vivo

Orden de degradación, de menos a más grave:

1. Badge en heurística → seguir normal, mencionarlo como resiliencia.
2. Fallback mock → seguir con N02 y N03, saltear N01.
3. Servicio caído → mostrar la app en local (`npm run dev`) con
   `VITE_DATA_SOURCE=mock`.
