const form = document.getElementById("formulario-nombre");
const inputNombre = document.getElementById("nombre-usuario");
const mensajeSalida = document.getElementById("mensaje-saludo");

function procesarFormulario(event) {
    event.preventDefault();

    const nombre = inputNombre.value.trim();

    if (nombre === "") {
        alert("El nombre no puede estar vacio");
        return false;
    }

    mensajeSalida.textContent = `Hola, ${nombre}`;

    inputNombre.value = "";
}
form.addEventListener("submit", procesarFormulario);

mensajeSalida.addEventListener("mouseover", () => {
    if (mensajeSalida.textContent !== "") {
        mensajeSalida.style.color = "blue"; 
        mensajeSalida.style.cursor = "pointer";
    }
});

mensajeSalida.addEventListener("mouseout", () => {
    mensajeSalida.style.color = "black";
});