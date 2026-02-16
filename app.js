// ==================== VARIABLES GLOBALES ====================
// Streaming
let ventasStreaming = JSON.parse(localStorage.getItem('rayo_shop_ultra')) || [];
let serviciosSugeridosStreaming = JSON.parse(localStorage.getItem('rayo_servicios_sugeridos')) || [
    "Netflix Premium", "Disney+", "HBO Max", "Spotify Premium", 
    "Amazon Prime", "YouTube Premium", "Apple TV+", "Star+",
    "Paramount+", "Crunchyroll", "Twitch Turbo", "Xbox Game Pass",
    "PlayStation Plus", "Nintendo Switch Online", "Discord Nitro"
];

// ChatGPT
let cuentasChatGPT = JSON.parse(localStorage.getItem('chatgpt_cuentas')) || [];
let ventasChatGPT = JSON.parse(localStorage.getItem('chatgpt_ventas')) || [];
let serviciosSugeridosChatGPT = JSON.parse(localStorage.getItem('chatgpt_servicios_sugeridos')) || [
    "ChatGPT Plus", "ChatGPT Team", "ChatGPT Enterprise"
];

// Variables de edición
let currentEditIdStreaming = null;
let currentEditIdChatGPT = null;

// Filtros
let filtroStreaming = 'activos'; // 'activos', 'inactivos', 'todos'
let filtroChatGPT = 'activos';

// Gráficos
let chartBarStreaming, chartDoughnutStreaming, chartLineStreaming, chartPaymentStreaming;
let chartBarChatGPT, chartDoughnutChatGPT, chartLineChatGPT;

// Intervalos
let contadorIntervalStreaming = null;
let contadorIntervalChatGPT = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    // Migrar datos streaming
    ventasStreaming = ventasStreaming.map(v => ({
        ...v,
        estado: v.estado || 'activo',
        etiquetas: v.etiquetas || []
    }));
    
    // Migrar datos ChatGPT
    ventasChatGPT = ventasChatGPT.map(v => ({
        ...v,
        estado: v.estado || 'activo',
        etiquetas: v.etiquetas || [],
        fecha: v.fecha || new Date().toISOString().split('T')[0],
        dias: v.dias || 30
    }));
    
    cuentasChatGPT = cuentasChatGPT.map(c => ({
        ...c,
        estado: c.estado || 'activo'
    }));
    
    // Configurar fecha actual
    actualizarFechaActual();
    
    // Fechas por defecto
    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('fechaVentaStreaming')) document.getElementById('fechaVentaStreaming').value = hoy;
    if (document.getElementById('fechaVentaChatGPT')) document.getElementById('fechaVentaChatGPT').value = hoy;
    if (document.getElementById('fechaCompraChatGPT')) document.getElementById('fechaCompraChatGPT').value = hoy;
    
    // Autocompletado
    configurarAutocompleteStreaming();
    
    // Inicializar gráficos
    initChartsStreaming();
    initChartsChatGPT();
    
    // Renderizar todo
    renderStreaming();
    renderChatGPT();
    
    // Event listeners
    document.getElementById('formVentaStreaming').addEventListener('submit', guardarVentaStreaming);
    document.getElementById('formVentaChatGPT').addEventListener('submit', guardarVentaChatGPT);
    document.getElementById('formCuentaChatGPT').addEventListener('submit', guardarCuentaChatGPT);
    
    // Iniciar contadores
    iniciarContadoresStreaming();
    iniciarContadoresChatGPT();
    
    // Actualizar servicios sidebar
    actualizarServiciosSidebarStreaming();
    
    // Actualizar storage
    actualizarStorage();
    
    // Notificaciones
    actualizarNotificacionesStreaming();
    actualizarNotificacionesChatGPT();
});

// ==================== FUNCIONES COMUNES ====================
function actualizarFechaActual() {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('current-date').textContent = ahora.toLocaleDateString('es-ES', opciones);
    setTimeout(actualizarFechaActual, 1000);
}

function showToast(message, type = 'info') {
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: colors[type] || colors.info,
        stopOnFocus: true
    }).showToast();
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'modalVentaStreaming') currentEditIdStreaming = null;
    if (modalId === 'modalVentaChatGPT') currentEditIdChatGPT = null;
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function switchTab(tabId) {
    // Desactivar todos
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Activar seleccionada
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
    
    // Actualizar título
    const titles = {
        'tab-streaming': 'Dashboard Streaming',
        'tab-chatgpt': 'ChatGPT Plus',
        'tab-stats-streaming': 'Analytics Streaming',
        'tab-stats-chatgpt': 'Analytics ChatGPT'
    };
    document.getElementById('current-tab-title').textContent = titles[tabId];
    
    // Mostrar/ocultar stats
    document.getElementById('stats-streaming').style.display = (tabId === 'tab-streaming' || tabId === 'tab-stats-streaming') ? 'grid' : 'none';
    document.getElementById('stats-chatgpt').style.display = (tabId === 'tab-chatgpt' || tabId === 'tab-stats-chatgpt') ? 'grid' : 'none';
    
    // Mostrar/ocultar buscadores
    document.getElementById('search-container-streaming').style.display = (tabId === 'tab-streaming') ? 'block' : 'none';
    document.getElementById('search-container-chatgpt').style.display = (tabId === 'tab-chatgpt') ? 'block' : 'none';
    
    // Mostrar/ocultar botones de notificación
    document.querySelector('.btn-notification[onclick="mostrarNotificacionesStreaming()"]').style.display = (tabId === 'tab-streaming' || tabId === 'tab-stats-streaming') ? 'flex' : 'none';
    document.querySelector('.btn-notification[onclick="mostrarNotificacionesChatGPT()"]').style.display = (tabId === 'tab-chatgpt' || tabId === 'tab-stats-chatgpt') ? 'flex' : 'none';
    
    // Mostrar/ocultar botón rápido
    document.getElementById('btn-quick-streaming').style.display = (tabId === 'tab-streaming') ? 'flex' : 'none';
    document.getElementById('btn-quick-chatgpt').style.display = (tabId === 'tab-chatgpt') ? 'flex' : 'none';
    
    // Mostrar/ocultar acciones de tabla
    document.getElementById('tab-actions-streaming').style.display = (tabId === 'tab-streaming' || tabId === 'tab-stats-streaming') ? 'flex' : 'none';
    document.getElementById('tab-actions-chatgpt').style.display = (tabId === 'tab-chatgpt' || tabId === 'tab-stats-chatgpt') ? 'flex' : 'none';
    
    // Actualizar gráficos
    if (tabId === 'tab-stats-streaming') setTimeout(updateChartsStreaming, 100);
    if (tabId === 'tab-stats-chatgpt') setTimeout(updateChartsChatGPT, 100);
}

