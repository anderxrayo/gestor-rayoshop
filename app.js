// Variables globales
let ventas = JSON.parse(localStorage.getItem('rayo_shop_ultra')) || [];
let serviciosSugeridos = JSON.parse(localStorage.getItem('rayo_servicios_sugeridos')) || [
    "Netflix Premium", "Disney+", "HBO Max", "Spotify Premium", 
    "Amazon Prime", "YouTube Premium", "Apple TV+", "Star+",
    "Paramount+", "Crunchyroll", "Twitch Turbo", "Xbox Game Pass",
    "PlayStation Plus", "Nintendo Switch Online", "Discord Nitro"
];
let chartBar = null, chartDoughnut = null, chartLine = null, chartPayment = null;
let currentEditId = null;
let contadorInterval = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha actual
    actualizarFechaActual();
    
    // Configurar fecha por defecto en formulario
    const hoy = new Date();
    document.getElementById('fechaVenta').value = hoy.toISOString().split('T')[0];
    
    // Configurar autocomplete para servicios
    configurarAutocompleteServicios();
    
    // Inicializar gráficos
    initCharts();
    
    // Renderizar datos
    renderAll();
    
    // Configurar event listeners para cálculos en tiempo real
    setupRealTimeCalculations();
    
    // Configurar animaciones
    setupAnimations();
    
    // Iniciar contador global en tiempo real
    iniciarContadorGlobal();
    
    // Actualizar servicios en sidebar
    actualizarServiciosSidebar();
    
    // Actualizar notificaciones
    actualizarNotificaciones();
    
    // Actualizar storage
    actualizarStorage();
});

// Función para actualizar fecha actual en tiempo real
function actualizarFechaActual() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    document.getElementById('current-date').textContent = 
        ahora.toLocaleDateString('es-ES', opciones);
    
    // Actualizar cada segundo
    setTimeout(actualizarFechaActual, 1000);
}

// Función para mostrar sugerencias de servicios
function mostrarSugerenciasServicios() {
    const input = document.getElementById('servicio');
    const contenedor = document.getElementById('sugerencias-servicios');
    const valor = input.value.toLowerCase();
    
    if (!valor) {
        contenedor.style.display = 'none';
        return;
    }
    
    // Filtrar sugerencias
    const sugerencias = serviciosSugeridos.filter(servicio => 
        servicio.toLowerCase().includes(valor)
    );
    
    // Limitar a 5 sugerencias
    const sugerenciasMostrar = sugerencias.slice(0, 5);
    
    if (sugerenciasMostrar.length === 0) {
        contenedor.innerHTML = `
            <div class="sugerencia-item" onclick="seleccionarServicio('${valor}')">
                <i class="fas fa-plus-circle"></i> Crear nuevo: "${valor}"
            </div>
        `;
    } else {
        contenedor.innerHTML = sugerenciasMostrar.map(servicio => `
            <div class="sugerencia-item" onclick="seleccionarServicio('${servicio}')">
                <i class="fas fa-play-circle"></i> ${servicio}
            </div>
        `).join('');
        
        // Agregar opción para crear manual si el valor no está en la lista
        if (!sugerencias.includes(valor)) {
            contenedor.innerHTML += `
                <div class="sugerencia-item" onclick="seleccionarServicio('${valor}')">
                    <i class="fas fa-plus-circle"></i> Usar "${valor}"
                </div>
            `;
        }
    }
    
    contenedor.style.display = 'block';
}

function seleccionarServicio(servicio) {
    document.getElementById('servicio').value = servicio;
    document.getElementById('sugerencias-servicios').style.display = 'none';
}

function configurarAutocompleteServicios() {
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-with-suggestions')) {
            document.getElementById('sugerencias-servicios').style.display = 'none';
        }
    });
}

// Iniciar contador global en tiempo real
function iniciarContadorGlobal() {
    if (contadorInterval) clearInterval(contadorInterval);
    
    contadorInterval = setInterval(() => {
        actualizarTodosLosContadores();
    }, 1000); // Actualizar cada segundo
}

// Actualizar todos los contadores
function actualizarTodosLosContadores() {
    ventas.forEach(venta => {
        const fechaFin = new Date(new Date(venta.fecha).getTime() + (venta.dias * 86400000));
        const elemento = document.getElementById(`count-${venta.id}`);
        
        if (elemento) {
            actualizarContadorIndividual(elemento, fechaFin);
        }
    });
}

