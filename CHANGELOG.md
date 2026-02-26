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


