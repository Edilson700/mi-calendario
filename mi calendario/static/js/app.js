// Variables globales
let eventos = [];
let eventoEditando = null;
const colores = ['#3788d8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Inicializar la aplicación cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicación iniciada');
    inicializarColorPicker();
    configurarSemanaActual();
    cargarEventos();
    
    // Event listeners
    document.getElementById('semanaActual').addEventListener('change', renderizarCalendario);
    document.getElementById('formEvento').addEventListener('submit', guardarEvento);
});

// Crear los botones de colores
function inicializarColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    colores.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-option';
        div.style.backgroundColor = color;
        div.onclick = () => seleccionarColor(color);
        colorPicker.appendChild(div);
    });
}

// Seleccionar un color
function seleccionarColor(color) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
}

// Configurar la semana actual por defecto
function configurarSemanaActual() {
    const hoy = new Date();
    const primerDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 1));
    const año = primerDia.getFullYear();
    const semana = obtenerNumeroSemana(primerDia);
    document.getElementById('semanaActual').value = `${año}-W${semana.toString().padStart(2, '0')}`;
}

// Calcular el número de semana del año
function obtenerNumeroSemana(fecha) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const diaSemana = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
    const inicioAño = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const numeroSemana = Math.ceil((((d - inicioAño) / 86400000) + 1) / 7);
    return numeroSemana;
}

// Cargar eventos desde el servidor
async function cargarEventos() {
    try {
        const response = await fetch('/api/eventos');
        eventos = await response.json();
        console.log('Eventos cargados:', eventos.length);
        renderizarCalendario();
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        alert('Error al cargar las actividades');
    }
}

// Dibujar el calendario con todos los eventos
function renderizarCalendario() {
    const grid = document.getElementById('calendarioGrid');
    grid.innerHTML = '';
    
    const [año, semana] = document.getElementById('semanaActual').value.split('-W');
    const primerDia = obtenerPrimerDiaSemana(parseInt(año), parseInt(semana));
    
    // Crear celdas para cada hora del día (0-23)
    for (let hora = 0; hora < 24; hora++) {
        // Celda de hora
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = `${hora.toString().padStart(2, '0')}:00`;
        grid.appendChild(timeSlot);
        
        // Crear 7 celdas (una por cada día de la semana)
        for (let dia = 0; dia < 7; dia++) {
            const fecha = new Date(primerDia);
            fecha.setDate(fecha.getDate() + dia);
            fecha.setHours(hora, 0, 0, 0);
            
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            cell.dataset.fecha = fecha.toISOString();
            cell.onclick = () => nuevoEvento(fecha);
            
            // Filtrar eventos que caen en esta celda
            const eventosEnCelda = eventos.filter(e => {
                const inicio = new Date(e.fecha_inicio);
                const fin = new Date(e.fecha_fin);
                return inicio <= fecha && fin > fecha;
            });
            
            // Agregar eventos a la celda
            eventosEnCelda.forEach(evento => {
                const eventoDiv = document.createElement('div');
                eventoDiv.className = 'evento';
                eventoDiv.style.backgroundColor = evento.color;
                eventoDiv.textContent = evento.titulo;
                eventoDiv.onclick = (e) => {
                    e.stopPropagation();
                    editarEvento(evento);
                };
                cell.appendChild(eventoDiv);
            });
            
            grid.appendChild(cell);
        }
    }
}

