// ═══════════════════════════════════════════════════════════
// Áureo Studio — Sistema de reservas (4 pasos)
// ═══════════════════════════════════════════════════════════

let pasoActual = 1;
let servicios = [];
let profesionales = [];

// Datos seleccionados
const reserva = {
    servicio: null,
    profesional: null,
    fecha: null,
    hora: null
};

// Calendario
let calMes, calAnio;

document.addEventListener('DOMContentLoaded', initReservas);

async function initReservas() {
    try {
        [servicios, profesionales] = await Promise.all([
            obtenerServicios(),
            obtenerProfesionales()
        ]);
        renderServicios();
        renderProfesionales();
        initCalendario();
        initNavegacion();
        initFormulario();
    } catch (e) {
        console.error('Error cargando datos:', e);
        mostrarToast('Error al conectar con el servidor. Verifica la configuración.', true);
    }
}

// ── Paso 1: Servicios ──────────────────────────────────────

function renderServicios() {
    const contenedor = document.getElementById('serviciosSeleccion');
    contenedor.innerHTML = servicios.map(s => `
        <div class="servicio-opcion" data-id="${s.id}">
            <h4>${s.nombre}</h4>
            <div class="precio">${s.precio}€</div>
            <div class="duracion">${s.duracion_minutos} min</div>
        </div>
    `).join('');

    contenedor.querySelectorAll('.servicio-opcion').forEach(el => {
        el.addEventListener('click', () => {
            contenedor.querySelectorAll('.servicio-opcion').forEach(e => e.classList.remove('seleccionado'));
            el.classList.add('seleccionado');
            reserva.servicio = servicios.find(s => s.id === Number(el.dataset.id));
            document.getElementById('btnPaso1Siguiente').disabled = false;
        });
    });
}

// ── Paso 2: Profesionales ──────────────────────────────────

function renderProfesionales() {
    const contenedor = document.getElementById('profesionalesSeleccion');
    contenedor.innerHTML = profesionales.map(p => {
        const iniciales = p.nombre.split(' ').map(n => n[0]).join('');
        return `
            <div class="profesional-opcion" data-id="${p.id}">
                <div class="prof-foto">${iniciales}</div>
                <h4>${p.nombre}</h4>
                <p>${p.especialidad}</p>
                <p>${p.anos_experiencia} años exp.</p>
            </div>
        `;
    }).join('');

    contenedor.querySelectorAll('.profesional-opcion').forEach(el => {
        el.addEventListener('click', () => {
            contenedor.querySelectorAll('.profesional-opcion').forEach(e => e.classList.remove('seleccionado'));
            el.classList.add('seleccionado');
            reserva.profesional = profesionales.find(p => p.id === Number(el.dataset.id));
            document.getElementById('btnPaso2Siguiente').disabled = false;
        });
    });
}

// ── Paso 3: Calendario ─────────────────────────────────────

function initCalendario() {
    const hoy = new Date();
    calMes = hoy.getMonth();
    calAnio = hoy.getFullYear();

    document.getElementById('calPrev').addEventListener('click', () => {
        calMes--;
        if (calMes < 0) { calMes = 11; calAnio--; }
        renderCalendario();
    });

    document.getElementById('calNext').addEventListener('click', () => {
        calMes++;
        if (calMes > 11) { calMes = 0; calAnio++; }
        renderCalendario();
    });

    renderCalendario();
}

