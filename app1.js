const mainTitle = document.getElementById("titulo-principal");

const changeTitleButton = document.getElementById("btn-cambiar-titulo");

const resetTitleButton = document.getElementById("reinicia");

changeTitleButton.addEventListener("click", () => {
    
    mainTitle.textContent = "¡Asi funciona el DOM!";

    mainTitle.classList.add('text-success');
});

resetTitleButton.addEventListener("click", () => {
    
    mainTitle.textContent = "Hola Mundo";

    mainTitle.classList.remove('text-success');
});