// Obtener el primer día de una semana específica
function obtenerPrimerDiaSemana(año, semana) {
    const simple = new Date(año, 0, 1 + (semana - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

// Abrir modal para crear nuevo evento
function nuevoEvento(fecha = null) {
    eventoEditando = null;
    document.getElementById('modalTitulo').textContent = 'Nueva Actividad';
    document.getElementById('formEvento').reset();
    document.getElementById('btnEliminar').style.display = 'none';
    
    // Si se hizo clic en una celda, usar esa fecha
    if (fecha) {
        document.getElementById('eventoFechaInicio').value = formatearFechaInput(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setHours(fecha.getHours() + 1);
        document.getElementById('eventoFechaFin').value = formatearFechaInput(fechaFin);
    }
    
    // Seleccionar el primer color por defecto
    document.querySelectorAll('.color-option')[0].click();
    document.getElementById('modalEvento').classList.add('active');
}

// Abrir modal para editar evento existente
function editarEvento(evento) {
    eventoEditando = evento;
    document.getElementById('modalTitulo').textContent = 'Editar Actividad';
    document.getElementById('eventoTitulo').value = evento.titulo;
    document.getElementById('eventoDescripcion').value = evento.descripcion;
    document.getElementById('eventoFechaInicio').value = formatearFechaInput(new Date(evento.fecha_inicio));
    document.getElementById('eventoFechaFin').value = formatearFechaInput(new Date(evento.fecha_fin));
    
    // Seleccionar el color del evento
    const colorIndex = colores.indexOf(evento.color);
    if (colorIndex !== -1) {
        document.querySelectorAll('.color-option')[colorIndex].click();
    }
    
    document.getElementById('btnEliminar').style.display = 'block';
    document.getElementById('modalEvento').classList.add('active');
}

// Formatear fecha para input datetime-local
function formatearFechaInput(fecha) {
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minuto = fecha.getMinutes().toString().padStart(2, '0');
    return `${año}-${mes}-${dia}T${hora}:${minuto}`;
}

// Guardar evento (crear o actualizar)
async function guardarEvento(e) {
    e.preventDefault();
    
    const colorSeleccionado = document.querySelector('.color-option.selected');
    
    const datos = {
        titulo: document.getElementById('eventoTitulo').value,
        descripcion: document.getElementById('eventoDescripcion').value,
        fecha_inicio: document.getElementById('eventoFechaInicio').value,
        fecha_fin: document.getElementById('eventoFechaFin').value,
        color: colorSeleccionado ? colorSeleccionado.style.backgroundColor : colores[0],
        completado: false
    };
    
    try {
        let response;
        if (eventoEditando) {
            // Actualizar evento existente
            response = await fetch(`/api/eventos/${eventoEditando.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            // Crear nuevo evento
            response = await fetch('/api/eventos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }
        
        if (response.ok) {
            cerrarModal();
            cargarEventos();
        } else {
            alert('Error al guardar el evento');
        }
    } catch (error) {
        console.error('Error al guardar evento:', error);
        alert('Error al guardar el evento');
    }
}

// Eliminar evento
async function eliminarEvento() {
    if (!eventoEditando || !confirm('¿Estás seguro de eliminar esta actividad?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/eventos/${eventoEditando.id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            cerrarModal();
            cargarEventos();
        } else {
            alert('Error al eliminar el evento');
        }
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        alert('Error al eliminar el evento');
    }
}

// Cerrar modal de evento
function cerrarModal() {
    document.getElementById('modalEvento').classList.remove('active');
}

// Abrir modal para copiar semana
function copiarSemana() {
    const [año, semana] = document.getElementById('semanaActual').value.split('-W');
    const primerDia = obtenerPrimerDiaSemana(parseInt(año), parseInt(semana));
    document.getElementById('fechaDestino').value = formatearFechaInput(primerDia).split('T')[0];
    document.getElementById('modalCopiar').classList.add('active');
}

// Confirmar y ejecutar copia de eventos
async function confirmarCopia() {
    const [año, semana] = document.getElementById('semanaActual').value.split('-W');
    const primerDia = obtenerPrimerDiaSemana(parseInt(año), parseInt(semana));
    const ultimoDia = new Date(primerDia);
    ultimoDia.setDate(ultimoDia.getDate() + 6);
    ultimoDia.setHours(23, 59, 59);
    
    // Obtener todos los eventos de la semana actual
    const eventosSemanales = eventos.filter(e => {
        const inicio = new Date(e.fecha_inicio);
        return inicio >= primerDia && inicio <= ultimoDia;
    });
    
    if (eventosSemanales.length === 0) {
        alert('No hay actividades en esta semana para copiar');
        return;
    }
    
    const fechaDestino = document.getElementById('fechaDestino').value + 'T00:00:00';
    const repetirSemanas = parseInt(document.getElementById('repetirSemanas').value);
    
    try {
        const response = await fetch('/api/eventos/copiar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventos_ids: eventosSemanales.map(e => e.id),
                fecha_destino: fechaDestino,
                repetir_semanas: repetirSemanas
            })
        });
        
        if (response.ok) {
            cerrarModalCopiar();
            cargarEventos();
            alert(`✅ Se copiaron ${eventosSemanales.length} actividades para ${repetirSemanas} semana(s)`);
        } else {
            alert('Error al copiar actividades');
        }
    } catch (error) {
        console.error('Error al copiar eventos:', error);
        alert('Error al copiar actividades');
    }
}

// Cerrar modal de copiar
function cerrarModalCopiar() {
    document.getElementById('modalCopiar').classList.remove('active');
}

console.log('app.js cargado correctamente ✓');