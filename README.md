# 🥊 FightHub - Event Manager

Gestor de eventos de lucha con scraper de Tapology integrado.

## Características

✅ **Gestión de Eventos** - Crear y visualizar eventos  
✅ **Gestión de Atletas** - Registrar atletas y disciplinas  
✅ **Scraper de Tapology** - Obtener eventos de USA automáticamente  
✅ **Base de Datos PostgreSQL** - Persistencia con Prisma ORM  
✅ **Interfaz Web** - Dashboard responsivo  

## Requisitos

- Node.js >= 14
- PostgreSQL
- npm o yarn

## Instalación

1. **Clonar el repositorio**
```bash
cd fh
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/fh_db"
PORT=3000
```

4. **Ejecutar migraciones de Prisma**
```bash
npx prisma migrate dev
```

5. **Iniciar el servidor**
```bash
npm start
```

6. **Acceder a la interfaz**
Abrir en el navegador:
```
http://localhost:3000
```

## Scripts Disponibles

```bash
npm start          # Inicia el servidor
npm run dev        # Inicia en modo desarrollo
npm run scrape     # Ejecuta scraper de Tapology
```

## API Endpoints

### Eventos
- `GET /api/events` - Obtener todos los eventos
- `POST /api/events` - Crear nuevo evento
- `GET /api/scrape-tapology` - Scrapear eventos de Tapology

### Atletas
- `GET /api/athletes` - Obtener todos los atletas
- `POST /api/athletes` - Crear nuevo atleta

## Estructura del Proyecto

```
fh/
├── public/              # Interfaz web
│   ├── index.html      # HTML principal
│   ├── styles.css      # Estilos
│   └── app.js          # Lógica frontend
├── prisma/
│   └── schema.prisma   # Esquema de base de datos
├── index.js            # Servidor Express + API
├── scraper.js          # Scraper de Tapology
├── package.json
└── README.md
```

## Uso de la Interfaz

### 1. Pestaña Eventos
- Ver todos los eventos registrados
- Crear nuevos eventos con formulario
- Los eventos se guardan en la BD

### 2. Pestaña Atletas
- Ver todos los atletas registrados
- Crear nuevos atletas
- Información de disciplina y país

### 3. Pestaña Scraper
- Botón para scrapear eventos de Tapology (USA)
- Los eventos se guardan automáticamente en la BD
- Muestra vista previa de eventos encontrados

## Tecnologías

- **Backend**: Express.js, Node.js
- **Base de Datos**: PostgreSQL, Prisma
- **Scraping**: Puppeteer
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Notas Importantes

⚠️ **Scraper**: Asegúrate de que Chromium/Chrome está disponible para Puppeteer  
⚠️ **Base de Datos**: Configura correctamente la URL de conexión PostgreSQL  
⚠️ **CORS**: La API permite peticiones desde cualquier origen (configurado en index.js)

## Troubleshooting

**Error: "connect ECONNREFUSED"**
- Verifica que PostgreSQL está corriendo
- Valida la URL en `.env`

**Error: "Chromium not found"**
```bash
npm install --save-dev puppeteer
```

**Puerto 3000 en uso**
Cambia el puerto en `.env`:
```env
PORT=3001
```

## Licencia

ISC

---

Hecho con ❤️ para FightHub
