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