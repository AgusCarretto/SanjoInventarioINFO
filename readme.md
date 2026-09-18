# Sistema de Gestión de Stock - Informática 💻

Plataforma web interna desarrollada para el control de inventario, registro de préstamos (check-in/check-out) y gestión de alertas del Departamento de Informática del **Colegio San José de la Providencia**.

## 🚀 Tecnologías

- **Frontend:** React (Vite) + Tailwind CSS (Diseño institucional en azul marino y blanco)
- **Backend:** NestJS (REST API) + TypeORM
- **Base de Datos:** PostgreSQL
- **Infraestructura Local:** Docker & Docker Compose

## 📦 Estructura del Proyecto

Este proyecto es un monorepo que contiene tanto el cliente web como el servidor:

```text
stock-informatica/
├── frontend/             # Aplicación React (Vite)
├── backend/              # API REST en NestJS
├── docker-compose.yml    # Configuración del contenedor PostgreSQL
├── .gitignore            # Archivos ignorados globales
└── README.md             # Documentación del proyecto