// ==================== FUNCIONES STREAMING ====================
function guardarVentaStreaming(e) {
    e.preventDefault();
    
    const etiquetas = document.getElementById('etiquetasStreaming').value.trim()
        .split(',').map(e => e.trim().toUpperCase()).filter(e => e);
    
    const venta = {
        id: currentEditIdStreaming || Date.now(),
        cliente: document.getElementById('clienteStreaming').value.trim(),
        whatsapp: document.getElementById('whatsappStreaming').value.trim(),
        servicio: document.getElementById('servicioStreaming').value.trim(),
        plan: document.getElementById('planStreaming').value,
        correo: document.getElementById('correoStreaming').value.trim(),
        clave: document.getElementById('claveStreaming').value.trim(),
        perfil: document.getElementById('perfilStreaming').value.trim() || '-',
        metodo: document.getElementById('metodoPagoStreaming').value,
        precio: parseFloat(document.getElementById('precioStreaming').value),
        costo: parseFloat(document.getElementById('costoStreaming').value),
        fecha: document.getElementById('fechaVentaStreaming').value,
        dias: parseInt(document.getElementById('duracionStreaming').value),
        vendedor: document.getElementById('vendedorStreaming').value.trim() || 'No especificado',
        observaciones: document.getElementById('observacionesStreaming').value.trim(),
        prioridad: document.getElementById('prioridadStreaming').value,
        etiquetas: etiquetas,
        estado: 'activo',
        fechaRegistro: new Date().toISOString()
    };
    
    if (!venta.servicio) { showToast('Ingresa un servicio', 'error'); return; }
    
    // Guardar servicio sugerido
    if (!serviciosSugeridosStreaming.includes(venta.servicio)) {
        serviciosSugeridosStreaming.unshift(venta.servicio);
        localStorage.setItem('rayo_servicios_sugeridos', JSON.stringify(serviciosSugeridosStreaming));
        actualizarServiciosSidebarStreaming();
    }
    
    if (currentEditIdStreaming) {
        const index = ventasStreaming.findIndex(v => v.id === currentEditIdStreaming);
        if (index !== -1) ventasStreaming[index] = venta;
        showToast('Venta actualizada', 'success');
    } else {
        ventasStreaming.push(venta);
        showToast('Venta registrada', 'success');
    }
    
    localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventasStreaming));
    renderStreaming();
    updateChartsStreaming();
    actualizarNotificacionesStreaming();
    actualizarStorage();
    cerrarModal('modalVentaStreaming');
}

function renderStreaming() {
    const tbody = document.querySelector('#tablaStreaming tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Calcular totales (sobre todas las ventas)
    let totalVentas = 0, totalInversion = 0, totalGanancia = 0;
    ventasStreaming.forEach(v => {
        totalVentas += v.precio;
        totalInversion += v.costo;
        totalGanancia += (v.precio - v.costo);
    });
    const margen = totalInversion > 0 ? (totalGanancia / totalInversion) * 100 : 0;
    
    document.getElementById('tVentasStreaming').textContent = `S/ ${totalVentas.toFixed(2)}`;
    document.getElementById('tInversionStreaming').textContent = `S/ ${totalInversion.toFixed(2)}`;
    document.getElementById('tGananciaStreaming').textContent = `S/ ${totalGanancia.toFixed(2)}`;
    document.getElementById('tMargenStreaming').textContent = `${margen.toFixed(1)}%`;
    document.getElementById('badge-streaming').textContent = ventasStreaming.filter(v => v.estado === 'activo').length;
    
    // Filtrar
    let ventasFiltradas = ventasStreaming;
    if (filtroStreaming === 'activos') ventasFiltradas = ventasStreaming.filter(v => v.estado === 'activo');
    else if (filtroStreaming === 'inactivos') ventasFiltradas = ventasStreaming.filter(v => v.estado === 'inactivo');
    
    // Ordenar
    ventasFiltradas.sort((a, b) => {
        const prioridad = { urgente: 0, alta: 1, normal: 2 };
        const pA = prioridad[a.prioridad] || 2;
        const pB = prioridad[b.prioridad] || 2;
        if (pA !== pB) return pA - pB;
        const fA = new Date(new Date(a.fecha).getTime() + a.dias*86400000);
        const fB = new Date(new Date(b.fecha).getTime() + b.dias*86400000);
        return fA - fB;
    });
    
    ventasFiltradas.forEach(v => {
        const fechaFin = new Date(new Date(v.fecha).getTime() + v.dias*86400000);
        const expiracion = fechaFin.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
        
        let serviceClass = 'other';
        if (v.servicio.toLowerCase().includes('netflix')) serviceClass = 'netflix';
        else if (v.servicio.toLowerCase().includes('disney')) serviceClass = 'disney';
        else if (v.servicio.toLowerCase().includes('hbo') || v.servicio.toLowerCase().includes('max')) serviceClass = 'max';
        else if (v.servicio.toLowerCase().includes('spotify')) serviceClass = 'spotify';
        else if (v.servicio.toLowerCase().includes('prime')) serviceClass = 'prime';
        else if (v.servicio.toLowerCase().includes('youtube')) serviceClass = 'youtube';
        else if (v.servicio.toLowerCase().includes('apple')) serviceClass = 'apple';
        
        const tagsHTML = (v.etiquetas || []).map(tag => {
            let cls = '';
            if (tag.includes('YA PAGO')) cls = 'ya-pago';
            else if (tag.includes('RENOVACION PENDIENTE')) cls = 'renovacion-pendiente';
            else if (tag.includes('URGENTE')) cls = 'urgente';
            else if (tag.includes('CLIENTE VIP')) cls = 'cliente-vip';
            return `<span class="tag-badge ${cls}" onclick="filtrarPorEtiquetaStreaming('${tag}')">${tag}</span>`;
        }).join('');
        
        const prioridadClass = v.prioridad || 'normal';
        
        const row = document.createElement('tr');
        row.className = v.estado === 'inactivo' ? 'inactive-row' : '';
        row.innerHTML = `
            <td><span class="badge-id">#${v.id.toString().slice(-6)}</span></td>
            <td>
                <strong>${v.cliente}</strong><br>
                <small>${v.correo}</small><br>
                <span style="color:#25d366"><i class="fab fa-whatsapp"></i> ${v.whatsapp}</span>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="service-icon ${serviceClass}"><i class="fas fa-play-circle"></i></span>
                    <div>
                        <strong>${v.servicio}</strong><br>
                        <small>${v.plan} • ${v.perfil}</small>
                    </div>
                </div>
            </td>
            <td>${expiracion}</td>
            <td><div class="time-counter-container" id="count-streaming-${v.id}"></div></td>
            <td>
                <strong>S/ ${(v.precio - v.costo).toFixed(2)}</strong><br>
                <small>${v.costo > 0 ? (((v.precio - v.costo)/v.costo)*100).toFixed(1) : 0}% margen</small>
            </td>
            <td><div class="tags-container">${tagsHTML || '<small>—</small>'}</div></td>
            <td>
                <span class="status-badge ${v.estado === 'activo' ? 'active' : 'expired'}">
                    ${v.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editarVentaStreaming(${v.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-whatsapp" onclick="enviarRecordatorioStreaming(${v.id})"><i class="fab fa-whatsapp"></i></button>
                    ${v.estado === 'activo' 
                        ? `<button class="btn-icon btn-delete" onclick="eliminarVentaStreaming(${v.id})"><i class="fas fa-trash"></i></button>` 
                        : `<button class="btn-icon btn-success" onclick="restaurarVentaStreaming(${v.id})"><i class="fas fa-undo"></i></button>`}
                </div>
            </td>
        `;
        tbody.appendChild(row);
        
        // Inicializar contador
        const contador = document.getElementById(`count-streaming-${v.id}`);
        if (contador) actualizarContadorIndividual(contador, fechaFin);
    });
}

function editarVentaStreaming(id) {
    const venta = ventasStreaming.find(v => v.id === id);
    if (!venta) return;
    currentEditIdStreaming = id;
    
    document.getElementById('clienteStreaming').value = venta.cliente;
    document.getElementById('whatsappStreaming').value = venta.whatsapp;
    document.getElementById('servicioStreaming').value = venta.servicio;
    document.getElementById('planStreaming').value = venta.plan;
    document.getElementById('correoStreaming').value = venta.correo;
    document.getElementById('claveStreaming').value = venta.clave;
    document.getElementById('perfilStreaming').value = venta.perfil;
    document.getElementById('metodoPagoStreaming').value = venta.metodo;
    document.getElementById('precioStreaming').value = venta.precio;
    document.getElementById('costoStreaming').value = venta.costo;
    document.getElementById('fechaVentaStreaming').value = venta.fecha;
    document.getElementById('duracionStreaming').value = venta.dias;
    document.getElementById('vendedorStreaming').value = venta.vendedor || '';
    document.getElementById('observacionesStreaming').value = venta.observaciones || '';
    document.getElementById('prioridadStreaming').value = venta.prioridad || 'normal';
    document.getElementById('etiquetasStreaming').value = (venta.etiquetas || []).join(', ');
    
    document.querySelector('#modalVentaStreaming .modal-footer .btn-primary').innerHTML = '<i class="fas fa-save"></i> Actualizar';
    document.querySelector('#modalVentaStreaming .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Editar Venta';
    
    document.getElementById('modalVentaStreaming').style.display = 'flex';
    calcularGananciaStreaming();
}

function eliminarVentaStreaming(id) {
    if (confirm('¿Marcar esta venta como inactiva? (Los totales se mantendrán)')) {
        const index = ventasStreaming.findIndex(v => v.id === id);
        if (index !== -1) {
            ventasStreaming[index].estado = 'inactivo';
            localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventasStreaming));
            renderStreaming();
            updateChartsStreaming();
            actualizarNotificacionesStreaming();
            showToast('Venta marcada como inactiva', 'warning');
        }
    }
}

