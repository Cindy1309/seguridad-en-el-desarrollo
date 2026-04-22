const formLogin = document.getElementById('formLogin');
const msg = document.getElementById('msg');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    msg.textContent = 'Validando...';
    msg.style.color = 'blue';

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    
    console.log('Datos enviados:', { usuario, password });

    if (!usuario || !password) {
        msg.textContent = 'Usuario y password requeridos';
        msg.style.color = 'red';
        return;
    }

    try {
        const resp = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', 
            body: JSON.stringify({ usuario, password })
        });

        const data = await resp.json();
        console.log('Respuesta servidor:', data);

        if (!resp.ok) {
            msg.textContent = data.error || 'Error del servidor';
            msg.style.color = 'red';
            return;
        }

        msg.textContent = `¡Bienvenido ${data.usuario}!`;
        msg.style.color = 'green';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        msg.textContent = 'Error de conexión';
        msg.style.color = 'red';
    }
});