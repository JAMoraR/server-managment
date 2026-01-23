# Gestor de Tareas en Equipo

Un sistema completo de gestión de tareas y documentación construido con Next.js, TypeScript, TailwindCSS, shadcn/ui y Supabase.

## Descripción General

Este proyecto es una aplicación web para la gestión de tareas con un sistema de roles, documentación tipo wiki, y métricas de rendimiento. Implementa autenticación segura, políticas de seguridad a nivel de base de datos (RLS), y una arquitectura moderna basada en Next.js App Router.

## Características Principales

- **Autenticación**: Sistema de autenticación email/contraseña con Supabase Auth
- **Control de Acceso por Roles**: Roles de administrador y usuario con permisos diferenciados
- **Gestión de Tareas**: Creación, asignación y seguimiento de tareas
- **Solicitudes de Asignación**: Los usuarios pueden solicitar ser asignados a tareas (incluyendo tareas ya asignadas)
- **Centro de Notificaciones**: Sistema de notificaciones para seguimiento de solicitudes
- **Indicadores Visuales**: Puntos rojos pulsantes para notificaciones nuevas en el sidebar
- **Actualizaciones de Progreso**: Sistema de comentarios para seguimiento de tareas
- **Enlaces de Recursos**: Agregar enlaces y recursos a las tareas
- **Wiki de Documentación**: Documentación dinámica organizada en secciones y páginas
- **Métricas de Usuario**: Panel administrativo con análisis de rendimiento
- **Modo Oscuro/Claro**: Tema personalizable con persistencia
- **Diseño Responsivo**: Interfaz adaptable a dispositivos móviles
- **Keep-Alive**: Sistema de ping automático para prevenir suspensión del servidor

## Estructura del Proyecto

### Arquitectura General

El proyecto sigue la arquitectura de Next.js 14 App Router con una clara separación de responsabilidades:

```
web/
├── app/                          # Rutas y lógica de la aplicación
│   ├── (dashboard)/             # Grupo de rutas protegidas
│   │   ├── layout.tsx           # Layout con Sidebar y autenticación
│   │   ├── admin/               # Rutas exclusivas de administrador
│   │   │   ├── layout.tsx       # Verificación de rol admin
│   │   │   ├── documentation/   # Gestión de documentación
│   │   │   ├── metrics/         # Métricas y estadísticas
│   │   │   └── requests/        # Aprobación de solicitudes
│   │   ├── dashboard/           # Panel principal
│   │   ├── docs/                # Vista de documentación pública
│   │   │   └── [slug]/[pageId]/ # Navegación dinámica de docs
│   │   ├── notifications/       # Centro de notificaciones del usuario
│   │   └── tasks/               # Gestión de tareas
│   │       ├── [id]/            # Vista detallada de tarea
│   │       ├── my-tasks/        # Tareas asignadas al usuario
│   │       └── unassigned/      # Tareas sin asignar
│   ├── actions/                 # Server Actions (mutaciones)
│   │   ├── task-actions.ts      # CRUD de tareas y asignaciones
│   │   └── documentation-actions.ts  # CRUD de documentación
│   ├── api/                     # API Routes
│   │   └── keep-alive/          # Endpoint de keep-alive
│   └── auth/                    # Páginas de autenticación
│       ├── callback/            # Callback de Supabase Auth
│       ├── login/               # Página de inicio de sesión
│       └── register/            # Página de registro
├── components/                   # Componentes React
│   ├── ui/                      # Componentes de shadcn/ui
│   ├── *-dialog.tsx             # Diálogos modales (crear/editar)
│   ├── *-button.tsx             # Botones de acciones
│   ├── sidebar.tsx              # Navegación lateral
│   ├── task-comments.tsx        # Sistema de comentarios
│   └── task-status-selector.tsx # Selector de estado de tareas
├── lib/                         # Utilidades y configuración
│   ├── supabase/
│   │   ├── client.ts            # Cliente Supabase (client-side)
│   │   └── server.ts            # Cliente Supabase (server-side)
│   ├── types/
│   │   └── database.types.ts    # Tipos TypeScript generados
│   └── utils.ts                 # Funciones utilitarias
├── middleware.ts                # Middleware de autenticación y roles
└── supabase_schema.sql          # Schema completo de la base de datos
```

### Flujo de Datos

```
Usuario → Middleware (Auth/Role Check) → Page Component (Server) → Supabase (RLS)
                ↓
         Server Actions ← Form/Dialog ← Client Component
                ↓
         Revalidación de rutas
```

