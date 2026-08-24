# Despliegue en Render

## Recursos y costo

El Blueprint crea un Web Service `starter` y PostgreSQL `basic-256mb` en `virginia`. El servicio pago es necesario porque Render limita `preDeployCommand` a servicios pagos; la base gestionada tampoco se presupone gratuita. Revisar créditos/precio vigente antes de aplicar el Blueprint.

## Alta

1. Subir esta rama a GitHub y abrir **New > Blueprint** en Render.
2. Elegir el repositorio y `render.yaml`.
3. Ingresar los secretos `GROQ_API_KEY`, `PAPASTOCK_AUTH_PASSWORD_HASH` y
   `PAPASTOCK_SESSION_SECRET` cuando Render los solicite (`sync: false`).
4. Confirmar ambos recursos y esperar build, migración previa y arranque.
5. Ejecutar una única vez el seed desde Render Shell: `npm run db:seed`.

El seed no se ejecuta en cada deploy. `DATABASE_URL` se cablea desde el PostgreSQL interno y nunca llega al bundle Vite.

## Acceso operativo

- `PAPASTOCK_AUTH_USERNAME` identifica la única cuenta operadora inicial.
- `PAPASTOCK_AUTH_PASSWORD_HASH` se genera localmente con `npm run auth:hash`;
  el comando lee `PAPASTOCK_AUTH_PASSWORD` y sólo imprime el hash scrypt.
- `PAPASTOCK_SESSION_SECRET` debe ser aleatorio, tener al menos 32 caracteres y
  existir sólo en Environment de Render y en el entorno local necesario.
- Express entrega una sesión opaca mediante cookie `HttpOnly`, `SameSite=Strict`
  y `Secure` en producción. Reiniciar la única instancia invalida las sesiones.

En PowerShell se puede evitar escribir la contraseña en el historial:

```powershell
$secure = Read-Host -AsSecureString
$env:PAPASTOCK_AUTH_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
npm run auth:hash
Remove-Item Env:PAPASTOCK_AUTH_PASSWORD
```

## Verificación

```bash
curl https://papastock.onrender.com/health
curl https://papastock.onrender.com/api/snapshot
```

Luego verificar en UI:

- `/lots/A-204`: diferencia `-1.000 kg`, MV-1032 relacionado, análisis IA o fallback identificado y despacho bloqueado.
- `/exports/new`: A-310 → Brasil → 4/5 → confirmar tratamiento → 5/5 → proforma.
- refrescar directamente una ruta React profunda.

## Operación

- Migraciones: `preDeployCommand: npm run db:migrate`; checksum impide editar migraciones ya aplicadas.
  Para una ventana controlada se puede usar `npm run db:migrate -- --to <archivo>`.
  `--only <archivo>` sólo acepta la próxima migración pendiente y nunca salta dependencias.
- Seed/reseed: `npm run db:seed`, manual e idempotente.
- Secretos: rotar las claves desde Environment; no usar variables `VITE_*` para secretos.
- Rollback de aplicación: desplegar un commit anterior. No revertir esquema automáticamente; crear una nueva migración correctiva.
- Logs: buscar prefijos `[database]`, `[api]` y `[ai]`. Los fallos Groq producen análisis heurístico, no caída de la ruta.
- Base: `ipAllowList: []` evita acceso externo; usar Render Shell para tareas administrativas.

## Limitaciones deliberadas

La autenticación y autorización iniciales cubren toda la API de inventario. Sigue
pendiente rate limiting y la persistencia de despachos/documentos generados.
