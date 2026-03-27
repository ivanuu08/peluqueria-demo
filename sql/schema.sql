-- ═══════════════════════════════════════════════════════════
-- ÁUREO STUDIO — Schema SQL para Supabase
-- ═══════════════════════════════════════════════════════════
-- Ejecuta este script en el SQL Editor de Supabase (https://app.supabase.com)

-- Tipo enum para estados de reserva
CREATE TYPE estado_reserva AS ENUM ('pendiente', 'completada', 'cancelada');

-- ───────────────────────────────────────────────────────────
-- TABLA: profesionales
-- ───────────────────────────────────────────────────────────
CREATE TABLE profesionales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    anos_experiencia INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────────────────────────────────────
-- TABLA: servicios
-- ───────────────────────────────────────────────────────────
CREATE TABLE servicios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC(8,2) NOT NULL,
    duracion_minutos INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────────────────────────────────────
-- TABLA: reservas
-- ───────────────────────────────────────────────────────────
CREATE TABLE reservas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profesional_id BIGINT NOT NULL REFERENCES profesionales(id),
    servicio_id BIGINT NOT NULL REFERENCES servicios(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_email TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    notas TEXT,
    estado estado_reserva NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_profesional_fecha ON reservas(profesional_id, fecha);
CREATE INDEX idx_reservas_estado ON reservas(estado);

-- ───────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ───────────────────────────────────────────────────────────
-- Habilitar RLS
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (anon puede leer profesionales y servicios)
CREATE POLICY "Lectura pública de profesionales"
    ON profesionales FOR SELECT
    USING (true);

CREATE POLICY "Lectura pública de servicios"
    ON servicios FOR SELECT
    USING (true);

-- Reservas: lectura y escritura pública (el panel admin usa anon key)
CREATE POLICY "Lectura pública de reservas"
    ON reservas FOR SELECT
    USING (true);

CREATE POLICY "Inserción pública de reservas"
    ON reservas FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Actualización pública de reservas"
    ON reservas FOR UPDATE
    USING (true);

-- ═══════════════════════════════════════════════════════════
-- DATOS SEED
-- ═══════════════════════════════════════════════════════════

-- Profesionales
INSERT INTO profesionales (nombre, especialidad, anos_experiencia) VALUES
    ('Sofía Reyes', 'Coloración y balayage', 8),
    ('Marco Navarro', 'Corte masculino y barba', 6),
    ('Elena Vidal', 'Novias y eventos', 10);

-- Servicios
INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos) VALUES
    ('Corte y peinado', 'Corte personalizado con lavado y peinado profesional', 35.00, 60),
    ('Coloración completa', 'Coloración integral con productos premium', 90.00, 120),
    ('Mechas y balayage', 'Técnica de iluminación natural con efecto degradado', 120.00, 150),
    ('Tratamiento keratina', 'Alisado y nutrición profunda con keratina brasileña', 80.00, 90),
    ('Barba y perfilado', 'Recorte, perfilado y cuidado de barba con navaja', 25.00, 30),
    ('Novias y eventos', 'Peinado y maquillaje completo para tu día especial', 150.00, 180);