## Funcionalidades Principales

### 1. Sistema de Autenticación

**Ubicación**: `app/auth/`, `middleware.ts`, `lib/supabase/`

**Flujo de trabajo**:
1. Usuario se registra en `/auth/register` con email, contraseña, nombre y apellido
2. Supabase Auth crea la cuenta y dispara el trigger `on_auth_user_created`
3. El trigger crea automáticamente un registro en `users` table
4. Si el email coincide con el admin configurado, asigna rol `admin`
5. El middleware verifica la sesión en cada request
6. Redirecciona a `/auth/login` si no hay sesión activa

**Componentes clave**:
- `middleware.ts`: Verifica autenticación y rol en cada request
- `lib/supabase/server.ts`: Cliente SSR con manejo de cookies
- `lib/supabase/client.ts`: Cliente CSR para componentes interactivos
- Trigger SQL: `handle_new_user()` auto-crea perfil de usuario

### 2. Gestión de Tareas

**Ubicación**: `app/(dashboard)/tasks/`, `app/actions/task-actions.ts`, `components/*task*`

**Flujo de trabajo para Administradores**:
1. **Crear tarea**: Admin hace clic en "Create Task" → `CreateTaskDialog`
2. Server Action `createTask()` inserta en DB con status `unassigned`
3. **Asignar tarea**: Admin usa `AssignTaskDialog` seleccionando usuarios
4. `assignUserToTask()` crea registros en `task_assignments`
5. Status cambia automáticamente a `pending` cuando se asigna
6. **Gestionar solicitudes**: Admin aprueba/rechaza en `/admin/requests`
   - Puede agregar comentarios opcionales al aprobar/rechazar
   - El usuario recibe notificación con el comentario
7. **Dar feedback**: Admin puede comentar en cualquier tarea
   - Los comentarios notifican automáticamente a todos los usuarios asignados
   - Útil para dar feedback sobre actualizaciones de progreso

**Flujo para Usuarios**:
1. **Ver tareas**: Acceden a `/tasks`, `/tasks/unassigned`, o `/tasks/my-tasks`
2. **Solicitar asignación**: Clic en "Request Assignment" → `RequestAssignmentButton`
   - Disponible en tareas no asignadas
   - Disponible en tareas pendientes con otros usuarios asignados
   - Disponible en tareas en curso con otros usuarios asignados
   - **NO disponible** en tareas completadas
3. `requestTaskAssignment()` crea registro en `assignment_requests`
4. **Recibir notificación**: Cuando admin responde, recibe notificación
   - Ve el comentario del admin si lo agregó
5. **Verificar estado**: Ver en `/notifications` el estado (pendiente, aprobada, rechazada)
6. **Actualizar estado**: En tareas asignadas, usa `TaskStatusSelector`
7. **Comentar progreso**: `TaskComments` muestra y crea comentarios
8. **Recibir feedback**: Notificaciones cuando admin comenta en sus tareas
9. Server Action `addTaskComment()` inserta en `task_comments`

**Estados de tareas**:
- `unassigned`: Sin usuarios asignados
- `pending`: Asignada pero no iniciada
- `in_progress`: En desarrollo
- `completed`: Finalizada

**Acciones disponibles** (`task-actions.ts`):
```typescript
- createTask(): Solo admin, crea nueva tarea
- updateTask(): Solo admin, actualiza cualquier campo
- deleteTask(): Solo admin, elimina tarea
- assignUsersToTask(): Admin asigna usuario(s) a tarea
- requestAssignment(): Usuario solicita asignación
- handleAssignmentRequest(requestId, action, comment?): Admin aprueba/rechaza con comentario opcional
- getUserAssignmentRequests(): Obtiene solicitudes del usuario
- updateTaskStatus(): Usuario asignado actualiza estado
- addComment(): Usuario asignado o admin añade comentario
  * Si admin comenta, notifica a todos los usuarios asignados
```

### 3. Sistema de Notificaciones y Feedback

**Ubicación**: `app/(dashboard)/notifications/`, `app/(dashboard)/layout.tsx`, `components/sidebar.tsx`, `components/review-request-dialog.tsx`

**Base de datos**: Tabla `notifications` + campos adicionales en `assignment_requests`