function renderCalendario() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calMesAnio').textContent = `${meses[calMes]} ${calAnio}`;

    const contenedor = document.getElementById('calendarioDias');
    contenedor.innerHTML = '';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const maxFecha = new Date(hoy);
    maxFecha.setDate(maxFecha.getDate() + 30);

    const primerDia = new Date(calAnio, calMes, 1);
    // Lunes=0 ... Domingo=6
    let diaInicio = primerDia.getDay() - 1;
    if (diaInicio < 0) diaInicio = 6;
    const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();

    // Celdas vacías
    for (let i = 0; i < diaInicio; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'calendario-dia vacio';
        contenedor.appendChild(vacio);
    }

    for (let d = 1; d <= diasEnMes; d++) {
        const fecha = new Date(calAnio, calMes, d);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendario-dia';
        btn.textContent = d;

        const esDomingo = fecha.getDay() === 0;
        const esAnterior = fecha < manana;
        const esPosterior = fecha > maxFecha;

        if (esDomingo || esAnterior || esPosterior) {
            btn.classList.add('deshabilitado');
        } else {
            if (fecha.toDateString() === hoy.toDateString()) {
                btn.classList.add('hoy');
            }
            btn.addEventListener('click', () => seleccionarFecha(fecha, btn));
        }

        contenedor.appendChild(btn);
    }
}

async function seleccionarFecha(fecha, btn) {
    // Marcar selección visual
    document.querySelectorAll('.calendario-dia').forEach(d => d.classList.remove('seleccionado'));
    btn.classList.add('seleccionado');

    reserva.fecha = fecha;
    reserva.hora = null;
    document.getElementById('btnPaso3Siguiente').disabled = true;

    // Cargar horas
    await renderHoras(fecha);
}

async function renderHoras(fecha) {
    const contenido = document.getElementById('horasContenido');
    contenido.innerHTML = '<div class="spinner"></div>';

    const fechaStr = formatFecha(fecha);

    try {
        const ocupadas = reserva.profesional
            ? await obtenerReservasPorFechaYProfesional(fechaStr, reserva.profesional.id)
            : [];

        // Generar franjas 9:00 - 19:00 (última cita a las 19:00, cierre 20:00)
        const horas = [];
        for (let h = 9; h <= 19; h++) {
            horas.push(`${String(h).padStart(2, '0')}:00`);
        }

        const horasGrid = document.createElement('div');
        horasGrid.className = 'horas-grid';

        horas.forEach(hora => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hora-btn';
            btn.textContent = hora;

            const horaDB = hora + ':00'; // formato time de Supabase
            if (ocupadas.includes(horaDB)) {
                btn.classList.add('ocupada');
            } else {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('seleccionada'));
                    btn.classList.add('seleccionada');
                    reserva.hora = hora;
                    document.getElementById('btnPaso3Siguiente').disabled = false;
                });
            }

            horasGrid.appendChild(btn);
        });

        contenido.innerHTML = '';
        contenido.appendChild(horasGrid);
    } catch (e) {
        contenido.innerHTML = '<p class="horas-mensaje">Error al cargar horarios</p>';
        console.error(e);
    }
}

// ── Navegación de pasos ────────────────────────────────────

function initNavegacion() {
    document.getElementById('btnPaso1Siguiente').addEventListener('click', () => irAPaso(2));
    document.getElementById('btnPaso2Atras').addEventListener('click', () => irAPaso(1));
    document.getElementById('btnPaso2Siguiente').addEventListener('click', () => irAPaso(3));
    document.getElementById('btnPaso3Atras').addEventListener('click', () => irAPaso(2));
    document.getElementById('btnPaso3Siguiente').addEventListener('click', () => irAPaso(4));
    document.getElementById('btnPaso4Atras').addEventListener('click', () => irAPaso(3));
}

