from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importaciones de rutas
from .routes import auth, pets, reports, sightings, users # Añade aquí los demás a medida que los crees

# --- Inicialización de Firebase ---
from .services import firebase_service

app = FastAPI(
    title="Lomito Buscador API",
    description="La API para la aplicación de búsqueda de mascotas.",
    version="1.0.0"
)

# --- Configuración de CORS ---

origins = ["*"] # Permite cualquier origen

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# --- Inclusión de las Rutas ---#
app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(reports.router)
app.include_router(sightings.router)


# --- Ruta de Prueba ---
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "¡Bienvenido a la API de Lomito Buscador!"}