function restaurarVentaStreaming(id) {
    const index = ventasStreaming.findIndex(v => v.id === id);
    if (index !== -1) {
        ventasStreaming[index].estado = 'activo';
        localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventasStreaming));
        renderStreaming();
        updateChartsStreaming();
        actualizarNotificacionesStreaming();
        showToast('Venta restaurada', 'success');
    }
}

function enviarRecordatorioStreaming(id) {
    const venta = ventasStreaming.find(v => v.id === id);
    if (!venta) return;
    const fechaFin = new Date(new Date(venta.fecha).getTime() + venta.dias*86400000);
    const diasRestantes = Math.ceil((fechaFin - new Date()) / 86400000);
    let mensaje = `Hola, tu servicio de ${venta.servicio} vence en ${diasRestantes} días. ¿Renuevas?`;
    window.open(`https://wa.me/51${venta.whatsapp}?text=${encodeURIComponent(mensaje)}`);
}

function filtrarVentasStreaming() {
    const busqueda = document.getElementById('buscador-streaming').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaStreaming tbody tr');
    filas.forEach(f => {
        f.style.display = f.textContent.toLowerCase().includes(busqueda) ? '' : 'none';
    });
}

function filtrarExpiradosStreaming() {
    const filas = document.querySelectorAll('#tablaStreaming tbody tr');
    filas.forEach(f => {
        const contador = f.querySelector('.time-counter');
        f.style.display = contador && contador.classList.contains('expired') ? '' : 'none';
    });
}

function mostrarActivosStreaming() { filtroStreaming = 'activos'; renderStreaming(); }
function mostrarInactivosStreaming() { filtroStreaming = 'inactivos'; renderStreaming(); }
function mostrarTodosStreaming() { filtroStreaming = 'todos'; renderStreaming(); }

function filtrarPorEtiquetaStreaming(etiqueta) {
    document.getElementById('buscador-streaming').value = etiqueta;
    filtrarVentasStreaming();
}

function calcularGananciaStreaming() {
    const precio = parseFloat(document.getElementById('precioStreaming').value) || 0;
    const costo = parseFloat(document.getElementById('costoStreaming').value) || 0;
    const ganancia = precio - costo;
    const margen = costo > 0 ? (ganancia / costo) * 100 : 0;
    document.getElementById('gananciaPreviewStreaming').textContent = `S/ ${ganancia.toFixed(2)}`;
    document.getElementById('margenPreviewStreaming').textContent = `${margen.toFixed(1)}%`;
    document.getElementById('roiPreviewStreaming').textContent = `${margen.toFixed(1)}%`;
}

function iniciarContadoresStreaming() {
    if (contadorIntervalStreaming) clearInterval(contadorIntervalStreaming);
    contadorIntervalStreaming = setInterval(() => {
        ventasStreaming.forEach(v => {
            const fechaFin = new Date(new Date(v.fecha).getTime() + v.dias*86400000);
            const elem = document.getElementById(`count-streaming-${v.id}`);
            if (elem) actualizarContadorIndividual(elem, fechaFin);
        });
    }, 1000);
}

