# Changelog

Todos los cambios relevantes del proyecto se registran en este archivo.

## 2026-02-26

### Añadido

- Integración CIMA + BIFIMED en la interfaz web (`public/index.html`).
- Endpoints serverless para Vercel:
  - `api/bifimed/search.js`
  - `api/bifimed/by-cn.js`
- Librería compartida de parseo HTML de BIFIMED (`api/_lib/bifimed.js`).
- Configuración para despliegue en Vercel (`vercel.json`).
- Documentación de instalación y despliegue (`README.md`).
- `.gitignore` para excluir dependencias y artefactos temporales.

### Cambiado

- Se mejoró el parseo del listado de BIFIMED para mapear correctamente:
  - Código Nacional (CN)
  - Nombre del medicamento
  - Principio activo
  - Situación de financiación
  - URL de detalle ("Más información")
- Se añadió la lógica de doble salto:
  1. búsqueda por CN en listado,
  2. apertura de ficha BIFIMED (`metodo=verDetalle`).
- Se incorporó parseo de la tabla de indicaciones en ficha detallada:
  - Indicación autorizada
  - Situación expediente indicación
  - Resolución expediente de financiación indicación
- Se adaptó el frontend para mostrar en detalle la sección "Financiación BIFIMED" con tabla completa de indicaciones.

### Corregido

- Error de mapeo de columnas en el parser inicial del listado.
- Compatibilidad de parseo en tablas sin `thead` o sin `tbody`.
- Eliminación de `node_modules` del control de versiones.

### Operación

- Proyecto validado en local (`node server.js`) y en despliegue Vercel.
- Endpoint de verificación recomendado:
  - `/api/bifimed/by-cn?cn=712570`

## 2026-03-13

### Añadido

- Indicador visual de desabastecimiento en el listado de resultados de CIMA:
  - Badge `Problema de Suministro` en rojo cuando `psum = true`.
- Nueva sección en ficha de medicamento (antes de BIFIMED):
  - `Problemas de suministro`.
  - Muestra fecha de inicio, fecha de fin y texto de recomendación cuando existen.
- Nuevo endpoint backend local:
  - `GET /api/cima/problemas-suministro?cn=...`
  - Consulta CIMA y devuelve `fechaInicio`, `fechaFin`, `informacion`.
- Nuevo endpoint serverless para Vercel:
  - `api/cima/problemas-suministro.js`
  - Mismo comportamiento que en local para mantener paridad entre entornos.

### Cambiado

- La obtención de datos de desabastecimiento pasó de parseo HTML a consumo directo de CIMA REST:
  - `GET https://cima.aemps.es/cima/rest/psuministro/{cn}`
- Formato de fechas normalizado a `dd/mm/yyyy`.
- En la ficha se eliminó el enlace externo de derivación a CIMA, manteniendo solo información clínica relevante.

### Corregido

- Incidencia en Vercel donde no aparecían fechas de desabastecimiento por ausencia del endpoint `/api/cima/problemas-suministro` en entorno serverless.
- Sincronización de comportamiento entre despliegue local (`server.js`) y despliegue Vercel (`api/*`).

### Rendimiento

- Optimización de carga de ficha en frontend (`public/index.html`):
  - Render inicial rápido con datos CIMA.
  - Carga progresiva y en paralelo de BIFIMED y problemas de suministro.
  - Caché en memoria por sesión para consultas repetidas por CN/nombre.
- Optimización backend local (`server.js`):
  - Caché en memoria por CN para:
    - `GET /api/bifimed/by-cn`
    - `GET /api/cima/problemas-suministro`
  - Timeouts en llamadas externas para evitar bloqueos largos.
  - Cabeceras `Cache-Control` para favorecer respuestas rápidas en repetición.