// Actualizar contador individual
function actualizarContadorIndividual(elemento, fechaFin) {
    const ahora = new Date();
    const diferencia = fechaFin - ahora;
    
    if (diferencia <= 0) {
        elemento.innerHTML = `
            <div class="time-counter expired">EXPIRADO</div>
            <div class="expiration-date">Hace ${Math.abs(Math.floor(diferencia / 86400000))} días</div>
        `;
        return;
    }
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
    
    // Determinar clase según días restantes
    let claseContador = 'normal';
    if (dias < 7) {
        claseContador = 'danger'; // Rojo para menos de 7 días
    } else if (dias < 15) {
        claseContador = 'warning'; // Amarillo para menos de 15 días
    }
    
    elemento.innerHTML = `
        <div class="time-counter ${claseContador}">
            ${dias}d ${horas.toString().padStart(2, '0')}h ${minutos.toString().padStart(2, '0')}m ${segundos.toString().padStart(2, '0')}s
        </div>
        <div class="expiration-date">
            ${dias === 1 ? '1 día restante' : `${dias} días restantes`}
        </div>
    `;
}

// Calcular ganancia en formulario
function calcularGananciaForm() {
    const precio = parseFloat(document.getElementById('precio').value) || 0;
    const costo = parseFloat(document.getElementById('costo').value) || 0;
    const ganancia = precio - costo;
    const margen = costo > 0 ? ((ganancia / costo) * 100).toFixed(1) : 0;
    const roi = costo > 0 ? ((ganancia / costo) * 100).toFixed(1) : 0;
    
    document.getElementById('gananciaPreview').textContent = `S/ ${ganancia.toFixed(2)}`;
    document.getElementById('margenPreview').textContent = `${margen}%`;
    document.getElementById('roiPreview').textContent = `${roi}%`;
    
    // Cambiar color según margen
    const margenElement = document.getElementById('margenPreview');
    if (margen > 100) {
        margenElement.style.color = '#10b981';
    } else if (margen > 50) {
        margenElement.style.color = '#f59e0b';
    } else {
        margenElement.style.color = '#ef4444';
    }
}

function setupRealTimeCalculations() {
    const precioInput = document.getElementById('precio');
    const costoInput = document.getElementById('costo');
    
    precioInput.addEventListener('input', calcularGananciaForm);
    costoInput.addEventListener('input', calcularGananciaForm);
}

// Formulario de venta
document.getElementById('formVenta').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        id: currentEditId || Date.now(),
        cliente: document.getElementById('cliente').value.trim(),
        whatsapp: document.getElementById('whatsapp').value.trim(),
        servicio: document.getElementById('servicio').value.trim(),
        plan: document.getElementById('plan').value,
        correo: document.getElementById('correo').value.trim(),
        clave: document.getElementById('clave').value.trim(),
        perfil: document.getElementById('perfil').value.trim() || '-',
        metodo: document.getElementById('metodoPago').value,
        precio: parseFloat(document.getElementById('precio').value),
        costo: parseFloat(document.getElementById('costo').value),
        fecha: document.getElementById('fechaVenta').value,
        dias: parseInt(document.getElementById('duracion').value),
        vendedor: document.getElementById('vendedor').value.trim() || 'No especificado',
        observaciones: document.getElementById('observaciones').value.trim(),
        prioridad: document.getElementById('prioridad').value,
        fechaRegistro: new Date().toISOString(),
        status: 'active'
    };
    
    // Validar que el servicio no esté vacío
    if (!formData.servicio) {
        showToast('Por favor ingresa un servicio válido', 'error');
        return;
    }
    
    // Guardar servicio personalizado si no está en la lista
    if (!serviciosSugeridos.includes(formData.servicio)) {
        serviciosSugeridos.unshift(formData.servicio);
        localStorage.setItem('rayo_servicios_sugeridos', JSON.stringify(serviciosSugeridos));
        actualizarServiciosSidebar();
    }
    
    if (currentEditId) {
        // Editar venta existente
        const index = ventas.findIndex(v => v.id === currentEditId);
        if (index !== -1) {
            ventas[index] = formData;
            showToast('¡Venta actualizada exitosamente!', 'success');
        }
    } else {
        // Agregar nueva venta
        ventas.push(formData);
        showToast('¡Venta registrada exitosamente!', 'success');
    }
    
    // Guardar en localStorage
    localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventas));
    
    // Actualizar vista
    renderAll();
    updateCharts();
    actualizarNotificaciones();
    actualizarStorage();
    
    // Cerrar modal
    cerrarModal();
});

