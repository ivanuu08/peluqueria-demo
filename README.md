# Áureo Studio — Guía de configuración

Peluquería de lujo con sistema de reservas online y panel de administración.

## Stack

- **Frontend**: HTML, CSS, JavaScript vanilla
- **Base de datos**: Supabase (PostgreSQL)
- **Emails**: Resend

---

## 1. Configurar Supabase

### Crear proyecto
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto
3. Anota la **URL del proyecto** y la **anon/public key** (en Settings → API)

### Ejecutar el schema
1. En el panel de Supabase, ve a **SQL Editor**
2. Abre el archivo `sql/schema.sql` de este proyecto
3. Pega el contenido y haz clic en **Run**

Esto crea las tablas `profesionales`, `servicios` y `reservas`, activa Row Level Security y carga los datos iniciales.

---

## 2. Configurar Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta gratuita
2. En **API Keys**, crea una nueva clave
3. Para producción, verifica tu dominio en **Domains**
4. Para pruebas puedes usar `onboarding@resend.dev` como dirección de envío

---

## 3. Añadir credenciales

Abre `js/config.js` y reemplaza los valores:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';

const RESEND_API_KEY = 're_xxxxxxxxxxxx';
const RESEND_FROM_EMAIL = 'Áureo Studio <citas@tu-dominio.com>';
```

---

## 4. Abrir la web

Puedes abrirla directamente en el navegador o con cualquier servidor estático:

```bash
# Con Python
python -m http.server 3000

# Con Node.js (npx)
npx serve .
```

- Web pública: `http://localhost:3000`
- Panel admin: `http://localhost:3000/admin.html`
- Contraseña del panel: `aureo2026`

---

## Estructura de archivos

```
/
├── index.html          Web pública
├── admin.html          Panel de administración
├── css/
│   ├── styles.css      Estilos web pública
│   └── admin.css       Estilos panel admin
├── js/
│   ├── config.js       Credenciales (editar antes de usar)
│   ├── supabase-client.js  Funciones de base de datos
│   ├── reservas.js     Lógica del formulario de reservas
│   ├── main.js         Navbar, scroll, animaciones
│   └── admin.js        Lógica del panel admin
├── sql/
│   └── schema.sql      Schema y seed para Supabase
└── README.md
```

---

## Notas de seguridad

- La contraseña del admin está hardcodeada en `config.js`. Para producción se recomienda usar Supabase Auth.
- La `anon key` de Supabase es pública por diseño. Las políticas RLS del schema controlan qué operaciones se permiten.
- El envío de emails con Resend se hace directamente desde el navegador (cliente). Para producción se recomienda mover esto a una Edge Function de Supabase para no exponer la API key de Resend.
