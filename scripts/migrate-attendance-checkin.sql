ALTER TABLE registros_asistentes
  ADD COLUMN IF NOT EXISTS asistio BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS asistencias_qr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nombre VARCHAR(120) NOT NULL,
  matricula VARCHAR(40) NOT NULL,
  asistio BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(evento_id, matricula)
);

CREATE INDEX IF NOT EXISTS idx_asistencias_qr_evento
  ON asistencias_qr (evento_id);

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS ponente_nombre TEXT;