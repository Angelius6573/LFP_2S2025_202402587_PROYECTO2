#!/bin/bash

# Este script utiliza el comando 'kitty' para abrir nuevas ventanas de terminal
# y ejecutar los servidores backend y frontend en ellas.

# Obtiene la ruta absoluta de la carpeta actual para asegurar que los 'cd' funcionen
ROOT_PATH=$(pwd)

echo "Iniciando JavaBridge en terminales Kitty separadas..."

# --- 1. Iniciar el Backend (Servidor API) ---
# Ejecuta 'npm run dev' en la carpeta 'backend' en una nueva ventana de Kitty.
# El comando 'read' al final mantiene la ventana abierta después de que el proceso termine
# (en caso de que falle rápidamente), aunque 'npm run dev' es un proceso continuo.
kitty --title "JavaBridge Backend (Puerto 4000)" --directory "$ROOT_PATH/backend" -e bash -c "npm install; npm run dev; read -p 'Presiona ENTER para cerrar...'" &

# --- 2. Iniciar el Frontend (Interfaz Web) ---
# Ejecuta 'npm run dev' en la carpeta 'frontend' en otra nueva ventana de Kitty.
kitty --title "JavaBridge Frontend (Vite)" --directory "$ROOT_PATH/frontend" -e bash -c "npm install; npm run dev; read -p 'Presiona ENTER para cerrar...'" &

echo "Servidores iniciados. Verifica las dos nuevas ventanas de Kitty."
echo "Puedes acceder al frontend en la URL que indique la ventana de Vite (generalmente http://localhost:5173)."