**Flujo de trabajo**:
1. **Usuario solicita asignación**: Se crea registro en `assignment_requests`
2. **Admin responde con comentario opcional**: 
   - Usa `ReviewRequestDialog` para aprobar/rechazar
   - Puede agregar comentario explicativo (opcional)
   - Se guarda `admin_comment`, `reviewed_at`, `reviewed_by`
3. **Sistema crea notificación**: 
   - Inserta en tabla `notifications`
   - Tipo: `assignment_response`
   - Incluye comentario del admin si existe
4. **Admin comenta en tarea**:
   - Admin puede comentar en cualquier tarea (no solo asignadas)
   - Sistema crea notificaciones tipo `task_comment` para usuarios asignados
   - Notifica a todos excepto al admin que comentó
5. **Usuario es notificado**: 
   - Ve punto rojo pulsante en el sidebar
   - Contador incluye notificaciones no leídas
6. **Usuario revisa notificaciones**: 
   - Accede a `/notifications`
   - Ve notificaciones generales (comentarios de admin)
   - Ve historial de solicitudes con comentarios del admin
7. **Estado actualizado**: Ve todas sus solicitudes y feedback

**Tipos de notificaciones**:
- **`assignment_response`**: Respuesta a solicitud (aprobada/rechazada) con comentario opcional del admin
- **`task_comment`**: Admin comentó en una tarea asignada al usuario
- **`mention`**: (Reservado para futuras funcionalidades)

**Indicadores visuales**:
- **Punto rojo pulsante**: Aparece junto al icono cuando hay notificaciones sin leer
- **Badge "Nuevo"**: Marca notificaciones de los últimos 7 días
- **Borde destacado**: Notificaciones sin leer tienen borde primario
- **Fondo diferente**: Notificaciones sin leer usan `bg-accent/50`
- **Íconos por tipo**:
  - 🔔 Bell: `assignment_response`
  - 💬 MessageSquare: `task_comment`
- **Estados de solicitudes**:
  - 🕐 Pendiente (amarillo)
  - ✅ Aprobada (verde)
  - ❌ Rechazada (rojo)

**Para administradores**:
- **Punto rojo en "Solicitudes de Asignación"**: Indica solicitudes pendientes de revisión
- **Diálogo de revisión**: Modal con textarea para comentarios
- **Pueden comentar en todas las tareas**: No necesitan estar asignados
- Actualización automática cada 30 segundos

### 4dleAssignmentRequest(): Admin aprueba/rechaza solicitud
- updateTaskStatus(): Usuario asignado actualiza estado
- addTaskComment(): Usuario asignado añade comentario
```

### 5. Sistema de Documentación

**Ubicación**: `app/(dashboard)/docs/`, `app/(dashboard)/admin/documentation/`, `app/actions/documentation-actions.ts`

**Estructura jerárquica**:
```
Secciones (documentation_sections)
  └── Páginas (documentation_pages)
