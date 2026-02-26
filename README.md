# CIMA + BIFIMED

Herramienta web para consultar medicamentos de CIMA (AEMPS) y enriquecer la ficha con la información de financiación e indicaciones de BIFIMED (Ministerio de Sanidad).

## Qué hace

- Búsqueda de medicamentos con filtros de CIMA.
- Vista de detalle del medicamento.
- Enriquecimiento desde BIFIMED por Código Nacional (CN):
  - Situación de financiación.
  - Tabla de indicaciones autorizadas.
  - Situación del expediente por indicación.
  - Resolución de financiación por indicación.

## Arquitectura (resumen)

- `public/index.html`: interfaz web (frontend).
- `api/bifimed/by-cn.js`: endpoint serverless para resolver ficha BIFIMED por CN.
- `api/bifimed/search.js`: endpoint serverless de búsqueda BIFIMED.
- `api/_lib/bifimed.js`: lógica de consulta y parseo HTML de BIFIMED.
- `server.js`: servidor local Express para ejecutar en escritorio.

La conexión a BIFIMED se realiza en backend (proxy), no directamente desde navegador.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Ejecutar en local

```bash
npm install
node server.js
```

Abrir en navegador:

`http://localhost:3000`

## Arranque fácil en macOS (doble clic)

Se incluyen scripts de escritorio:

- `Iniciar_CIMA_BIFIMED.command`
- `Parar_CIMA_BIFIMED.command`

Si macOS bloquea la ejecución la primera vez:

- clic derecho -> **Abrir** -> **Abrir**

## Despliegue en Vercel

1. Subir este repositorio a GitHub.
2. En Vercel: **Add New -> Project**.
3. Importar el repo.
4. Dejar `Root Directory` en `./`.
5. Deploy.

No hacen falta variables de entorno para el funcionamiento base.

## Endpoints disponibles

- `GET /api/bifimed/by-cn?cn=712570`
- `GET /api/bifimed/search?nombre=keytruda`
- `GET /api/bifimed/search?financiado=2`

## Notas importantes

- BIFIMED no expone aquí una API JSON pública para este flujo; se parsea HTML del portal oficial.
- Si el HTML de BIFIMED cambia, puede ser necesario ajustar el parser.
- Añadir caché es recomendable para producción.

## Publicación del repositorio

Ejemplo de comandos:

```bash
git add README.md
git commit -m "Añade README de uso y despliegue"
git push
```



