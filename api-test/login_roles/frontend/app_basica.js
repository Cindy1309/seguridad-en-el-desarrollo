    
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

    } catch (error) {
        window.location.href = 'login.html';
    }
});


        

    // Referencias DOM
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

    
    inputFecha.min = new Date().toISOString().split('T')[0];

    
    btnNuevo.addEventListener('click', prepararModoCrear);


    formProyecto.addEventListener('submit', guardarOActualizar);

    const token = localStorage.getItem('token');

    function getHeaders() {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    
    async function cargarProyectos() {
        try {
            const response = await fetch('/api/proyectos', {
                headers: getHeaders()
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                alert(err.error || 'Error al cargar proyectos');
                return;
            }

            const proyectos = await response.json();
            mostrarProyectos(proyectos);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar proyectos');
        }
    }

    function mostrarProyectos(proyectos) {
        listaProyectos.innerHTML = '';

        if (!Array.isArray(proyectos) || proyectos.length === 0) {
            sinProyectos.style.display = 'block';
            return;
        }

        sinProyectos.style.display = 'none';

        proyectos.forEach((p) => {
            const clasePrioridad = p.prioridad;
            const fechaFormateada = new Date(p.fecha).toLocaleDateString('es-ES');

            const proyectoHTML = `
                <div class="card ${clasePrioridad}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title mb-1">${p.nombre}</h5>
                                <p class="card-text mb-2">${p.descripcion || 'Sin descripción'}</p>
                                <div class="d-flex gap-2 align-items-center">
                                    <span class="badge bg-secondary">${p.prioridad}</span>
                                    <small class="text-muted">${fechaFormateada}</small>
                                </div>
                            </div>
                        <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-outline-primary ${localStorage.getItem('rol') !== 'admin' ? 'disabled' : ''}"
                                        onclick='abrirEditar(${JSON.stringify(p)})'>
                                        Editar
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger ${localStorage.getItem('rol') !== 'admin' ? 'disabled' : ''}"
                                        onclick="eliminarProyecto(${p.id})">
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

    
    async function guardarOActualizar(event) {
        event.preventDefault();

        const id = inputId.value;
        const proyecto = {
            nombre: inputNombre.value.trim(),
            descripcion: inputDescripcion.value.trim(),
            fecha: inputFecha.value,
            prioridad: inputPrioridad.value
        };

        try {
            let response;
            if (!id) {
                response = await fetch('/api/proyectos', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(proyecto)
                });
            } else {
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

    function abrirEditar(proyecto) {
        inputId.value = proyecto.id;
        inputNombre.value = proyecto.nombre || '';
        inputDescripcion.value = proyecto.descripcion || '';
        inputFecha.value = (proyecto.fecha || '').split('T')[0];
        inputPrioridad.value = proyecto.prioridad || '';

        modalTitulo.textContent = 'Editar Proyecto';
        btnGuardar.textContent = 'Actualizar';

        const modal = new bootstrap.Modal(document.getElementById('modalProyecto'));
        modal.show();
    }

    function prepararModoCrear() {
        inputId.value = '';
        formProyecto.reset();
        modalTitulo.textContent = 'Nuevo Proyecto';
        btnGuardar.textContent = 'Guardar';
    }

    async function eliminarProyecto(id) {
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

    
    function irAlMenu() {
        window.location.href = 'index.html';
    }

    function irAPractica(tipo) {
        switch (tipo) {
            case 'basica':
                window.location.href = 'proyectos_basica.html';
                break;
            case 'imagenes':
                window.location.href = 'proyectos.html';
                break;
            case 'responsables':
                window.location.href = 'proyectos_responsables.html';
                break;
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        window.location.href = 'login.html';
    }