```

**Flujo de trabajo**:
1. **Admin crea sección**: `/admin/documentation` → `CreateSectionDialog`
   - Define: título, slug (URL), orden
   - Server Action: `createDocumentationSection()`
2. *6Admin crea páginas**: Dentro de cada sección → `CreatePageDialog`
   - Define: título, contenido (Markdown)
   - Server Action: `createDocumentationPage()`
3. **Usuarios leen**: Navegan por `/docs/[slug]/[pageId]`
   - Renderiza Markdown con `react-markdown`
   - Navegación por sección en sidebar

**Acciones disponibles** (`documentation-actions.ts`):
```typescript
- createDocumentationSection(): Admin crea sección
- updateDocumentationSection(): Admin edita sección
- deleteDocumentationSection(): Admin elimina sección
- createDocumentationPage(): Admin crea página
- updateDocumentationPage(): Admin edita página
- deleteDocumentationPage(): Admin elimina página
```

### 4. Panel de Métricas

**Ubicación**: `app/(dashboard)/admin/metrics/`

**Funcionalidad**:
- Solo accesible para administradores
- Muestra estadísticas por usuario:
  - Total de tareas asignadas
  - Tareas completadas
  - Tareas en progreso
  - Total de comentarios realizados
- Query con agregaciones SQL (COUNT, GROUP BY)
- Visualización en tabla con `shadcn/ui Table`

### 5. Sistema de Roles y Permisos

**Implementación multi-capa**:

#### Capa 1: Middleware (`middleware.ts`)
```typescript
// Verifica autenticación en TODAS las rutas excepto /auth
// Bloquea acceso a /admin/* si role !== 'admin'
// Redirecciona automáticamente
```

#### Capa 2: Layout Guards
```typescript
// app/(dashboard)/admin/layout.tsx
// Verifica rol en servidor antes de renderizar
// Double-check de seguridad
``Ver notificaciones | ✅ | ✅ |
| `

#### Capa 3: Row Level Security (RLS)
```sql
-- Políticas en Supabase:
-- "Only admins can create tasks"
-- "Only admins can update tasks"
-- "Users can only update assigned tasks status"
-- Seguridad a nivel de base de datos
```

#### Capa 4: UI Condicional
```tsx
// Componentes muestran/ocultan según rol:
{isAdmin && <CreateTaskDialog />}
{isAdmin && <AssignTaskDialog />}
```

**Matriz de permisos**:

| Acción | Admin | Usuario |
|--------|-------|---------|
| Crear tareas | ✅ | ❌ |
| Ver todas las tareas | ✅ | ✅ |
| Asignar tareas | ✅ | ❌ |
| Solicitar asignación | ❌ | ✅ |
| Actualizar estado (propias) | ✅ | ✅ |
| Comentar (propias) | ✅ | ✅ |
| Comentar (cualquier tarea) | ✅ | ❌ |
| Ver comentarios (todas) | ✅ | ❌ |
| Aprobar solicitudes con comentario | ✅ | ❌ |
| Rechazar solicitudes con comentario | ✅ | ❌ |
| Ver notificaciones | ✅ | ✅ |
| Recibir notificaciones de feedback | ❌ | ✅ |
| Gestionar documentación | ✅ | ❌ |
| Ver documentación | ✅ | ✅ |
| Ver métricas | ✅ | ❌ |
7
### 6. Componentes de UI Interactivos

**Diálogos Modales** (usando `shadcn/ui Dialog`):
- `CreateTaskDialog`: Formulario de nueva tarea
- `EditTaskDialog`: Editar tarea existente
- `AssignTaskDialog`: Selección múltiple de usuarios
- `ReviewRequestDialog`: Aprobar/rechazar solicitudes con comentario opcional
- `CreateSectionDialog`: Nueva sección de docs
- `EditSectionDialog`: Editar sección
- `CreatePageDialog`: Nueva página de documentación
- `EditPageDialog`: Editar página con Markdown

**Selectores y Controles**:
- `TaskStatusSelector`: Dropdown para cambiar estado
- `RequestAssignmentButton`: Botón con confirmación
- `DeleteTaskButton`: Botón con confirmación de eliminación

**Navegación**:
- `Sidebar`: Navegación principal con íconos
  - Dashboard
  - Notifications (con indicador visual)
  - Documentation
  - Admin (Requests con indicador, Metrics, Docs Management)
  - User profile dropdown con logout
  - Theme toggle (modo oscuro/claro)anagement)
  - User profile dropdown con logout

## Flujo de Trabajo del Usuario

### Usuario Regular

1. **Inicio de sesión** → `/auth/login`
   - Puede solicitar tareas no asignadas
   - Puede solicitar tareas con otros usuarios asignados (pendientes o en curso)
   - No puede solicitar tareas completadas
5. **Monitorear solicitudes** → Icono de campana con punto rojo indica nuevas respuestas
6. **Ver notificaciones** → `/notifications` → Estado de todas las solicitudes
7. **Esperar aprobación** → Admin debe aprobar en `/admin/requests`
8. **Trabajar en tarea** → `/tasks/my-tasks` → Abrir tarea asignada
9. **Actualizar estado** → Cambiar de `pending` → `in_progress` → `completed`
10. **Añadir comentarios** → Documentar progreso y actualizaciones
11. **Trabajar en tarea** → `/tasks/my-tasks` → Abrir tarea asignada
7. **Actualizar estado** → Cambiar de `pending` → `in_progress` → `completed`
8. **Añadir comentarios** → Documentar progreso(punto rojo indica pendientes)  y actualizaciones
9. **Consultar docs** → `/docs` para guías y referencias

### Administrador (Jose Morales)

1. **Inicio de sesión** → `/auth/login`
2. **Crear tareas** → `/tasks` → "Create Task"
3. **Asignar directamente** → Abrir tarea → "Assign Users"
4. **Revisar solicitudes** → `/admin/requests` → Aprobar/Rechazar
5. **Monitorear progreso** → Ver todas las tareas y comentarios
6. **Revisar métricas** → `/admin/metrics` → Análisis de rendimiento
7. **Gestionar docs** → `/admin/documentation`
   - Crear secciones y páginas
   - Organizar contenido Markdown
   - Mantener documentación actualizada

## Seguridad y Rendimiento

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

```sql
-- Ejemplo: Solo admin puede crear tareas
CREATE POLICY "Only admins can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Optimizaciones

