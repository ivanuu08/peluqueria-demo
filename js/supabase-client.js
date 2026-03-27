// ═══════════════════════════════════════════════════════════
// Cliente Supabase para Áureo Studio
// ═══════════════════════════════════════════════════════════

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Profesionales ──────────────────────────────────────────

async function obtenerProfesionales() {
    const { data, error } = await supabase
        .from('profesionales')
        .select('*')
        .eq('activo', true)
        .order('id');
    if (error) throw error;
    return data;
}

// ── Servicios ──────────────────────────────────────────────

async function obtenerServicios() {
    const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .order('id');
    if (error) throw error;
    return data;
}

// ── Reservas ───────────────────────────────────────────────

async function obtenerReservasPorFechaYProfesional(fecha, profesionalId) {
    const { data, error } = await supabase
        .from('reservas')
        .select('hora')
        .eq('fecha', fecha)
        .eq('profesional_id', profesionalId)
        .neq('estado', 'cancelada');
    if (error) throw error;
    return data.map(r => r.hora);
}

async function crearReserva(reserva) {
    const { data, error } = await supabase
        .from('reservas')
        .insert(reserva)
        .select(`
            *,
            profesionales(nombre),
            servicios(nombre, precio)
        `)
        .single();
    if (error) throw error;
    return data;
}

async function obtenerReservasPorFecha(fecha) {
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            *,
            profesionales(nombre),
            servicios(nombre, precio)
        `)
        .eq('fecha', fecha)
        .order('hora');
    if (error) throw error;
    return data;
}

async function obtenerReservasSemana(fechaInicio, fechaFin) {
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            *,
            profesionales(nombre),
            servicios(nombre, precio)
        `)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha')
        .order('hora');
    if (error) throw error;
    return data;
}

async function actualizarEstadoReserva(id, estado) {
    const { data, error } = await supabase
        .from('reservas')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}
