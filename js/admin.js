// ═══════════════════════════════════════════════════════════
// Áureo Studio — Panel de Administración
// ═══════════════════════════════════════════════════════════

let fechaActual = new Date();
fechaActual.setHours(0, 0, 0, 0);

let vistaActual = 'dia';        // 'dia' | 'semana'
let filtroProfId = 'todos';     // 'todos' | number
let profesionales = [];
let citasPendienteCancelar = null;

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ── Arranque ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    initLogin();

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        mostrarPanel();
    }
});

// ── Login ──────────────────────────────────────────────────

function initLogin() {
    const inputEmail = document.getElementById('inputEmail');
    const inputPassword = document.getElementById('inputPassword');
    const btnLogin = document.getElementById('btnLogin');
    const errorEl = document.getElementById('loginError');

    const intentarLogin = async () => {
        errorEl.style.display = 'none';
        const email = inputEmail.value.trim();
        const password = inputPassword.value;

        if (!email || !password) {
            errorEl.textContent = 'Introduce email y contraseña';
            errorEl.style.display = 'block';
            return;
        }

        btnLogin.disabled = true;
        btnLogin.textContent = 'Entrando...';

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                errorEl.textContent = 'Email o contraseña incorrectos';
                errorEl.style.display = 'block';
                inputPassword.value = '';
                inputPassword.focus();
            } else {
                mostrarPanel();
                return;
            }
        } catch (e) {
            console.error('Error de login:', e);
            errorEl.textContent = 'Error de conexión. Inténtalo de nuevo.';
            errorEl.style.display = 'block';
        }

        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    };

    btnLogin.addEventListener('click', intentarLogin);
    inputPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') intentarLogin();
    });
}

function mostrarPanel() {
    document.getElementById('loginWrapper').style.display = 'none';
    document.getElementById('adminPanel').classList.add('visible');
    initPanel();
}

document.getElementById('btnCerrarSesion').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
});

// ── Inicializar panel ──────────────────────────────────────

async function initPanel() {
    try {
        profesionales = await obtenerProfesionales();
        renderFiltrosProfesional();
        initControlesNavegacion();
        initVistaToggle();
        initModal();
        await cargarVista();
    } catch (e) {
        console.error('Error iniciando panel:', e);
        mostrarToast('Error al conectar con Supabase. Verifica config.js', true);
    }
}

// ── Filtros de profesional ─────────────────────────────────

function renderFiltrosProfesional() {
    const contenedor = document.getElementById('filtroProfesional');
    // Conservar botón "Todos"
    const btnTodos = contenedor.querySelector('[data-id="todos"]');
    contenedor.innerHTML = '';
    contenedor.appendChild(btnTodos);

    profesionales.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'filtro-btn';
        btn.dataset.id = p.id;
        btn.textContent = p.nombre.split(' ')[0]; // solo nombre
        contenedor.appendChild(btn);
    });

    contenedor.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            contenedor.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            filtroProfId = btn.dataset.id === 'todos' ? 'todos' : Number(btn.dataset.id);
            cargarVista();
        });
    });
}

// ── Navegación de fecha ────────────────────────────────────

function initControlesNavegacion() {
    document.getElementById('btnDiaAnterior').addEventListener('click', () => {
        fechaActual.setDate(fechaActual.getDate() - (vistaActual === 'semana' ? 7 : 1));
        cargarVista();
    });

    document.getElementById('btnDiaSiguiente').addEventListener('click', () => {
        fechaActual.setDate(fechaActual.getDate() + (vistaActual === 'semana' ? 7 : 1));
        cargarVista();
    });

    document.getElementById('btnHoy').addEventListener('click', () => {
        fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        cargarVista();
    });
}