// Renderizar todas las ventas
function renderAll() {
    const tbody = document.querySelector('#tablaVentas tbody');
    tbody.innerHTML = '';
    
    let totalVentas = 0;
    let totalInversion = 0;
    let totalGanancia = 0;
    let totalClientes = new Set();
    let totalServicios = new Set();
    let expiracionesProximas = 0;
    
    // Ordenar por prioridad y fecha
    const ventasOrdenadas = [...ventas].sort((a, b) => {
        // Primero por prioridad
        const prioridadOrden = { urgente: 0, alta: 1, normal: 2 };
        const prioridadA = prioridadOrden[a.prioridad] || 2;
        const prioridadB = prioridadOrden[b.prioridad] || 2;
        
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        
        // Luego por fecha de vencimiento (más cercano primero)
        const fechaFinA = new Date(new Date(a.fecha).getTime() + (a.dias * 86400000));
        const fechaFinB = new Date(new Date(b.fecha).getTime() + (b.dias * 86400000));
        return fechaFinA - fechaFinB;
    });
    
    ventasOrdenadas.forEach((v, i) => {
        totalVentas += v.precio;
        totalInversion += v.costo;
        totalGanancia += (v.precio - v.costo);
        totalClientes.add(v.cliente);
        totalServicios.add(v.servicio);
        
        // Calcular expiraciones próximas
        const fechaFin = new Date(new Date(v.fecha).getTime() + (v.dias * 86400000));
        const ahora = new Date();
        const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 7 && diasRestantes > 0) {
            expiracionesProximas++;
        }
        
        const expiracion = fechaFin.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Determinar clase de prioridad
        let prioridadClass = v.prioridad || 'normal';
        
        // Determinar clase de servicio para icono
        let serviceClass = 'other';
        if (v.servicio.toLowerCase().includes('netflix')) serviceClass = 'netflix';
        else if (v.servicio.toLowerCase().includes('disney')) serviceClass = 'disney';
        else if (v.servicio.toLowerCase().includes('hbo') || v.servicio.toLowerCase().includes('max')) serviceClass = 'max';
        else if (v.servicio.toLowerCase().includes('spotify')) serviceClass = 'spotify';
        else if (v.servicio.toLowerCase().includes('prime')) serviceClass = 'prime';
        else if (v.servicio.toLowerCase().includes('youtube')) serviceClass = 'youtube';
        else if (v.servicio.toLowerCase().includes('apple')) serviceClass = 'apple';
        
        // Crear fila
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="badge badge-id">#${v.id.toString().slice(-6)}</span>
            </td>
            <td>
                <div class="client-info">
                    <strong>${v.cliente}</strong>
                    <small>${v.correo}</small>
                    <div class="contact-info">
                        <i class="fab fa-whatsapp"></i>
                        ${v.whatsapp}
                    </div>
                </div>
            </td>
            <td>
                <div class="service-info">
                    <span class="service-icon ${serviceClass}">
                        <i class="fas fa-play-circle"></i>
                    </span>
                    <div>
                        <strong>${v.servicio}</strong>
                        <small>${v.plan} • ${v.perfil}</small>
                        ${v.vendedor ? `<div class="vendedor-info" style="font-size:11px;color:var(--text-muted);margin-top:2px;"><i class="fas fa-user-tie"></i> ${v.vendedor}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <div class="expiration-info">
                    <div class="expiration-date">${expiracion}</div>
                    <div class="time-counter-container" id="count-${v.id}">
                        <!-- El contador se actualizará dinámicamente -->
                    </div>
                </div>
            </td>
            <td>
                <div class="profit-info">
                    <strong class="profit-amount">S/ ${(v.precio - v.costo).toFixed(2)}</strong>
                    <small class="profit-margin">${v.costo > 0 ? (((v.precio - v.costo) / v.costo) * 100).toFixed(1) : 0}% margen</small>
                </div>
            </td>
            <td>
                <span class="prioridad-badge ${prioridadClass}">
                    <i class="fas fa-flag"></i>
                    ${v.prioridad === 'alta' ? 'Alta' : v.prioridad === 'urgente' ? 'Urgente' : 'Normal'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editarVenta(${v.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-whatsapp" onclick="enviarRecordatorio(${v.id})" title="Enviar Recordatorio">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="eliminarVenta(${v.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Inicializar contador inmediatamente
        const contadorElement = document.getElementById(`count-${v.id}`);
        if (contadorElement) {
            actualizarContadorIndividual(contadorElement, fechaFin);
        }
    });
    
    // Calcular márgenes y tendencias
    const margenTotal = totalInversion > 0 ? ((totalGanancia / totalInversion) * 100) : 0;
    
    // Actualizar estadísticas
    document.getElementById('tVentas').textContent = `S/ ${totalVentas.toFixed(2)}`;
    document.getElementById('tInversion').textContent = `S/ ${totalInversion.toFixed(2)}`;
    document.getElementById('tGanancia').textContent = `S/ ${totalGanancia.toFixed(2)}`;
    document.getElementById('tMargen').textContent = `${margenTotal.toFixed(1)}%`;
    
    // Actualizar tendencias
    actualizarTendencias(totalVentas, totalInversion, totalGanancia, margenTotal);
    
    // Actualizar badge de ventas
    document.getElementById('badge-ventas').textContent = ventas.length;
    
    // Actualizar notificaciones de expiraciones
    document.getElementById('notification-badge').textContent = expiracionesProximas;
    document.getElementById('notification-badge').style.display = expiracionesProximas > 0 ? 'flex' : 'none';
}

// Actualizar tendencias
function actualizarTendencias(ventas, inversion, ganancia, margen) {
    // En una versión real, aquí compararías con el período anterior
    // Por ahora, simularemos algunas tendencias
    const trendVentas = document.getElementById('trend-ventas');
    const trendInversion = document.getElementById('trend-inversion');
    const trendGanancia = document.getElementById('trend-ganancia');
    const trendMargen = document.getElementById('trend-margen');
    
    // Simular tendencias aleatorias para demostración
    const randomUp = Math.random() > 0.3;
    const randomPercent = (Math.random() * 15).toFixed(1);
    
    if (ventas > 0) {
        trendVentas.className = 'stat-trend positive';
        trendVentas.innerHTML = `<i class="fas fa-arrow-up"></i> ${randomPercent}%`;
    }
    
    if (inversion > 0) {
        trendInversion.className = randomUp ? 'stat-trend positive' : 'stat-trend negative';
        trendInversion.innerHTML = randomUp ? 
            `<i class="fas fa-arrow-up"></i> ${randomPercent}%` : 
            `<i class="fas fa-arrow-down"></i> ${randomPercent}%`;
    }
    
    if (ganancia > 0) {
        trendGanancia.className = 'stat-trend positive';
        trendGanancia.innerHTML = `<i class="fas fa-arrow-up"></i> ${(margen/2).toFixed(1)}%`;
    }
    
    if (margen > 0) {
        trendMargen.className = margen > 50 ? 'stat-trend positive' : 'stat-trend negative';
        trendMargen.innerHTML = margen > 50 ? 
            `<i class="fas fa-arrow-up"></i> ${(margen/10).toFixed(1)}%` : 
            `<i class="fas fa-arrow-down"></i> ${(margen/10).toFixed(1)}%`;
    }
}

// Switch entre pestañas
function switchTab(tabId) {
    // Remover clase active de todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar active a la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Activar el botón correspondiente
    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Activar el ítem del menú correspondiente
    const activeMenuItem = document.querySelector(`.menu-item[onclick="switchTab('${tabId}')"]`);
    if (activeMenuItem) activeMenuItem.classList.add('active');
    
    // Actualizar gráficos si es la pestaña de stats
    if (tabId === 'tab-stats') {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }
}

// Toggle sidebar en móvil
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Abrir modal de nueva venta
function abrirModalNuevaVenta() {
    currentEditId = null;
    document.getElementById('formVenta').reset();
    document.getElementById('modalVenta').style.display = 'flex';
    document.querySelector('.modal-footer .btn-primary').innerHTML = 
        '<i class="fas fa-bolt"></i> Registrar Operación';
    document.querySelector('.modal-header h3').innerHTML = 
        '<i class="fas fa-bolt"></i> Nueva Operación';
    
    // Establecer valores por defecto
    document.getElementById('fechaVenta').value = new Date().toISOString().split('T')[0];
    document.getElementById('duracion').value = 30;
    document.getElementById('prioridad').value = 'normal';
    
    // Calcular ganancia inicial
    calcularGananciaForm();
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('modalVenta').style.display = 'none';
    currentEditId = null;
}

// Editar venta
function editarVenta(id) {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    
    currentEditId = id;
    
    // Llenar formulario con datos de la venta
    document.getElementById('cliente').value = venta.cliente;
    document.getElementById('whatsapp').value = venta.whatsapp;
    document.getElementById('servicio').value = venta.servicio;
    document.getElementById('plan').value = venta.plan;
    document.getElementById('correo').value = venta.correo;
    document.getElementById('clave').value = venta.clave;
    document.getElementById('perfil').value = venta.perfil;
    document.getElementById('metodoPago').value = venta.metodo;
    document.getElementById('precio').value = venta.precio;
    document.getElementById('costo').value = venta.costo;
    document.getElementById('fechaVenta').value = venta.fecha;
    document.getElementById('duracion').value = venta.dias;
    document.getElementById('vendedor').value = venta.vendedor || '';
    document.getElementById('observaciones').value = venta.observaciones || '';
    document.getElementById('prioridad').value = venta.prioridad || 'normal';
    
    // Actualizar botón y título del modal
    document.querySelector('.modal-footer .btn-primary').innerHTML = 
        '<i class="fas fa-save"></i> Actualizar Venta';
    document.querySelector('.modal-header h3').innerHTML = 
        '<i class="fas fa-edit"></i> Editar Operación';
    
    // Mostrar modal
    document.getElementById('modalVenta').style.display = 'flex';
    
    // Calcular ganancia inicial
    calcularGananciaForm();
}

// Eliminar venta
function eliminarVenta(ventaId) {
    const index = ventas.findIndex(v => v.id === ventaId);
    if (index === -1) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
        ventas.splice(index, 1);
        localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventas));
        renderAll();
        updateCharts();
        actualizarNotificaciones();
        actualizarStorage();
        showToast('Venta eliminada exitosamente', 'warning');
    }
}

// Enviar recordatorio por WhatsApp
function enviarRecordatorio(ventaId) {
    const venta = ventas.find(v => v.id === ventaId);
    if (!venta) return;
    
    const fechaFin = new Date(new Date(venta.fecha).getTime() + (venta.dias * 86400000));
    const ahora = new Date();
    const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
    
    let mensaje = `Hola te saluda Karina Escobar, te informo que tu servicio de ${venta.servicio} está pronto a vencer *¿Vas a renovar tu servicio?* Recuerda; según las políticas brindadas los pagos se hacen días antes de la fecha de vencimiento.`;
    
    // Agregar información adicional si hay días específicos
    if (diasRestantes <= 7 && diasRestantes > 0) {
        mensaje += `\n\n*Te quedan ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'} para renovar.*`;
    }
    
    // Agregar detalles si están disponibles
    if (venta.plan) {
        mensaje += `\nPlan: ${venta.plan}`;
    }
    if (venta.perfil && venta.perfil !== '-') {
        mensaje += `\nPerfil: ${venta.perfil}`;
    }
    
    window.open(`https://wa.me/51${venta.whatsapp}?text=${encodeURIComponent(mensaje)}`);
}

// Filtrar ventas
function filtrarVentas() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaVentas tbody tr');
    
    let encontrados = 0;
    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        const mostrar = textoFila.includes(busqueda);
        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) encontrados++;
    });
    
    // Mostrar mensaje si no hay resultados
    const tbody = document.querySelector('#tablaVentas tbody');
    if (encontrados === 0 && busqueda) {
        const noResults = document.createElement('tr');
        noResults.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                No se encontraron resultados para "${busqueda}"
            </td>
        `;
        // Asegurarse de que no se duplique
        if (!tbody.querySelector('.no-results')) {
            noResults.className = 'no-results';
            tbody.appendChild(noResults);
        }
    } else {
        const existingNoResults = tbody.querySelector('.no-results');
        if (existingNoResults) existingNoResults.remove();
    }
}

// Filtrar por expirados
function filtrarExpirados() {
    const filas = document.querySelectorAll('#tablaVentas tbody tr');
    
    filas.forEach(fila => {
        const contador = fila.querySelector('.time-counter');
        fila.style.display = contador && contador.classList.contains('expired') ? '' : 'none';
    });
}

// Mostrar todos
function mostrarTodos() {
    const filas = document.querySelectorAll('#tablaVentas tbody tr');
    filas.forEach(fila => {
        fila.style.display = '';
    });
}

// Exportar a Excel
function exportarExcel() {
    if (ventas.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    const datos = ventas.map(v => ({
        'ID': v.id,
        'Cliente': v.cliente,
        'WhatsApp': v.whatsapp,
        'Servicio': v.servicio,
        'Plan': v.plan,
        'Correo': v.correo,
        'Perfil': v.perfil,
        'Método de Pago': v.metodo,
        'Precio Venta': v.precio,
        'Costo': v.costo,
        'Ganancia': (v.precio - v.costo),
        'Fecha Venta': v.fecha,
        'Duración (días)': v.dias,
        'Vendedor': v.vendedor || 'No especificado',
        'Prioridad': v.prioridad,
        'Observaciones': v.observaciones || '',
        'Fecha Registro': v.fechaRegistro
    }));
    
    const csv = convertirAExcel(datos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rayo_shop_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Datos exportados exitosamente', 'success');
}

function convertirAExcel(datos) {
    const cabeceras = Object.keys(datos[0]).join(',');
    const filas = datos.map(obj => 
        Object.values(obj).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    );
    return [cabeceras, ...filas].join('\n');
}

// Descargar backup
function descargarBackup() {
    if (ventas.length === 0) {
        showToast('No hay datos para respaldar', 'warning');
        return;
    }
    
    const datos = JSON.stringify(ventas, null, 2);
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rayo_shop_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Backup descargado exitosamente', 'success');
}

// Inicializar gráficos
function initCharts() {
    // Gráfico de barras - Rentabilidad mensual
    const ctxBar = document.getElementById('barChart');
    if (ctxBar) {
        chartBar = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ganancia (S/)',
                    data: [],
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8' }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    // Gráfico de dona - Distribución de servicios
    const ctxDoughnut = document.getElementById('doughnutChart');
    if (ctxDoughnut) {
        chartDoughnut = new Chart(ctxDoughnut.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(229, 9, 20, 0.7)',    // Netflix
                        'rgba(0, 99, 229, 0.7)',     // Disney+
                        'rgba(0, 168, 225, 0.7)',    // HBO Max
                        'rgba(29, 185, 84, 0.7)',    // Spotify
                        'rgba(255, 87, 34, 0.7)',    // Prime
                        'rgba(255, 0, 0, 0.7)',      // YouTube
                        'rgba(128, 0, 128, 0.7)',    // Apple
                        'rgba(0, 102, 204, 0.7)',    // Paramount
                        'rgba(30, 41, 59, 0.7)'      // Otros
                    ],
                    borderColor: [
                        'rgba(229, 9, 20, 1)',
                        'rgba(0, 99, 229, 1)',
                        'rgba(0, 168, 225, 1)',
                        'rgba(29, 185, 84, 1)',
                        'rgba(255, 87, 34, 1)',
                        'rgba(255, 0, 0, 1)',
                        'rgba(128, 0, 128, 1)',
                        'rgba(0, 102, 204, 1)',
                        'rgba(30, 41, 59, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    // Gráfico de líneas - Tendencias
    const ctxLine = document.getElementById('lineChart');
    if (ctxLine) {
        chartLine = new Chart(ctxLine.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ventas (S/)',
                    data: [],
                    borderColor: 'rgba(247, 37, 133, 1)',
                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    // Gráfico de métodos de pago
    const ctxPayment = document.getElementById('paymentChart');
    if (ctxPayment) {
        chartPayment = new Chart(ctxPayment.getContext('2d'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(72, 149, 239, 0.7)',
                        'rgba(114, 9, 183, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(248, 150, 30, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    // Actualizar gráficos con datos iniciales
    updateCharts();
}

// Actualizar gráficos con datos actuales
function updateCharts() {
    if (!ventas.length) return;
    
    // Datos para gráfico de barras (últimos N meses)
    const filterBar = document.getElementById('chart-filter-bar')?.value || '6';
    const meses = getUltimosMeses(filterBar === 'all' ? 12 : parseInt(filterBar));
    const datosMensuales = calcularVentasPorMes(meses);
    if (chartBar) {
        chartBar.data.labels = meses.map(mes => 
            mes.toLocaleDateString('es-ES', { month: 'short' })
        );
        chartBar.data.datasets[0].data = datosMensuales;
        chartBar.update();
    }
    
    // Datos para gráfico de dona (distribución de servicios)
    const distribucionServicios = calcularDistribucionServicios();
    if (chartDoughnut) {
        chartDoughnut.data.labels = Object.keys(distribucionServicios);
        chartDoughnut.data.datasets[0].data = Object.values(distribucionServicios);
        chartDoughnut.update();
    }
    
    // Datos para gráfico de líneas (últimos N días)
    const filterLine = document.getElementById('chart-filter-line')?.value || '7';
    const dias = getUltimosDias(parseInt(filterLine));
    const datosDiarios = calcularVentasPorDia(dias);
    if (chartLine) {
        chartLine.data.labels = dias.map(dia => 
            dia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        );
        chartLine.data.datasets[0].data = datosDiarios;
        chartLine.update();
    }
    
    // Datos para gráfico de métodos de pago
    const metodosPago = calcularMetodosPago();
    if (chartPayment) {
        chartPayment.data.labels = Object.keys(metodosPago);
        chartPayment.data.datasets[0].data = Object.values(metodosPago);
        chartPayment.update();
    }
}

// Funciones auxiliares para cálculos
function getUltimosMeses(numMeses) {
    const meses = [];
    for (let i = numMeses - 1; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        fecha.setDate(1);
        meses.push(fecha);
    }
    return meses;
}

function getUltimosDias(numDias) {
    const dias = [];
    for (let i = numDias - 1; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        dias.push(fecha);
    }
    return dias;
}

function calcularVentasPorMes(meses) {
    return meses.map(mes => {
        const mesNum = mes.getMonth();
        const anioNum = mes.getFullYear();
        return ventas
            .filter(v => {
                const fechaVenta = new Date(v.fecha);
                return fechaVenta.getMonth() === mesNum && 
                       fechaVenta.getFullYear() === anioNum;
            })
            .reduce((sum, v) => sum + (v.precio - v.costo), 0);
    });
}

function calcularVentasPorDia(dias) {
    return dias.map(dia => {
        const diaStr = dia.toISOString().split('T')[0];
        return ventas
            .filter(v => v.fecha === diaStr)
            .reduce((sum, v) => sum + v.precio, 0);
    });
}

function calcularDistribucionServicios() {
    const distribucion = {};
    ventas.forEach(v => {
        distribucion[v.servicio] = (distribucion[v.servicio] || 0) + 1;
    });
    
    // Ordenar por cantidad y limitar a 8 servicios
    return Object.entries(distribucion)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});
}

function calcularMetodosPago() {
    const metodos = {};
    ventas.forEach(v => {
        metodos[v.metodo] = (metodos[v.metodo] || 0) + 1;
    });
    return metodos;
}

// Mostrar notificaciones Toast
function showToast(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: colors[type] || colors.info,
        stopOnFocus: true
    }).showToast();
}

// Setup animaciones
function setupAnimations() {
    // Animación para cards al cargar
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Actualizar servicios en sidebar
function actualizarServiciosSidebar() {
    const servicesList = document.getElementById('services-list');
    if (!servicesList) return;
    
    // Tomar los 5 servicios más usados
    const serviciosCount = {};
    ventas.forEach(v => {
        serviciosCount[v.servicio] = (serviciosCount[v.servicio] || 0) + 1;
    });
    
    const topServicios = Object.entries(serviciosCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([servicio]) => servicio);
    
    // Agregar algunos servicios sugeridos si no hay suficientes
    while (topServicios.length < 5 && serviciosSugeridos.length > 0) {
        const servicio = serviciosSugeridos[topServicios.length];
        if (!topServicios.includes(servicio)) {
            topServicios.push(servicio);
        }
    }
    
    servicesList.innerHTML = topServicios.map(servicio => {
        let serviceClass = 'other';
        if (servicio.toLowerCase().includes('netflix')) serviceClass = 'netflix';
        else if (servicio.toLowerCase().includes('disney')) serviceClass = 'disney';
        else if (servicio.toLowerCase().includes('hbo') || servicio.toLowerCase().includes('max')) serviceClass = 'max';
        else if (servicio.toLowerCase().includes('spotify')) serviceClass = 'spotify';
        else if (servicio.toLowerCase().includes('prime')) serviceClass = 'prime';
        else if (servicio.toLowerCase().includes('youtube')) serviceClass = 'youtube';
        else if (servicio.toLowerCase().includes('apple')) serviceClass = 'apple';
        
        return `<div class="service-tag ${serviceClass}" onclick="filtrarPorServicio('${servicio}')">${servicio}</div>`;
    }).join('');
}

function filtrarPorServicio(servicio) {
    document.getElementById('buscador').value = servicio;
    filtrarVentas();
}

// Actualizar notificaciones
function actualizarNotificaciones() {
    const ahora = new Date();
    let expiracionesProximas = 0;
    let notificacionesHTML = '';
    
    ventas.forEach(venta => {
        const fechaFin = new Date(new Date(venta.fecha).getTime() + (venta.dias * 86400000));
        const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 7 && diasRestantes > 0) {
            expiracionesProximas++;
            notificacionesHTML += `
                <div class="notificacion-item">
                    <div class="notificacion-icon danger">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="notificacion-content">
                        <strong>${venta.servicio} - ${venta.cliente}</strong>
                        <p>Vence en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}</p>
                    </div>
                    <button class="btn-icon btn-whatsapp" onclick="enviarRecordatorio(${venta.id})">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            `;
        }
    });
    
    // Actualizar badge
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.textContent = expiracionesProximas;
        badge.style.display = expiracionesProximas > 0 ? 'flex' : 'none';
    }
    
    // Actualizar lista de notificaciones
    const listaNotificaciones = document.getElementById('lista-notificaciones');
    if (listaNotificaciones) {
        if (expiracionesProximas === 0) {
            listaNotificaciones.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>¡Todo al día! No hay notificaciones pendientes.</p>
                </div>
            `;
        } else {
            listaNotificaciones.innerHTML = notificacionesHTML;
        }
    }
}