function actualizarContadorIndividual(elem, fechaFin) {
    const ahora = new Date();
    const diff = fechaFin - ahora;
    
    if (diff <= 0) {
        elem.innerHTML = `<div class="time-counter expired">EXPIRADO</div>`;
        return;
    }
    
    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);
    
    let clase = 'normal';
    if (dias < 7) clase = 'danger';
    else if (dias < 15) clase = 'warning';
    
    elem.innerHTML = `
        <div class="time-counter ${clase}">
            ${dias}d ${horas.toString().padStart(2,'0')}h ${minutos.toString().padStart(2,'0')}m ${segundos.toString().padStart(2,'0')}s
        </div>
        <div class="expiration-date">${dias} día(s) restante(s)</div>
    `;
}

function mostrarSugerenciasServiciosStreaming() {
    const input = document.getElementById('servicioStreaming');
    const contenedor = document.getElementById('sugerencias-servicios-streaming');
    const valor = input.value.toLowerCase();
    
    if (!valor) { contenedor.style.display = 'none'; return; }
    
    const sugerencias = serviciosSugeridosStreaming.filter(s => s.toLowerCase().includes(valor)).slice(0,5);
    
    if (sugerencias.length === 0) {
        contenedor.innerHTML = `<div class="sugerencia-item" onclick="seleccionarServicioStreaming('${valor}')"><i class="fas fa-plus-circle"></i> Crear: "${valor}"</div>`;
    } else {
        contenedor.innerHTML = sugerencias.map(s => `<div class="sugerencia-item" onclick="seleccionarServicioStreaming('${s}')"><i class="fas fa-play-circle"></i> ${s}</div>`).join('');
        if (!sugerencias.includes(valor)) {
            contenedor.innerHTML += `<div class="sugerencia-item" onclick="seleccionarServicioStreaming('${valor}')"><i class="fas fa-plus-circle"></i> Usar "${valor}"</div>`;
        }
    }
    contenedor.style.display = 'block';
}

function seleccionarServicioStreaming(servicio) {
    document.getElementById('servicioStreaming').value = servicio;
    document.getElementById('sugerencias-servicios-streaming').style.display = 'none';
}

function configurarAutocompleteStreaming() {
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-with-suggestions')) {
            document.getElementById('sugerencias-servicios-streaming').style.display = 'none';
        }
    });
}

function actualizarServiciosSidebarStreaming() {
    const container = document.getElementById('services-list-streaming');
    if (!container) return;
    
    const count = {};
    ventasStreaming.forEach(v => { count[v.servicio] = (count[v.servicio] || 0) + 1; });
    
    const top = Object.entries(count)
        .sort((a,b) => b[1] - a[1])
        .slice(0,5)
        .map(([s]) => s);
    
    while (top.length < 5 && serviciosSugeridosStreaming.length > top.length) {
        const s = serviciosSugeridosStreaming[top.length];
        if (!top.includes(s)) top.push(s);
    }
    
    container.innerHTML = top.map(s => {
        let cls = 'other';
        if (s.toLowerCase().includes('netflix')) cls = 'netflix';
        else if (s.toLowerCase().includes('disney')) cls = 'disney';
        else if (s.toLowerCase().includes('hbo') || s.toLowerCase().includes('max')) cls = 'max';
        else if (s.toLowerCase().includes('spotify')) cls = 'spotify';
        else if (s.toLowerCase().includes('prime')) cls = 'prime';
        else if (s.toLowerCase().includes('youtube')) cls = 'youtube';
        else if (s.toLowerCase().includes('apple')) cls = 'apple';
        return `<div class="service-tag ${cls}" onclick="filtrarPorServicioStreaming('${s}')">${s}</div>`;
    }).join('');
}

function filtrarPorServicioStreaming(servicio) {
    document.getElementById('buscador-streaming').value = servicio;
    filtrarVentasStreaming();
}

function actualizarNotificacionesStreaming() {
    const ahora = new Date();
    let proximas = 0;
    let html = '';
    
    ventasStreaming.forEach(v => {
        if (v.estado !== 'activo') return;
        const fechaFin = new Date(new Date(v.fecha).getTime() + v.dias*86400000);
        const dias = Math.ceil((fechaFin - ahora) / 86400000);
        if (dias > 0 && dias <= 7) {
            proximas++;
            html += `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid var(--border-color);">
                    <div style="background:#f94144; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div style="flex:1;">
                        <strong>${v.servicio} - ${v.cliente}</strong>
                        <p style="font-size:12px; color:var(--text-secondary);">Vence en ${dias} día(s)</p>
                    </div>
                    <button class="btn-icon btn-whatsapp" onclick="enviarRecordatorioStreaming(${v.id})">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            `;
        }
    });
    
    document.getElementById('notification-badge-streaming').textContent = proximas;
    document.getElementById('notification-badge-streaming').style.display = proximas > 0 ? 'flex' : 'none';
    
    const lista = document.getElementById('lista-notificaciones-streaming');
    if (lista) {
        if (proximas === 0) {
            lista.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fas fa-check-circle" style="font-size:48px; margin-bottom:16px;"></i><p>Todo al día</p></div>`;
        } else {
            lista.innerHTML = html;
        }
    }
}

// ==================== FUNCIONES CHATGPT ====================
function guardarCuentaChatGPT(e) {
    e.preventDefault();
    const cuenta = {
        id: Date.now(),
        fecha: document.getElementById('fechaCompraChatGPT').value,
        costo: parseFloat(document.getElementById('costoCuentaChatGPT').value),
        proveedor: document.getElementById('proveedorChatGPT').value.trim() || 'Sin proveedor',
        estado: 'activo'
    };
    cuentasChatGPT.push(cuenta);
    localStorage.setItem('chatgpt_cuentas', JSON.stringify(cuentasChatGPT));
    renderChatGPT();
    updateChartsChatGPT();
    showToast('Cuenta registrada', 'success');
    cerrarModal('modalCuentaChatGPT');
}

