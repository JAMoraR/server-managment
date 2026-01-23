# Migración: Agregar Enlaces a Tareas

## Instrucciones para aplicar la migración

1. **Conectarse a Supabase**:
   - Ve a tu proyecto en https://supabase.com
   - Navega a la sección "SQL Editor" en el panel izquierdo

2. **Ejecutar el script de migración**:
   - Abre el archivo `migration_add_task_links.sql`
   - Copia todo el contenido del archivo
   - Pégalo en el editor SQL de Supabase
   - Haz clic en "Run" para ejecutar la migración

3. **Verificar la migración**:
   - Ve a la sección "Table Editor"
   - Verifica que existe la tabla `task_links` con las siguientes columnas:
     - `id` (UUID)
     - `task_id` (UUID, foreign key a tasks)
     - `link_type` (TEXT, con valores: 'plugins', 'documentacion', 'tutoriales')
     - `name` (TEXT)
     - `url` (TEXT)
     - `created_at` (TIMESTAMPTZ)

4. **Verificar las políticas RLS**:
   - En la tabla `task_links`, haz clic en "RLS"
   - Deberías ver 4 políticas:
     - Anyone can view task links
     - Only admins can create task links
     - Only admins can update task links
     - Only admins can delete task links

## Funcionalidad implementada

### Para Administradores:
- Al crear o editar una tarea, puedes agregar enlaces organizados en tres categorías:
  - **Plugins**: Enlaces a plugins necesarios
  - **Documentación**: Enlaces a documentación relevante
  - **Tutoriales**: Enlaces a tutoriales útiles

- Para cada enlace puedes especificar:
  - Tipo (Plugins/Documentación/Tutoriales)
  - Nombre descriptivo
  - URL del recurso

### Para Usuarios:
- Los enlaces se muestran en la página de detalle de la tarea
- Están organizados por categoría
- Cada enlace aparece como un recuadro interactivo con:
  - Botón para copiar el enlace al portapapeles
  - Botón para abrir en nueva pestaña
  - Click en el recuadro completo también abre el enlace
  - Efecto hover que agranda sutilmente el recuadro

## Archivos modificados/creados:

### Nuevos archivos:
- `migration_add_task_links.sql` - Script de migración
- `components/task-links-display.tsx` - Componente para mostrar enlaces
- `components/task-links-input.tsx` - Componente para gestionar enlaces en formularios

### Archivos modificados:
- `lib/types/database.types.ts` - Agregados tipos para task_links
- `app/actions/task-actions.ts` - Actualizadas funciones createTask y updateTask
- `components/create-task-dialog.tsx` - Agregada pestaña de enlaces
- `components/edit-task-dialog.tsx` - Agregada pestaña de enlaces y carga de enlaces existentes
- `app/(dashboard)/tasks/[id]/page.tsx` - Agregada visualización de enlaces

## Notas importantes:

- Solo los administradores pueden crear, editar o eliminar enlaces
- Todos los usuarios autenticados pueden ver los enlaces
- Los enlaces se eliminan automáticamente cuando se elimina la tarea (CASCADE)
- La interfaz usa pestañas (tabs) para separar información general de enlaces