1. **Server Components**: La mayoría de páginas son Server Components (sin JS en cliente)
2. **Server Actions**: Mutaciones del lado del servidor con `revalidatePath()`
3. **Indexes**: Indexes en columnas frecuentemente consultadas
4. **Lazy Loading**: Componentes de diálogo cargan solo cuando se necesitan
5. **Caching**: Next.js cache automático con revalidación selectiva

### Keep-Alive System

**Problema**: Supabase free tier suspende proyectos inactivos
**Solución**: 
- API route: `/api/keep-alive`
- Actualiza timestamp en tabla `keep_alive`
- Configurar cron job externo (cron-job.org, Vercel Cron)
- Ping cada 24 horas previene suspensión



### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

Run the SQL in `supabase_schema.sql` in your Supabase SQL Editor. This will:
- Create all required tables
- Set up Row Level Security (RLS) policies
- Create triggers and functions
- Set up indexes for performance

**Important**: Update the admin email in the `handle_new_user()` function if needed. By default, the email `jose.morales@example.com` will be assigned the admin role.

### 4. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### 5. Crear Cuenta de Administrador

1. Ir a `/auth/register`
2. Registrarse con el email especificado en el trigger de la base de datos (default: `jose.morales@example.com`)
3. Nombre: Jose
4. Apellido: Morales
5. Esta cuenta será automáticamente asignada el rol admin

## Tecnologías Utilizadas

## Tecnologías Utilizadas

### Frontend
- **Next.js 14**: Framework React con App Router y Server Components
- **TypeScript**: Tipado estático para mejor DX y menos errores
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Componentes accesibles y personalizables
- **Lucide Icons**: Iconos modernos y consistentes (Bell, MessageSquare, Check, X, etc.)
- **react-markdown**: Renderizado de Markdown en páginas de docs

### Backend
- **Supabase**: 
  - PostgreSQL: Base de datos relacional
  - Auth: Sistema de autenticación completo
  - Row Level Security: Políticas de seguridad a nivel de DB
  - Realtime (opcional): Actualizaciones en tiempo real
- **Next.js Server Actions**: Mutaciones del lado del servidor
- **Next.js API Routes**: Endpoints REST personalizados

### DevOps & Tools
- **Git**: Control de versiones
- **npm**: Gestor de paquetes
- **ESLint**: Linting de código
- **Prettier** (recomendado): Formateo de código

## Instrucciones de Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crear un nuevo proyecto en [supabase.com](https://supabase.com)
2. Copiar la URL del proyecto y la anon key
3. Crear archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configurar la Base de Datos

Ejecutar el SQL en `supabase_schema.sql` en el SQL Editor de Supabase. Esto:
- Crea todas las tablas necesarias
- Configura políticas de Row Level Security (RLS)
- Crea triggers y funciones
- Establece índices para rendimiento

**Importante**: Actualizar el email del admin en la función `handle_new_user()` si es necesario. Por defecto, el email `jose.morales@example.com` será asignado el rol admin.

### 4. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### 5. Crear Cuenta de Administrador

1. Ir a `/auth/register`
2. Registrarse con el email especificado en el trigger de la base de datos (default: `jose.morales@example.com`)
3. Nombre: Jose
4. Apellido: Morales
5. Esta cuenta será automáticamente asignada el rol admin

## Configuración del Keep-Alive

Para prevenir la auto-suspensión del tier gratuito de Supabase, configurar un cron job que haga ping a:

```
GET https://tu-dominio.com/api/keep-alive
```

Recomendado: Cada 24 horas

Servicios sugeridos:
- Cron-job.org
- EasyCron
- GitHub Actions
- Vercel Cron Jobs

## Consejos de Desarrollo

- Usar Server Actions para mutaciones de datos
- El middleware maneja autenticación y verificación de roles
- Las políticas RLS refuerzan seguridad a nivel de base de datos
- Todas las rutas excepto `/auth/*` requieren autenticación
- Server Components por defecto, Client Components solo cuando sea necesario
- `revalidatePath()` para actualizar cache después de mutaciones
- Usar tipos TypeScript generados desde Supabase