function guardarVentaChatGPT(e) {
    e.preventDefault();
    
    const etiquetas = document.getElementById('etiquetasChatGPT').value.trim()
        .split(',').map(e => e.trim().toUpperCase()).filter(e => e);
    
    const venta = {
        id: currentEditIdChatGPT || Date.now(),
        cliente: document.getElementById('clienteChatGPT').value.trim(),
        whatsapp: document.getElementById('whatsappChatGPT').value.trim(),
        precio: parseFloat(document.getElementById('precioChatGPT').value),
        fecha: document.getElementById('fechaVentaChatGPT').value,
        dias: parseInt(document.getElementById('duracionChatGPT').value),
        etiquetas: etiquetas,
        estado: 'activo',
        fechaRegistro: new Date().toISOString()
    };
    
    if (currentEditIdChatGPT) {
        const index = ventasChatGPT.findIndex(v => v.id === currentEditIdChatGPT);
        if (index !== -1) ventasChatGPT[index] = venta;
        showToast('Venta actualizada', 'success');
    } else {
        ventasChatGPT.push(venta);
        showToast('Venta registrada', 'success');
    }
    
    localStorage.setItem('chatgpt_ventas', JSON.stringify(ventasChatGPT));
    renderChatGPT();
    updateChartsChatGPT();
    actualizarNotificacionesChatGPT();
    actualizarStorage();
    cerrarModal('modalVentaChatGPT');
}

function renderChatGPT() {
    // Renderizar cuentas
    const tbodyCuentas = document.querySelector('#tablaCuentasChatGPT tbody');
    if (tbodyCuentas) {
        tbodyCuentas.innerHTML = '';
        const cuentasFiltradas = cuentasChatGPT.filter(c => filtroChatGPT === 'todos' ? true : c.estado === filtroChatGPT);
        cuentasFiltradas.forEach(c => {
            const row = document.createElement('tr');
            row.className = c.estado === 'inactivo' ? 'inactive-row' : '';
            row.innerHTML = `
                <td>#${c.id.toString().slice(-6)}</td>
                <td>${c.fecha}</td>
                <td>S/ ${c.costo.toFixed(2)}</td>
                <td>${c.proveedor}</td>
                <td><span class="status-badge ${c.estado === 'activo' ? 'active' : 'expired'}">${c.estado}</span></td>
                <td>
                    ${c.estado === 'activo' 
                        ? `<button class="btn-icon btn-delete" onclick="eliminarCuentaChatGPT(${c.id})"><i class="fas fa-trash"></i></button>` 
                        : `<button class="btn-icon btn-success" onclick="restaurarCuentaChatGPT(${c.id})"><i class="fas fa-undo"></i></button>`}
                </td>
            `;
            tbodyCuentas.appendChild(row);
        });
    }
    
    // Renderizar ventas
    const tbodyVentas = document.querySelector('#tablaVentasChatGPT tbody');
    if (tbodyVentas) {
        tbodyVentas.innerHTML = '';
        
        // Calcular totales
        const totalInversion = cuentasChatGPT.reduce((s, c) => s + (c.estado === 'activo' ? c.costo : 0), 0);
        const totalVentas = ventasChatGPT.reduce((s, v) => s + (v.estado === 'activo' ? v.precio : 0), 0);
        const ganancia = totalVentas - totalInversion;
        const roi = totalInversion > 0 ? (ganancia / totalInversion) * 100 : 0;
        
        document.getElementById('chatgpt-inversion-cuentas').textContent = `S/ ${totalInversion.toFixed(2)}`;
        document.getElementById('chatgpt-ventas-accesos').textContent = `S/ ${totalVentas.toFixed(2)}`;
        document.getElementById('chatgpt-ganancia').textContent = `S/ ${ganancia.toFixed(2)}`;
        document.getElementById('chatgpt-roi').textContent = `${roi.toFixed(1)}%`;
        document.getElementById('badge-chatgpt').textContent = ventasChatGPT.filter(v => v.estado === 'activo').length;
        
        // Filtrar ventas
        let ventasFiltradas = ventasChatGPT;
        if (filtroChatGPT === 'activos') ventasFiltradas = ventasChatGPT.filter(v => v.estado === 'activo');
        else if (filtroChatGPT === 'inactivos') ventasFiltradas = ventasChatGPT.filter(v => v.estado === 'inactivo');
        
        ventasFiltradas.sort((a, b) => {
            const fA = new Date(new Date(a.fecha).getTime() + a.dias*86400000);
            const fB = new Date(new Date(b.fecha).getTime() + b.dias*86400000);
            return fA - fB;
        });
        
        ventasFiltradas.forEach(v => {
            const fechaFin = new Date(new Date(v.fecha).getTime() + v.dias*86400000);
            const expiracion = fechaFin.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
            
            const tagsHTML = (v.etiquetas || []).map(tag => {
                let cls = '';
                if (tag.includes('YA PAGO')) cls = 'ya-pago';
                else if (tag.includes('RENOVACION PENDIENTE')) cls = 'renovacion-pendiente';
                else if (tag.includes('URGENTE')) cls = 'urgente';
                else if (tag.includes('CLIENTE VIP')) cls = 'cliente-vip';
                return `<span class="tag-badge ${cls}" onclick="filtrarPorEtiquetaChatGPT('${tag}')">${tag}</span>`;
            }).join('');
            
            const row = document.createElement('tr');
            row.className = v.estado === 'inactivo' ? 'inactive-row' : '';
            row.innerHTML = `
                <td>#${v.id.toString().slice(-6)}</td>
                <td><strong>${v.cliente}</strong></td>
                <td>${v.whatsapp}</td>
                <td>${v.fecha}</td>
                <td>${expiracion}</td>
                <td><div class="time-counter-container" id="count-chatgpt-${v.id}"></div></td>
                <td>S/ ${v.precio.toFixed(2)}</td>
                <td><div class="tags-container">${tagsHTML || '<small>—</small>'}</div></td>
                <td>
                    <span class="status-badge ${v.estado === 'activo' ? 'active' : 'expired'}">
                        ${v.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editarVentaChatGPT(${v.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-whatsapp" onclick="enviarRecordatorioChatGPT(${v.id})"><i class="fab fa-whatsapp"></i></button>
                        ${v.estado === 'activo' 
                            ? `<button class="btn-icon btn-delete" onclick="eliminarVentaChatGPT(${v.id})"><i class="fas fa-trash"></i></button>` 
                            : `<button class="btn-icon btn-success" onclick="restaurarVentaChatGPT(${v.id})"><i class="fas fa-undo"></i></button>`}
                    </div>
                </td>
            `;
            tbodyVentas.appendChild(row);
            
            // Contador
            const contador = document.getElementById(`count-chatgpt-${v.id}`);
            if (contador) actualizarContadorIndividual(contador, fechaFin);
        });
    }
}

