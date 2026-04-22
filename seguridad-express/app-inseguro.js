console.log("Versión INSEGURA cargada ");

document.getElementById('formulario').addEventListener('submit', function(e) {
  e.preventDefault();

  const entrada = document.getElementById('comentario').value;
  const resultado = document.getElementById('resultado');

  resultado.innerHTML = "<p>" + entrada + "</p>";
});