function actualizarEtiquetaFecha() {
    const label = document.getElementById('fechaActualLabel');
    if (vistaActual === 'dia') {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const esHoy = fechaActual.getTime() === hoy.getTime();
        label.textContent = esHoy
            ? `Hoy — ${DIAS_ES[fechaActual.getDay()]} ${fechaActual.getDate()} de ${MESES_ES[fechaActual.getMonth()]}`
            : `${DIAS_ES[fechaActual.getDay()]} ${fechaActual.getDate()} de ${MESES_ES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
    } else {
        const lunes = getLunesDeSemana(fechaActual);
        const sabado = new Date(lunes);
        sabado.setDate(sabado.getDate() + 5);
        label.textContent = `Semana del ${lunes.getDate()} al ${sabado.getDate()} de ${MESES_ES[sabado.getMonth()]}`;
    }
}

// ── Toggle vista ───────────────────────────────────────────

function initVistaToggle() {
    document.getElementById('btnVistaDia').addEventListener('click', () => setVista('dia'));
    document.getElementById('btnVistaSemana').addEventListener('click', () => setVista('semana'));
}

function setVista(vista) {
    vistaActual = vista;

    document.getElementById('btnVistaDia').classList.toggle('activo', vista === 'dia');
    document.getElementById('btnVistaSemana').classList.toggle('activo', vista === 'semana');

    document.getElementById('vistaDiaria').classList.toggle('oculta', vista !== 'dia');
    document.getElementById('vistaSemanal').classList.toggle('visible', vista === 'semana');
    document.getElementById('resumenDia').style.display = vista === 'dia' ? 'grid' : 'none';

    cargarVista();
}

// ── Carga de datos ─────────────────────────────────────────

async function cargarVista() {
    actualizarEtiquetaFecha();

    if (vistaActual === 'dia') {
        await cargarVistaDia();
    } else {
        await cargarVistaSemana();
    }
}

async function cargarVistaDia() {
    const lista = document.getElementById('citasLista');
    lista.innerHTML = '<div class="spinner" style="margin:40px auto;"></div>';

    try {
        let citas = await obtenerReservasPorFecha(formatFecha(fechaActual));

        if (filtroProfId !== 'todos') {
            citas = citas.filter(c => c.profesional_id === filtroProfId);
        }

        actualizarResumen(citas);
        renderListaCitas(citas, lista);
    } catch (e) {
        console.error(e);
        lista.innerHTML = '<p style="color:var(--rojo);text-align:center;padding:40px;">Error al cargar citas</p>';
    }
}

async function cargarVistaSemana() {
    const grid = document.getElementById('semanaGrid');
    grid.innerHTML = '<div class="spinner" style="margin:40px auto;grid-column:1/-1;"></div>';

    const lunes = getLunesDeSemana(fechaActual);
    const sabado = new Date(lunes);
    sabado.setDate(sabado.getDate() + 5);

    try {
        let citas = await obtenerReservasSemana(formatFecha(lunes), formatFecha(sabado));

        if (filtroProfId !== 'todos') {
            citas = citas.filter(c => c.profesional_id === filtroProfId);
        }

        renderSemana(citas, lunes);
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p style="color:var(--rojo);text-align:center;padding:40px;grid-column:1/-1;">Error al cargar citas</p>';
    }
}

// ── Render lista diaria ────────────────────────────────────

function actualizarResumen(citas) {
    document.getElementById('totalCitas').textContent = citas.length;
    document.getElementById('citasPendientes').textContent = citas.filter(c => c.estado === 'pendiente').length;
    document.getElementById('citasCompletadas').textContent = citas.filter(c => c.estado === 'completada').length;
}

function renderListaCitas(citas, contenedor) {
    if (citas.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-citas">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>No hay citas para este día</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = citas.map(c => {
        const hora = c.hora.substring(0, 5);
        const esPendiente = c.estado === 'pendiente';
        const esCompletada = c.estado === 'completada';

        return `
            <div class="cita-card ${c.estado}" data-id="${c.id}">
                <div class="cita-hora">${hora}</div>
                <div class="cita-info">
                    <h4>${c.cliente_nombre}</h4>
                    <p>${c.servicios.nombre} · ${c.cliente_telefono}</p>
                    <span class="profesional-tag">${c.profesionales.nombre}</span>
                    ${c.notas ? `<p style="margin-top:6px;font-style:italic;color:var(--gris);font-size:.8rem;">"${c.notas}"</p>` : ''}
                </div>
                <div class="cita-acciones">
                    ${esPendiente ? `<button class="btn-completar" onclick="marcarCompletada(${c.id})">Completar</button>` : ''}
                    ${!esCompletada && c.estado !== 'cancelada' ? `<button class="btn-cancelar" onclick="confirmarCancelar(${c.id})">Cancelar</button>` : ''}
                    ${esCompletada ? `<span style="color:var(--verde);font-size:.8rem;">✓ Completada</span>` : ''}
                    ${c.estado === 'cancelada' ? `<span style="color:var(--rojo);font-size:.8rem;">✗ Cancelada</span>` : ''}
                </div>
            </div>`;
    }).join('');
}

// ── Render semana ──────────────────────────────────────────

function renderSemana(citas, lunes) {
    const grid = document.getElementById('semanaGrid');
    grid.innerHTML = '';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
        const dia = new Date(lunes);
        dia.setDate(dia.getDate() + i);
        const fechaStr = formatFecha(dia);
        const citasDia = citas.filter(c => c.fecha === fechaStr);
        const esHoy = dia.getTime() === hoy.getTime();

        const col = document.createElement('div');
        col.className = 'semana-dia';
        col.innerHTML = `
            <div class="semana-dia-header ${esHoy ? 'hoy' : ''}">
                <div class="dia-nombre">${DIAS_ES[dia.getDay()].substring(0, 3)}</div>
                <div class="dia-numero">${dia.getDate()}</div>
            </div>
            ${citasDia.length === 0
                ? '<p style="color:var(--gris);font-size:.8rem;text-align:center;">Sin citas</p>'
                : citasDia.map(c => `
                    <div class="semana-cita ${c.estado}">
                        <div class="s-hora">${c.hora.substring(0, 5)}</div>
                        <div class="s-cliente">${c.cliente_nombre}</div>
                        <div class="s-servicio">${c.servicios.nombre}</div>
                    </div>`).join('')
            }
        `;
        grid.appendChild(col);
    }
}

// ── Acciones sobre citas ───────────────────────────────────

async function marcarCompletada(id) {
    const tarjeta = document.querySelector(`.cita-card[data-id="${id}"]`);
    if (tarjeta) {
        tarjeta.style.opacity = '.5';
        tarjeta.style.pointerEvents = 'none';
    }

    try {
        await actualizarEstadoReserva(id, 'completada');
        mostrarToast('Cita marcada como completada');
        await cargarVistaDia();
    } catch (e) {
        console.error(e);
        mostrarToast('Error al actualizar la cita', true);
        if (tarjeta) {
            tarjeta.style.opacity = '';
            tarjeta.style.pointerEvents = '';
        }
    }
}

function confirmarCancelar(id) {
    citasPendienteCancelar = id;
    document.getElementById('modalOverlay').classList.add('visible');
}

function initModal() {
    document.getElementById('btnModalNo').addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('visible');
        citasPendienteCancelar = null;
    });

    document.getElementById('btnModalSi').addEventListener('click', async () => {
        document.getElementById('modalOverlay').classList.remove('visible');
        if (!citasPendienteCancelar) return;

        try {
            await actualizarEstadoReserva(citasPendienteCancelar, 'cancelada');
            mostrarToast('Cita cancelada');
            await cargarVistaDia();
        } catch (e) {
            console.error(e);
            mostrarToast('Error al cancelar la cita', true);
        } finally {
            citasPendienteCancelar = null;
        }
    });

    // Cerrar al hacer clic fuera
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('visible');
            citasPendienteCancelar = null;
        }
    });
}

// ── Utilidades ─────────────────────────────────────────────

function formatFecha(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = (dia === 0 ? -6 : 1 - dia); // Lunes como inicio
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = 'toast' + (esError ? ' error' : '');
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => toast.classList.remove('visible'), 4000);
}