function editarVentaChatGPT(id) {
    const venta = ventasChatGPT.find(v => v.id === id);
    if (!venta) return;
    currentEditIdChatGPT = id;
    
    document.getElementById('clienteChatGPT').value = venta.cliente;
    document.getElementById('whatsappChatGPT').value = venta.whatsapp;
    document.getElementById('precioChatGPT').value = venta.precio;
    document.getElementById('fechaVentaChatGPT').value = venta.fecha;
    document.getElementById('duracionChatGPT').value = venta.dias || 30;
    document.getElementById('etiquetasChatGPT').value = (venta.etiquetas || []).join(', ');
    
    document.querySelector('#modalVentaChatGPT .modal-footer .btn-primary').innerHTML = '<i class="fas fa-save"></i> Actualizar';
    document.querySelector('#modalVentaChatGPT .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Editar Acceso';
    
    document.getElementById('modalVentaChatGPT').style.display = 'flex';
}

function eliminarVentaChatGPT(id) {
    if (confirm('¿Marcar esta venta como inactiva? (Los totales se mantendrán)')) {
        const index = ventasChatGPT.findIndex(v => v.id === id);
        if (index !== -1) {
            ventasChatGPT[index].estado = 'inactivo';
            localStorage.setItem('chatgpt_ventas', JSON.stringify(ventasChatGPT));
            renderChatGPT();
            updateChartsChatGPT();
            actualizarNotificacionesChatGPT();
            showToast('Venta marcada como inactiva', 'warning');
        }
    }
}

function restaurarVentaChatGPT(id) {
    const index = ventasChatGPT.findIndex(v => v.id === id);
    if (index !== -1) {
        ventasChatGPT[index].estado = 'activo';
        localStorage.setItem('chatgpt_ventas', JSON.stringify(ventasChatGPT));
        renderChatGPT();
        updateChartsChatGPT();
        actualizarNotificacionesChatGPT();
        showToast('Venta restaurada', 'success');
    }
}

function eliminarCuentaChatGPT(id) {
    if (confirm('¿Marcar esta cuenta como inactiva?')) {
        const index = cuentasChatGPT.findIndex(c => c.id === id);
        if (index !== -1) {
            cuentasChatGPT[index].estado = 'inactivo';
            localStorage.setItem('chatgpt_cuentas', JSON.stringify(cuentasChatGPT));
            renderChatGPT();
            updateChartsChatGPT();
        }
    }
}

function restaurarCuentaChatGPT(id) {
    const index = cuentasChatGPT.findIndex(c => c.id === id);
    if (index !== -1) {
        cuentasChatGPT[index].estado = 'activo';
        localStorage.setItem('chatgpt_cuentas', JSON.stringify(cuentasChatGPT));
        renderChatGPT();
        updateChartsChatGPT();
    }
}

function enviarRecordatorioChatGPT(id) {
    const venta = ventasChatGPT.find(v => v.id === id);
    if (!venta) return;
    const fechaFin = new Date(new Date(venta.fecha).getTime() + venta.dias*86400000);
    const diasRestantes = Math.ceil((fechaFin - new Date()) / 86400000);
    let mensaje = `Hola, tu acceso a ChatGPT vence en ${diasRestantes} días. ¿Renuevas?`;
    window.open(`https://wa.me/51${venta.whatsapp}?text=${encodeURIComponent(mensaje)}`);
}

function filtrarVentasChatGPT() {
    const busqueda = document.getElementById('buscador-chatgpt').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaVentasChatGPT tbody tr');
    filas.forEach(f => {
        f.style.display = f.textContent.toLowerCase().includes(busqueda) ? '' : 'none';
    });
}

function filtrarExpiradosChatGPT() {
    const filas = document.querySelectorAll('#tablaVentasChatGPT tbody tr');
    filas.forEach(f => {
        const contador = f.querySelector('.time-counter');
        f.style.display = contador && contador.classList.contains('expired') ? '' : 'none';
    });
}

function mostrarActivosChatGPT() { filtroChatGPT = 'activos'; renderChatGPT(); }
function mostrarInactivosChatGPT() { filtroChatGPT = 'inactivos'; renderChatGPT(); }
function mostrarTodosChatGPT() { filtroChatGPT = 'todos'; renderChatGPT(); }

function filtrarPorEtiquetaChatGPT(etiqueta) {
    document.getElementById('buscador-chatgpt').value = etiqueta;
    filtrarVentasChatGPT();
}

function iniciarContadoresChatGPT() {
    if (contadorIntervalChatGPT) clearInterval(contadorIntervalChatGPT);
    contadorIntervalChatGPT = setInterval(() => {
        ventasChatGPT.forEach(v => {
            const fechaFin = new Date(new Date(v.fecha).getTime() + v.dias*86400000);
            const elem = document.getElementById(`count-chatgpt-${v.id}`);
            if (elem) actualizarContadorIndividual(elem, fechaFin);
        });
    }, 1000);
}

function actualizarNotificacionesChatGPT() {
    const ahora = new Date();
    let proximas = 0;
    let html = '';
    
    ventasChatGPT.forEach(v => {
        if (v.estado !== 'activo') return;
        const fechaFin = new Date(new Date(v.fecha).getTime() + v.dias*86400000);
        const dias = Math.ceil((fechaFin - ahora) / 86400000);
        if (dias > 0 && dias <= 7) {
            proximas++;
            html += `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid var(--border-color);">
                    <div style="background:#f94144; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div style="flex:1;">
                        <strong>ChatGPT - ${v.cliente}</strong>
                        <p style="font-size:12px; color:var(--text-secondary);">Vence en ${dias} día(s)</p>
                    </div>
                    <button class="btn-icon btn-whatsapp" onclick="enviarRecordatorioChatGPT(${v.id})">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            `;
        }
    });
    
    document.getElementById('notification-badge-chatgpt').textContent = proximas;
    document.getElementById('notification-badge-chatgpt').style.display = proximas > 0 ? 'flex' : 'none';
    
    const lista = document.getElementById('lista-notificaciones-chatgpt');
    if (lista) {
        if (proximas === 0) {
            lista.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);"><i class="fas fa-check-circle" style="font-size:48px; margin-bottom:16px;"></i><p>Todo al día</p></div>`;
        } else {
            lista.innerHTML = html;
        }
    }
}

// ==================== GRÁFICOS STREAMING ====================
function initChartsStreaming() {
    const ctxBar = document.getElementById('barChartStreaming');
    if (ctxBar) {
        chartBarStreaming = new Chart(ctxBar, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Ganancia (S/)', data: [], backgroundColor: '#4361ee' }] },
            options: { responsive: true }
        });
    }
    const ctxDoughnut = document.getElementById('doughnutChartStreaming');
    if (ctxDoughnut) {
        chartDoughnutStreaming = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            options: { responsive: true }
        });
    }
    const ctxLine = document.getElementById('lineChartStreaming');
    if (ctxLine) {
        chartLineStreaming = new Chart(ctxLine, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Ventas (S/)', data: [], borderColor: '#f72585' }] },
            options: { responsive: true }
        });
    }
    const ctxPayment = document.getElementById('paymentChartStreaming');
    if (ctxPayment) {
        chartPaymentStreaming = new Chart(ctxPayment, {
            type: 'pie',
            data: { labels: [], datasets: [{ data: [] }] },
            options: { responsive: true }
        });
    }
    updateChartsStreaming();
}