// Mostrar modal de notificaciones
function mostrarNotificaciones() {
    actualizarNotificaciones();
    document.getElementById('modalNotificaciones').style.display = 'flex';
}

function cerrarModalNotificaciones() {
    document.getElementById('modalNotificaciones').style.display = 'none';
}

// Actualizar storage
function actualizarStorage() {
    const totalStorage = 5 * 1024 * 1024; // 5MB
    const usedStorage = JSON.stringify(ventas).length + JSON.stringify(serviciosSugeridos).length;
    const percentUsed = Math.min(100, Math.round((usedStorage / totalStorage) * 100));
    
    document.getElementById('storage-percent').textContent = `${percentUsed}%`;
    document.getElementById('storage-bar').style.width = `${percentUsed}%`;
    
    // Cambiar color según uso
    const storageBar = document.getElementById('storage-bar');
    if (percentUsed > 90) {
        storageBar.style.background = 'var(--gradient-danger)';
    } else if (percentUsed > 70) {
        storageBar.style.background = 'var(--gradient-warning)';
    } else {
        storageBar.style.background = 'var(--gradient-success)';
    }
}

// Función para importar CSV (placeholder)
function abrirModalImportar() {
    showToast('Función de importación en desarrollo', 'info');
}

// Auto-save cada 30 segundos
setInterval(() => {
    localStorage.setItem('rayo_shop_ultra', JSON.stringify(ventas));
    localStorage.setItem('rayo_servicios_sugeridos', JSON.stringify(serviciosSugeridos));
}, 30000);

// Prevenir cerrar con F5 (demo)
document.addEventListener('keydown', function(e) {
    if (e.key === 'F5') {
        e.preventDefault();
        showToast('¡Panel protegido! Usa los controles del sistema.', 'warning');
    }
});

// Exportar funciones globales
window.descargarBackup = descargarBackup;
window.filtrarVentas = filtrarVentas;
window.filtrarExpirados = filtrarExpirados;
window.mostrarTodos = mostrarTodos;
window.exportarExcel = exportarExcel;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.abrirModalNuevaVenta = abrirModalNuevaVenta;
window.cerrarModal = cerrarModal;
window.editarVenta = editarVenta;
window.eliminarVenta = eliminarVenta;
window.enviarRecordatorio = enviarRecordatorio;
window.mostrarSugerenciasServicios = mostrarSugerenciasServicios;
window.seleccionarServicio = seleccionarServicio;
window.mostrarNotificaciones = mostrarNotificaciones;
window.cerrarModalNotificaciones = cerrarModalNotificaciones;
window.abrirModalImportar = abrirModalImportar;