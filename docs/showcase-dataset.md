# Dataset Showcase

El Showcase es un dataset PostgreSQL aislado, determinístico y auditable. No es
un mock y no modifica registros históricos. Su metadata estable es
`source = papastock_showcase` y su manifiesto ejecutable vive en
`server/db/showcaseDataset.ts`.

## Secuencia

1. `SHOWCASE-IMPORT-001..003` ingresan 10.000, 6.000 y 4.000 kg en Campo Oriente.
2. `SHOWCASE-TRANSFER-001` mueve 2.000 kg de SHOW-001 a Frigorífico A y queda
   completada.
3. `SHOWCASE-RECEPTION-001` recibe exactamente esos 2.000 kg y queda terminal e
   idempotente.
4. `SHOWCASE-TRANSFER-002` mueve 1.000 kg de SHOW-002 y queda pendiente.
5. `SHOWCASE-TRANSFER-003` queda cancelada; sus 500 kg no afectan el ledger.
6. `SHOWCASE-CORRECTION-001` restaura 250 kg a SHOW-001 y deduce 250 kg de
   SHOW-002 en Frigorífico A, referenciando la transferencia original.
7. SHOW-001/Campo Oriente se verifica con `expectedVersion = 1`, 7.900 kg
   contados y versión resultante 2. SHOW-003 queda pendiente de verificación.

## Balance final reconstruible

| Lote | Ubicación | Unidad | Declarado | Ledger | Verificado | Pendiente | Versión |
|---|---|---:|---:|---:|---:|---|---:|
| SHOW-001 | Campo Oriente | kg | 8.000 | 8.000 | 7.900 | no | 2 |
| SHOW-001 | Frigorífico A | kg | 2.250 | 2.250 | 2.250 | no | 1 |
| SHOW-002 | Campo Oriente | kg | 5.000 | 5.000 | 5.000 | no | 1 |
| SHOW-002 | Frigorífico A | kg | 750 | 750 | 750 | no | 1 |
| SHOW-003 | Campo Oriente | kg | 4.000 | 4.000 | 4.000 | sí | 0 |

Todas las coordenadas deben clasificarse `MATCH` en el ledger verifier.

## Visibilidad

El repository y el snapshot de producción cargan estos lotes, stocks,
movimientos y eventos sin ramas especiales. La UI existente muestra lotes,
ubicaciones, cantidades, estados y verificación. Recepción y corrección quedan
auditables en movimientos/trazabilidad; no se agrega una pantalla nueva.

## Ejecución segura

En producción, `npm run db:showcase` omite el trabajo con exit code 0 antes de
crear una conexión. Una futura escritura requiere aprobación humana y el comando
explícito:

```bash
npm run db:showcase -- --apply-production
```

No ejecutar ese comando mientras la rotación de la credencial PostgreSQL siga
pendiente.