function updateChartsStreaming() {
    if (!chartBarStreaming || !ventasStreaming.length) return;
    
    const meses = obtenerUltimosMeses(6);
    const datosMensuales = meses.map(m => {
        const mes = m.getMonth();
        const año = m.getFullYear();
        return ventasStreaming
            .filter(v => new Date(v.fecha).getMonth() === mes && new Date(v.fecha).getFullYear() === año)
            .reduce((s, v) => s + (v.precio - v.costo), 0);
    });
    chartBarStreaming.data.labels = meses.map(m => m.toLocaleDateString('es-ES', { month: 'short' }));
    chartBarStreaming.data.datasets[0].data = datosMensuales;
    chartBarStreaming.update();
    
    // Doughnut
    const servicios = {};
    ventasStreaming.forEach(v => { servicios[v.servicio] = (servicios[v.servicio] || 0) + 1; });
    const top = Object.entries(servicios).sort((a,b) => b[1]-a[1]).slice(0,5);
    chartDoughnutStreaming.data.labels = top.map(t => t[0]);
    chartDoughnutStreaming.data.datasets[0].data = top.map(t => t[1]);
    chartDoughnutStreaming.data.datasets[0].backgroundColor = ['#e50914','#0063e5','#00a8e1','#1db954','#ff0000'];
    chartDoughnutStreaming.update();
    
    // Línea
    const dias = obtenerUltimosDias(7);
    const ventasDiarias = dias.map(d => {
        const dStr = d.toISOString().split('T')[0];
        return ventasStreaming.filter(v => v.fecha === dStr).reduce((s, v) => s + v.precio, 0);
    });
    chartLineStreaming.data.labels = dias.map(d => d.toLocaleDateString('es-ES', { day:'numeric', month:'short' }));
    chartLineStreaming.data.datasets[0].data = ventasDiarias;
    chartLineStreaming.update();
    
    // Métodos de pago
    const metodos = {};
    ventasStreaming.forEach(v => { metodos[v.metodo] = (metodos[v.metodo] || 0) + 1; });
    chartPaymentStreaming.data.labels = Object.keys(metodos);
    chartPaymentStreaming.data.datasets[0].data = Object.values(metodos);
    chartPaymentStreaming.update();
}

// ==================== GRÁFICOS CHATGPT ====================
function initChartsChatGPT() {
    const ctxBar = document.getElementById('barChartChatGPT');
    if (ctxBar) {
        chartBarChatGPT = new Chart(ctxBar, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Ventas (S/)', data: [], backgroundColor: '#10a37f' }] },
            options: { responsive: true }
        });
    }
    const ctxDoughnut = document.getElementById('doughnutChartChatGPT');
    if (ctxDoughnut) {
        chartDoughnutChatGPT = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: { labels: ['≤7', '>7'], datasets: [{ data: [0, 0], backgroundColor: ['#10a37f', '#0e8c6e'] }] },
            options: { responsive: true }
        });
    }
    const ctxLine = document.getElementById('lineChartChatGPT');
    if (ctxLine) {
        chartLineChatGPT = new Chart(ctxLine, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Ventas (S/)', data: [], borderColor: '#10a37f' }] },
            options: { responsive: true }
        });
    }
    updateChartsChatGPT();
}

function updateChartsChatGPT() {
    if (!chartBarChatGPT || !ventasChatGPT.length) return;
    
    const meses = obtenerUltimosMeses(6);
    const datosMensuales = meses.map(m => {
        const mes = m.getMonth();
        const año = m.getFullYear();
        return ventasChatGPT
            .filter(v => new Date(v.fecha).getMonth() === mes && new Date(v.fecha).getFullYear() === año && v.estado === 'activo')
            .reduce((s, v) => s + v.precio, 0);
    });
    chartBarChatGPT.data.labels = meses.map(m => m.toLocaleDateString('es-ES', { month: 'short' }));
    chartBarChatGPT.data.datasets[0].data = datosMensuales;
    chartBarChatGPT.update();
    
    const menorIgual7 = ventasChatGPT.filter(v => v.estado === 'activo' && v.precio <= 7).length;
    const mayor7 = ventasChatGPT.filter(v => v.estado === 'activo' && v.precio > 7).length;
    chartDoughnutChatGPT.data.datasets[0].data = [menorIgual7, mayor7];
    chartDoughnutChatGPT.update();
    
    const dias = obtenerUltimosDias(7);
    const ventasDiarias = dias.map(d => {
        const dStr = d.toISOString().split('T')[0];
        return ventasChatGPT.filter(v => v.fecha === dStr && v.estado === 'activo').reduce((s, v) => s + v.precio, 0);
    });
    chartLineChatGPT.data.labels = dias.map(d => d.toLocaleDateString('es-ES', { day:'numeric', month:'short' }));
    chartLineChatGPT.data.datasets[0].data = ventasDiarias;
    chartLineChatGPT.update();
}

// Funciones auxiliares para fechas
function obtenerUltimosMeses(n) {
    const meses = [];
    for (let i = n-1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        d.setDate(1);
        meses.push(d);
    }
    return meses;
}

function obtenerUltimosDias(n) {
    const dias = [];
    for (let i = n-1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dias.push(d);
    }
    return dias;
}

// ==================== FUNCIONES COMUNES ADICIONALES ====================
function actualizarStorage() {
    const total = 5 * 1024 * 1024;
    const usado = JSON.stringify(ventasStreaming).length + JSON.stringify(serviciosSugeridosStreaming).length +
                  JSON.stringify(cuentasChatGPT).length + JSON.stringify(ventasChatGPT).length;
    const percent = Math.min(100, Math.round((usado / total) * 100));
    document.getElementById('storage-percent').textContent = percent + '%';
    const bar = document.getElementById('storage-bar');
    bar.style.width = percent + '%';
    if (percent > 90) bar.style.background = 'var(--gradient-danger)';
    else if (percent > 70) bar.style.background = 'var(--gradient-warning)';
    else bar.style.background = 'var(--gradient-success)';
}

