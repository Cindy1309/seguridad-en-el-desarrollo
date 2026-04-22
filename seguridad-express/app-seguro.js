console.log("Versión SEGURA cargada");

document.getElementById('formulario').addEventListener('submit', function(e) {
    e.preventDefault();

    const entrada = document.getElementById('comentario').value;
    const resultado = document.getElementById('resultado');

    const parrafo = document.createElement('p');
    parrafo.textContent = entrada; // Sanitiza la entrada

    resultado.innerHTML = ''; // Limpia resultado anterior
    resultado.appendChild(parrafo);
});