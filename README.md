# 🚀 Guía de Instalación y Ejecución - WebRedes

Esta guía te llevará paso a paso desde la preparación del entorno hasta la ejecución de la plataforma interactiva del Espectro Electromagnético.

---

## 📋 Requisitos Previos

Antes de ejecutar la aplicación, es necesario tener instalado el entorno de ejecución de JavaScript en tu equipo.

### 1. Instalación de Node.js
1. Ve al sitio oficial: [nodejs.org](https://nodejs.org/).
2. Descarga la versión **LTS** (Long Term Support), que es la más estable y recomendada.
3. Ejecuta el instalador descargado y sigue las instrucciones (haz clic en "Siguiente" en todas las opciones predeterminadas).
4. Para verificar la instalación, abre una terminal (CMD o PowerShell) y escribe:
   ```bash
   node -v
   ```
   Deberías ver un número de versión (ej. `v20.x.x`).

---

## 📥 Descarga del Proyecto

Para obtener la versión más reciente y estable de la aplicación:

1. Accede al repositorio oficial en GitHub: [DonLonjas/WebRedes - Releases](https://github.com/DonLonjas/WebRedes/releases/latest).
2. En la sección de **Assets**, descarga el archivo ejecutable (ej. `EspectroApp.exe` o el archivo `.zip` que contenga el binario).
3. Si descargaste un `.zip`, descomprime el contenido en una carpeta de tu preferencia.

---

## ⚙️ Ejecución de la Aplicación

Una vez descargado el ejecutable, sigue estos pasos:

1. Ubica el archivo `EspectroApp.exe`.
2. Haz **doble clic** sobre él para iniciar el servidor.
3. Se abrirá una ventana de consola (terminal). **No la cierres**, ya que es el servidor que mantiene la aplicación funcionando.
4. En la consola verás un mensaje similar a:
   `✨ Espectro Electromagnético corriendo en http://localhost:5050`
5. **Para acceder:**
   - **En la misma PC:** Abre el navegador y entra a `http://localhost:5050`.
   - **Desde otros dispositivos (estudiantes):** Busca en la consola la sección `🌐 Accesible en la red local en:` y comparte la dirección IP mostrada (ej. `http://192.168.1.15:5050`).

---

## 🔑 Credenciales de Acceso (Prueba)

Para ingresar al sistema, utiliza las siguientes cuentas preconfiguradas:

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Docente** | `Docente` | `123456` |

---

## 🛠️ Solución de Problemas Comunes

*   **El ejecutable no abre:** Asegúrate de que tu antivirus no lo haya bloqueado. Puedes añadirlo a la lista de exclusiones.
*   **Los estudiantes no pueden conectar:** Verifica que el firewall de Windows permita el tráfico en el puerto `5050` o que ambos dispositivos estén conectados a la misma red Wi-Fi.