function abrirModalNuevaVentaStreaming() {
    currentEditIdStreaming = null;
    document.getElementById('formVentaStreaming').reset();
    document.getElementById('fechaVentaStreaming').value = new Date().toISOString().split('T')[0];
    document.getElementById('duracionStreaming').value = 30;
    document.getElementById('modalVentaStreaming').style.display = 'flex';
    document.querySelector('#modalVentaStreaming .modal-footer .btn-primary').innerHTML = '<i class="fas fa-bolt"></i> Registrar';
    document.querySelector('#modalVentaStreaming .modal-header h3').innerHTML = '<i class="fas fa-bolt"></i> Nueva Venta Streaming';
    calcularGananciaStreaming();
}

function abrirModalNuevaVentaChatGPT() {
    currentEditIdChatGPT = null;
    document.getElementById('formVentaChatGPT').reset();
    document.getElementById('fechaVentaChatGPT').value = new Date().toISOString().split('T')[0];
    document.getElementById('duracionChatGPT').value = 30;
    document.getElementById('precioChatGPT').value = 7;
    document.getElementById('modalVentaChatGPT').style.display = 'flex';
    document.querySelector('#modalVentaChatGPT .modal-footer .btn-primary').innerHTML = '<i class="fas fa-save"></i> Registrar';
    document.querySelector('#modalVentaChatGPT .modal-header h3').innerHTML = '<i class="fas fa-robot"></i> Nuevo Acceso ChatGPT';
}

function abrirModalNuevaCuentaChatGPT() {
    document.getElementById('formCuentaChatGPT').reset();
    document.getElementById('fechaCompraChatGPT').value = new Date().toISOString().split('T')[0];
    document.getElementById('costoCuentaChatGPT').value = 40;
    document.getElementById('modalCuentaChatGPT').style.display = 'flex';
}

function mostrarNotificacionesStreaming() {
    actualizarNotificacionesStreaming();
    document.getElementById('modalNotificacionesStreaming').style.display = 'flex';
}

function mostrarNotificacionesChatGPT() {
    actualizarNotificacionesChatGPT();
    document.getElementById('modalNotificacionesChatGPT').style.display = 'flex';
}

function descargarBackupStreaming() {
    const data = JSON.stringify(ventasStreaming, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streaming_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup descargado', 'success');
}

function descargarBackupChatGPT() {
    const data = { cuentas: cuentasChatGPT, ventas: ventasChatGPT };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup descargado', 'success');
}

function exportarExcelStreaming() {
    if (!ventasStreaming.length) { showToast('No hay datos', 'warning'); return; }
    const csv = ventasStreaming.map(v => 
        `${v.id},${v.cliente},${v.whatsapp},${v.servicio},${v.precio},${v.costo},${v.fecha},${v.estado}`
    ).join('\n');
    const blob = new Blob(['ID,Cliente,WhatsApp,Servicio,Precio,Costo,Fecha,Estado\n' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streaming_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function exportarExcelChatGPT() {
    if (!ventasChatGPT.length) { showToast('No hay datos', 'warning'); return; }
    const csv = ventasChatGPT.map(v => 
        `${v.id},${v.cliente},${v.whatsapp},${v.precio},${v.fecha},${v.estado}`
    ).join('\n');
    const blob = new Blob(['ID,Cliente,WhatsApp,Precio,Fecha,Estado\n' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function abrirModalImportarStreaming() { showToast('Importación en desarrollo', 'info'); }
function abrirModalImportarChatGPT() { showToast('Importación en desarrollo', 'info'); }

// Auto-save
setInterval(() => {
    localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventasStreaming));
    localStorage.setItem('rayo_servicios_sugeridos', JSON.stringify(serviciosSugeridosStreaming));
    localStorage.setItem('chatgpt_cuentas', JSON.stringify(cuentasChatGPT));
    localStorage.setItem('chatgpt_ventas', JSON.stringify(ventasChatGPT));
}, 30000);

// ==================== EXPORTAR FUNCIONES GLOBALES ====================
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.cerrarModal = cerrarModal;
window.abrirModalNuevaVentaStreaming = abrirModalNuevaVentaStreaming;
window.abrirModalNuevaVentaChatGPT = abrirModalNuevaVentaChatGPT;
window.abrirModalNuevaCuentaChatGPT = abrirModalNuevaCuentaChatGPT;
window.mostrarSugerenciasServiciosStreaming = mostrarSugerenciasServiciosStreaming;
window.seleccionarServicioStreaming = seleccionarServicioStreaming;
window.filtrarVentasStreaming = filtrarVentasStreaming;
window.filtrarExpiradosStreaming = filtrarExpiradosStreaming;
window.mostrarActivosStreaming = mostrarActivosStreaming;
window.mostrarInactivosStreaming = mostrarInactivosStreaming;
window.mostrarTodosStreaming = mostrarTodosStreaming;
window.filtrarPorEtiquetaStreaming = filtrarPorEtiquetaStreaming;
window.editarVentaStreaming = editarVentaStreaming;
window.eliminarVentaStreaming = eliminarVentaStreaming;
window.restaurarVentaStreaming = restaurarVentaStreaming;
window.enviarRecordatorioStreaming = enviarRecordatorioStreaming;
window.filtrarVentasChatGPT = filtrarVentasChatGPT;
window.filtrarExpiradosChatGPT = filtrarExpiradosChatGPT;
window.mostrarActivosChatGPT = mostrarActivosChatGPT;
window.mostrarInactivosChatGPT = mostrarInactivosChatGPT;
window.mostrarTodosChatGPT = mostrarTodosChatGPT;
window.filtrarPorEtiquetaChatGPT = filtrarPorEtiquetaChatGPT;
window.editarVentaChatGPT = editarVentaChatGPT;
window.eliminarVentaChatGPT = eliminarVentaChatGPT;
window.restaurarVentaChatGPT = restaurarVentaChatGPT;
window.eliminarCuentaChatGPT = eliminarCuentaChatGPT;
window.restaurarCuentaChatGPT = restaurarCuentaChatGPT;
window.enviarRecordatorioChatGPT = enviarRecordatorioChatGPT;
window.mostrarNotificacionesStreaming = mostrarNotificacionesStreaming;
window.mostrarNotificacionesChatGPT = mostrarNotificacionesChatGPT;
window.descargarBackupStreaming = descargarBackupStreaming;
window.descargarBackupChatGPT = descargarBackupChatGPT;
window.exportarExcelStreaming = exportarExcelStreaming;
window.exportarExcelChatGPT = exportarExcelChatGPT;
window.abrirModalImportarStreaming = abrirModalImportarStreaming;
window.abrirModalImportarChatGPT = abrirModalImportarChatGPT;
window.calcularGananciaStreaming = calcularGananciaStreaming;