function irAPaso(paso) {
    document.querySelectorAll('.paso').forEach(p => p.classList.remove('activo'));
    document.getElementById(`paso${paso}`).classList.add('activo');

    const circulos = document.querySelectorAll('.progreso-circulo');
    const lineas = document.querySelectorAll('.progreso-linea');

    circulos.forEach((c, i) => {
        const num = i + 1;
        c.classList.remove('activo', 'completado');
        if (num === paso) c.classList.add('activo');
        else if (num < paso) c.classList.add('completado');
    });

    lineas.forEach((l, i) => {
        l.classList.toggle('activa', i < paso - 1);
    });

    pasoActual = paso;

    // Scroll a la sección
    document.getElementById('reservas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Paso 4: Formulario y confirmación ──────────────────────

function initFormulario() {
    const form = document.getElementById('formularioDatos');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('clienteNombre').value.trim();
        const telefono = document.getElementById('clienteTelefono').value.trim();
        const email = document.getElementById('clienteEmail').value.trim();
        const notas = document.getElementById('clienteNotas').value.trim();

        // Validación
        let valido = true;

        if (!nombre || nombre.length < 3) {
            mostrarError('errorNombre');
            valido = false;
        } else {
            ocultarError('errorNombre');
        }

        if (!telefono || telefono.length < 9) {
            mostrarError('errorTelefono');
            valido = false;
        } else {
            ocultarError('errorTelefono');
        }

        if (!email || !email.includes('@') || !email.includes('.')) {
            mostrarError('errorEmail');
            valido = false;
        } else {
            ocultarError('errorEmail');
        }

        if (!valido) return;

        const btn = document.getElementById('btnConfirmar');
        btn.classList.add('loading');
        btn.textContent = 'Reservando...';

        try {
            const datos = {
                servicio_id: reserva.servicio.id,
                profesional_id: reserva.profesional.id,
                fecha: formatFecha(reserva.fecha),
                hora: reserva.hora + ':00',
                cliente_nombre: nombre,
                cliente_email: email,
                cliente_telefono: telefono,
                notas: notas || null
            };

            const resultado = await crearReserva(datos);

            // Enviar email
            await enviarEmailConfirmacion({
                email,
                nombre,
                telefono,
                notas,
                servicio: reserva.servicio.nombre,
                profesional: reserva.profesional.nombre,
                fecha: formatFechaLegible(reserva.fecha),
                hora: reserva.hora
            });

            mostrarExito(resultado);
        } catch (e) {
            console.error('Error al crear reserva:', e);
            mostrarToast('Error al crear la reserva. Inténtalo de nuevo.', true);
            btn.classList.remove('loading');
            btn.textContent = 'Confirmar reserva';
        }
    });
}

function mostrarError(id) {
    document.getElementById(id).style.display = 'block';
}

function ocultarError(id) {
    document.getElementById(id).style.display = 'none';
}

function mostrarExito(resultado) {
    // Ocultar pasos y progreso
    document.querySelectorAll('.paso').forEach(p => p.classList.remove('activo'));
    document.getElementById('progreso').style.display = 'none';

    const resumen = document.getElementById('resumenCita');
    resumen.innerHTML = `
        <div class="fila"><span class="etiqueta">Servicio</span><span class="valor">${reserva.servicio.nombre}</span></div>
        <div class="fila"><span class="etiqueta">Profesional</span><span class="valor">${reserva.profesional.nombre}</span></div>
        <div class="fila"><span class="etiqueta">Fecha</span><span class="valor">${formatFechaLegible(reserva.fecha)}</span></div>
        <div class="fila"><span class="etiqueta">Hora</span><span class="valor">${reserva.hora}</span></div>
        <div class="fila"><span class="etiqueta">Precio</span><span class="valor" style="color:var(--dorado);font-size:1.1rem;">${reserva.servicio.precio}€</span></div>
    `;

    const exito = document.getElementById('reservaExito');
    exito.classList.add('visible');

    document.getElementById('btnNuevaReserva').addEventListener('click', () => {
        location.reload();
    });
}

// ── Email vía función serverless ───────────────────────────

async function enviarEmailConfirmacion(datos) {
    const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            servicio:    datos.servicio,
            profesional: datos.profesional,
            fecha:       datos.fecha,
            hora:        datos.hora,
            nombre:      datos.nombre,
            telefono:    datos.telefono,
            email:       datos.email,
            notas:       datos.notas || ''
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al enviar el email de confirmación');
    }
}

// ── Utilidades ─────────────────────────────────────────────

function formatFecha(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatFechaLegible(fecha) {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}
