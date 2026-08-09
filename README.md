# Familia Alania

Aplicación web privada para organizar información familiar: integrantes, salud,
finanzas, precios, proyectos, mascotas, educación, seguros y archivos
históricos.

## Tecnología

- Next.js y React
- Supabase: base de datos, autenticación de la aplicación y almacenamiento
- Vercel: despliegue web

## Requisitos

- Node.js 22 o superior
- Variables de entorno de Supabase configuradas en Vercel y en el archivo local
  `.env.local` (este archivo nunca se sube a GitHub).

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Desarrollo local

```powershell
npm install
npm run dev
```

Abre `http://localhost:3000` en el navegador.

## Verificación

```powershell
npm run build
```

## Base de datos

Los scripts SQL están en `supabase/`:

- `schema.sql`: estructura base de las tablas.
- `datos_iniciales.sql`: datos iniciales opcionales.
- `ampliacion_modulos.sql`: ampliaciones para módulos complementarios.

Ejecútalos desde el editor SQL de Supabase según corresponda. Las tablas usan
el prefijo `tb_` y nombres en español.

## Despliegue

El repositorio se conecta a Vercel mediante la rama `main`. Cada cambio subido
a esa rama genera un nuevo despliegue. Vercel detecta automáticamente Next.js;
no se requiere `vercel.json`.

## Archivos que no se suben

No subas `.env.local`, `node_modules`, `.next`, `.vercel` ni archivos de salida
generados. El archivo `.gitignore` ya los excluye.
