# HUB MANTT

Instructivo digital de uso y mantenimiento de los equipos de planta. Cualquier persona abre la ficha de un equipo desde el celular, buscándolo o escaneando el QR de su placa. **Fase 1: solo lectura.**

## Qué tiene la app
- **Inicio:** resumen (equipos, con procedimiento, fichas incompletas, sin uso / en reparación), botón *Escanear QR* y accesos rápidos.
- **Equipos:** buscador por nombre o código, filtro por categoría y escaneo de QR.
- **Ficha del equipo:** fotos, datos del levantamiento y 4 secciones: *Funcionamiento* (datos técnicos y de motor), *Puesta en marcha*, *Fallas y soluciones* y *Mantenimiento* (mantenimiento y limpieza).
- **Mantenimiento:** todas las tareas agrupadas por frecuencia.
- **Fallas** y **Admin:** quedan para la Fase 2.
- Funciona sin señal una vez abierta (`sw.js`) y se puede instalar en el celular.

Archivos: `index.html`, `styles.css`, `app.js` (toda la lógica), `data/equipos.json` (todos los datos), `assets/equipos/` (fotos), `sw.js`, `manifest.webmanifest` e `icons/`.

## De dónde salen los datos
`data/equipos.json` **no se edita a mano**. Se genera en la carpeta de trabajo `Equipos Planta/App/hub-mantt` a partir de:
- `Plantilla_Levantamiento_Equipos_Planta.xlsx` → equipos, datos técnicos y fotos.
- `Plantilla_Digitalizacion_Equipos_v2.xlsx` (hojas *Pasos_PuestaEnMarcha* y *Mantenimiento_Limpieza*) → procedimientos por tipo de equipo. Una fila con código `MARM` aplica a todas las marmitas; una con `MARM-07`, solo a esa marmita.
- `Parametros_Operacion.xlsx` → parámetros de operación, señales y avisos (sección *Funcionamiento*), con la misma regla de códigos.

Para actualizar, desde la carpeta `hub-mantt`:

```bash
python tools/preparar_subida.py
```

Eso vuelve a leer los Excel y las fotos y deja esta carpeta lista para subir.

## 1. Publicar en GitHub Pages
1. En tu cuenta de GitHub crear el repositorio `hub-mantt` (público).
2. Subir **todo el contenido de esta carpeta** a la rama `main`: *Add file → Upload files*, arrastrar los archivos y carpetas, y *Commit changes*.
3. En el repositorio: **Settings → Pages → Source: Deploy from a branch → main / (root)** → **Save**.
4. En uno o dos minutos la app queda en `https://<tu-usuario>.github.io/hub-mantt/`.

**Al publicar cambios:** subir el número de `VERSION` en `sw.js` (por ejemplo `hm-v1` → `hm-v2`) y volver a subir los archivos que cambiaron. Así los celulares que ya tienen la app descargan la versión nueva.

## 2. Códigos QR de las placas
Cada QR abre la ficha del equipo con su código del levantamiento, que no cambia:
`https://<tu-usuario>.github.io/hub-mantt/#/equipo/MARM-01`

Con la URL publicada, desde la carpeta `hub-mantt`:

```bash
python tools/generate_qr.py --base-url https://<tu-usuario>.github.io/hub-mantt/
```

Genera `qr/<CÓDIGO>.png` (código y nombre debajo), listos para imprimir.

## 3. Probar en la computadora
Desde esta carpeta:

```bash
python -m http.server 8765
```

Abrir `http://localhost:8765/`. La cámara para el QR solo funciona en `localhost` o en la página publicada (`https`).

## 4. Instalar en el celular
Abrir el enlace en **Chrome** → menú **⋮** → **Instalar aplicación** (o *Agregar a la pantalla principal*). Son los mismos pasos que en el manual de HUB Recepciones.
