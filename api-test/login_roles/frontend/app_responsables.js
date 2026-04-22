// Verificar autenticación al cargar
   window.addEventListener('load', async function () {

    try {
        const response = await fetch('/api/proyectos', {
            method: 'GET',
            credentials: 'include' 
        });

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const usuario = localStorage.getItem('usuario');
        const rol = localStorage.getItem('rol');

        document.getElementById('userInfo').textContent = `${usuario} (${rol})`;

        cargarProyectos();
        cargarResponsables();

    } catch (error) {
        window.location.href = 'login.html';
    }
});

const listaProyectos = document.getElementById('listaProyectos');
const sinProyectos = document.getElementById('sinProyectos');
const formProyecto = document.getElementById('formProyecto');
const modalTitulo = document.getElementById('modalTitulo');
const btnGuardar = document.getElementById('btnGuardar');
const btnNuevo = document.getElementById('btnNuevo');

const inputId = document.getElementById('proyectoId');
const inputNombre = document.getElementById('nombre');
const inputDescripcion = document.getElementById('descripcion');
const inputFecha = document.getElementById('fecha');
const inputPrioridad = document.getElementById('prioridad');
const selectRespo = document.getElementById('responsables');

// Fecha mínima hoy
inputFecha.min = new Date().toISOString().split('T')[0];

// Botón Nuevo
btnNuevo.addEventListener('click', prepararModoCrear);

// Submit form
formProyecto.addEventListener('submit', guardarOActualizar);

const token = localStorage.getItem('token');

// Headers comunes con auth
function getHeaders() {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// GET proyectos (con JOIN ya hecho en backend)
async function cargarProyectos() {
    try {
        const response = await fetch('/api/proyectos', {
            headers: getHeaders()
        });
        
        if (!response.ok) {
            const err = await response.json();
            console.error('Error API:', err);
            alert('Error: ' + (err.error || 'No autorizado'));
            return;
        }
        
        const proyectos = await response.json();
        mostrarProyectos(proyectos);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar proyectos');
    }
}

// GET responsables
async function cargarResponsables() {
    try {
        const response = await fetch('/api/responsables', {
            headers: getHeaders()
        });
        
        if (!response.ok) {
            const err = await response.json();
            console.error('Error responsables:', err);
            selectRespo.innerHTML = '<option value="">Error cargando responsables</option>';
            return;
        }
        
        const responsables = await response.json();
        selectRespo.innerHTML = '<option value="">Selecciona responsable</option>';
        
        responsables.forEach(r => {
            const option = document.createElement('option');
            option.value = r.id;
            option.textContent = `${r.nombre} (${r.puesto})`;
            selectRespo.appendChild(option);
        });
    } catch (error) {
        console.error('Error responsables:', error);
        selectRespo.innerHTML = '<option value="">Error cargando</option>';
    }
}

// Mostrar proyectos
function mostrarProyectos(proyectos) {
    listaProyectos.innerHTML = '';
    
    if (proyectos.length === 0) {
        sinProyectos.style.display = 'block';
        return;
    }
    
    sinProyectos.style.display = 'none';
    
    proyectos.forEach((p) => {
        const clasePrioridad = p.prioridad;
        const fechaFormateada = new Date(p.fecha).toLocaleDateString('es-ES');
        const responsableTexto = p.responsable_nombre ? 
            `${p.responsable_nombre} (${p.responsable_puesto})` : 'Sin responsable';
        
        const proyectoHTML = `
        <div class="card" style="border-left: 5px solid ${clasePrioridad === 'alta' ?
             '#dc3545' : clasePrioridad === 'media' ? '#ffc107' : '#28a745'}; margin-bottom: 15px;">
            <div class="card ${clasePrioridad}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title mb-1">${p.nombre}</h5>
                            <p class="card-text mb-2">${p.descripcion || 'Sin descripción'}</p>
                            <div class="d-flex gap-2 align-items-center mb-2">
                                <span class="badge bg-secondary">${p.prioridad}</span>
                                <small class="text-muted">${fechaFormateada}</small>
                                <span class="badge bg-secondary">${responsableTexto}</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary"
                                onclick='abrirEditar(${JSON.stringify(p)})'
                                ${localStorage.getItem('rol') !== 'admin' ? 'disabled' : ''}>
                                Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger"
                                onclick="eliminarProyecto(${p.id})"
                                ${localStorage.getItem('rol') !== 'admin' ? 'disabled' : ''}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        listaProyectos.innerHTML += proyectoHTML;
    });
}

// CREATE o UPDATE
async function guardarOActualizar(event) {
    event.preventDefault();
    
    const id = inputId.value;
    const proyecto = {
        nombre: inputNombre.value.trim(),
        descripcion: inputDescripcion.value.trim(),
        fecha: inputFecha.value,
        prioridad: inputPrioridad.value,
        responsable_id: selectRespo.value
    };
    
    try {
        let response;
        
        if (!id) {
            // POST
            response = await fetch('/api/proyectos', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(proyecto)
            });
        } else {
            // PUT
            response = await fetch(`/api/proyectos/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(proyecto)
            });
        }
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Error en la operación');
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProyecto'));
        modal.hide();
        formProyecto.reset();
        inputId.value = '';
        
        await cargarProyectos();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al guardar/editar');
    }
}

// Editar
function abrirEditar(proyecto) {
    inputId.value = proyecto.id;
    inputNombre.value = proyecto.nombre || '';
    inputDescripcion.value = proyecto.descripcion || '';
    inputFecha.value = (proyecto.fecha || '').split('T')[0];
    inputPrioridad.value = proyecto.prioridad || '';
    selectRespo.value = proyecto.responsable_id || '';
    
    modalTitulo.textContent = 'Editar Proyecto';
    btnGuardar.textContent = 'Actualizar';
    
    const modal = new bootstrap.Modal(document.getElementById('modalProyecto'));
    modal.show();
}

// Modo crear
function prepararModoCrear() {
    inputId.value = '';
    formProyecto.reset();
    modalTitulo.textContent = 'Nuevo Proyecto';
    btnGuardar.textContent = 'Guardar';
}

// DELETE
async function eliminarProyecto(id) {
    if (localStorage.getItem('rol') !== 'admin') {
        alert('Solo admin puede eliminar');
        return;
    }
    
    const ok = confirm('¿Seguro que deseas eliminar este proyecto?');
    if (!ok) return;
    
    try {
        const response = await fetch(`/api/proyectos/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Error al eliminar');
        }
        
        await cargarProyectos();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al eliminar');
    }
}

// Logout igual que en index.html
function logout() {
    
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    window.location.href = 'login.html';
}

function irAlMenu() {
    window.location.href = 'index.html';
}