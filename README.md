# PapaStock

Herramienta interna de Papasud para stock, trazabilidad, bloqueo de operaciones inseguras y preparación documental de exportación.

## Desarrollo

```bash
npm install
npm run dev
```

Controles de calidad:

```bash
npm run check
npm test
npm run build
```

## Arquitectura

- `src/pages` y `src/components`: interfaz React.
- `src/services`: acceso a stock, exportaciones, IA mock y documentos.
- `src/lib`: validaciones puras y formateadores.
- `src/data`: dataset mock conectado para la demo.
- `src/types`: contratos del dominio.
- `src/state`: estado temporal de trazabilidad y documentos.

Los datos agregados durante la demo viven en `sessionStorage`. No hay backend ni credenciales en el cliente.
