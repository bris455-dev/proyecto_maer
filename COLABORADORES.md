## 📘 **Guía de Colaboración – Proyecto MAER**

**Repositorio:** [https://github.com/bris455-dev/proyecto_maer](https://github.com/bris455-dev/proyecto_maer)  
**Propietaria:** Brissette Eyzaguirre (`@bris455-dev`)  
  

---

### 🧩 **1. Estructura del proyecto**

El proyecto está organizado en dos carpetas principales:

proyecto_maer/
│
├── frontend/ → Código del cliente (HTML, CSS, JS o framework)
├── backend/ → Servidor y API
└── COLABORADORES.md

yaml
Copiar código

---

### 🌱 **2. Creación de ramas personales**

Cada integrante debe trabajar en su **propia rama** para evitar conflictos de código.

| Integrante | Nombre de la rama |
|-------------|-------------------|
| Brissette   | `brissette`       |
| Rudi        | `rudi`            |
| Gerald      | `gerald`          |

**Pasos para crear y cambiar a tu rama:**
```bash
git checkout -b nombre_de_tu_rama
git push -u origin nombre_de_tu_rama
Ejemplo (para Rudi):

bash
Copiar código
git checkout -b rudi
git push -u origin rudi
🧠 3. Flujo de trabajo recomendado (Git Flow simple)
Asegúrate de estar en tu rama:

bash
Copiar código
git checkout brissette
Antes de empezar a trabajar, actualiza tu rama con los últimos cambios del main:

bash
Copiar código
git pull origin main
Realiza tus modificaciones (en frontend o backend).

Guarda los cambios y súbelos a GitHub:

bash
Copiar código
git add .
git commit -m "Descripción breve del cambio"
git push
Cuando tu parte esté lista, crea un Pull Request desde GitHub
(tu rama → main), para revisión del equipo.

⚠️ 4. Reglas básicas de colaboración
No trabajar directamente en main.
Usa tu rama personal.

Antes de subir código nuevo, haz siempre:

bash
Copiar código
git pull origin main
Usa mensajes claros de commit.
Ejemplo:

✅ git commit -m "Agrego validación de login en backend"

❌ git commit -m "cambios varios"

No subir archivos innecesarios, como node_modules, .env, o archivos temporales.
(Esto se controla con un archivo .gitignore — que crearemos después.)

👥 5. Revisión y aprobación
Todos los cambios deben pasar por un Pull Request.

Los compañeros pueden comentar o aprobar los cambios.

Una vez aprobado, se fusiona (merge) al main.

💡 6. Consejos prácticos
Usa Visual Studio Code con la extensión GitLens para ver los commits fácilmente.

Si ocurre un conflicto al hacer pull, comunícalo al grupo antes de forzar cambios.

Haz commits frecuentes y descriptivos.

🧾 7. Contactos del equipo
Nombre	Rol / Rama	GitHub / Correo
Brissette Eyzaguirre	brissette	@bris455-dev / bris455@gmail.com
Rudi	rudi	(agregar usuario GitHub)
Gerald	gerald	(agregar usuario GitHub)


