-- =============================================================================
-- ReMind - Esquema de Base de Datos
-- Asistente Visual de Memoria para personas con Alzheimer
-- =============================================================================

-- Crear la base de datos (ejecutar como superusuario si es necesario)
-- CREATE DATABASE remind_db;

-- Tabla principal: people
-- Almacena los registros de personas con sus embeddings faciales de 128-d.
-- Cada persona puede tener múltiples filas (una por cada variación de
-- Data Augmentation generada durante el registro).

CREATE TABLE IF NOT EXISTS people (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)     NOT NULL,
    relationship VARCHAR(100)    NOT NULL,
    embedding   DOUBLE PRECISION[] NOT NULL,  -- Array de 128 dimensiones
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por nombre
CREATE INDEX IF NOT EXISTS idx_people_name ON people (name);

-- Comentarios descriptivos
COMMENT ON TABLE  people             IS 'Personas registradas con sus embeddings faciales';
COMMENT ON COLUMN people.name        IS 'Nombre completo de la persona';
COMMENT ON COLUMN people.relationship IS 'Parentesco o relación (ej: Hija, Esposo, Doctor)';
COMMENT ON COLUMN people.embedding   IS 'Embedding facial de 128 dimensiones (float64)';
COMMENT ON COLUMN people.created_at  IS 'Fecha y hora de registro';
