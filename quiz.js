/* ==========================================================================
   QUIZ INTERACTIVO CON RETROALIMENTACIÓN Y NUEVO INTENTO (FIABLE)
   ========================================================================== */

const bancoPreguntasBase = [
    {
        pregunta: "¿Qué es una factura según el material de estudio?",
        opciones: ["Un inventario de bodega", "Un comprobante de venta legal", "Un registro interno del programador"],
        respuesta: 1
        
    },
    {
        pregunta: "¿Qué hace esencialmente un sistema automatizado de facturación?",
        opciones: ["Gestionar ventas, calcular impuestos y emitir comprobantes", "Controlar la velocidad del internet", "Editar el diseño gráfico de los productos"],
        respuesta: 0
    },
    {
        pregunta: "Si compras 5 libretas a un precio unitario de $3.00, ¿cuál es la fórmula y el valor correcto del Subtotal?",
        opciones: ["Subtotal = Cantidad + Precio = $8.00", "Subtotal = Cantidad × Precio = $15.00", "Subtotal = Cantidad / Precio = $1.66"],
        respuesta: 1
    },
    {
        pregunta: "¿Qué es el Subtotal general en una factura con múltiples ítems?",
        opciones: ["La suma de los subtotales de cada producto antes de aplicar impuestos", "El precio del producto más caro comprado", "El valor del IVA multiplicado por la cantidad"],
        respuesta: 0
    },
    {
        pregunta: "De acuerdo con la legislación en Ecuador descrita en la app, ¿cuál es la tarifa general del IVA para tecnología y bienes procesados?",
        opciones: ["12%", "0%", "15%"],
        respuesta: 2
    },
    {
        pregunta: "¿Qué tipo de productos básicos cuentan con tarifa 0% de IVA para proteger la economía familiar?",
        opciones: ["Alimentos frescos, educación y transporte", "Licores, tecnología y ropa importada", "Herramientas y repuestos de vehículos"],
        respuesta: 0
    },
    {
        pregunta: "FÓRMULA: Si una factura presenta un Subtotal de $200.00 y aplica el IVA general (15%), ¿cuál es la ecuación para calcular el valor del IVA en dólares?",
        opciones: ["IVA = $200.00 + 0.15 = $200.15", "IVA = $200.00 × 0.15 = $30.00", "IVA = $200.00 / 15 = $13.33"],
        respuesta: 1
    },
    {
        pregunta: "FÓRMULA COMPLETA: Si un producto tiene un precio 'P' y graba un porcentaje de IVA 'I', ¿cuál es la expresión matemática correcta para el Total Neto (T)?",
        opciones: ["T = P + (P × (I / 100))", "T = P × I", "T = (P + I) / 100"],
        respuesta: 0
    },
    {
        pregunta: "LÓGICA DEL CÓDIGO: En tu archivo 'facturacion.js', el artículo 'Pan' está configurado con 'iva: false'. Si compras un pan de $0.50, ¿cuál será el IVA cobrado?",
        opciones: ["$0.08 (aplica 15%)", "$0.00 (exento de impuesto)", "$0.50 (duplica el valor)"],
        respuesta: 1
    },
    {
        pregunta: "APLICACIÓN PRÁCTICA: Si registras en el sistema un producto de construcción a $10.00 con la tarifa diferenciada del 5%, ¿cuánto sumará el sistema por concepto de IVA?",
        opciones: ["$1.50", "$5.00", "$0.50"],
        respuesta: 2
    }
];

let preguntasActuales = [];

function cargarPreguntas() {
    let contenedor = document.getElementById("contenedorQuiz");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";
    
    // Controlar visibilidad de botones al iniciar o reiniciar
    let btnEnviar = document.getElementById("btnEnviar");
    let btnReiniciar = document.getElementById("btnReiniciar");
    let txtResultado = document.getElementById("resultado");
    
    if (btnEnviar) btnEnviar.style.display = "block";
    if (btnReiniciar) btnReiniciar.style.display = "none";
    if (txtResultado) txtResultado.innerHTML = "";

    // Mezclar el banco de preguntas principal
    preguntasActuales = [...bancoPreguntasBase].sort(() => Math.random() - 0.5);

    preguntasActuales.forEach((p, indexPregunta) => {
        let div = document.createElement("div");
        div.className = "card";
        div.style.borderLeft = "5px solid #1f3c88";
        div.style.marginBottom = "20px";
        div.style.padding = "15px";

        // Mezclar las respuestas de esta pregunta de forma independiente
        let opcionesMezcladas = p.opciones.map((texto, i) => ({ texto: texto, originalIndex: i }));
        opcionesMezcladas.sort(() => Math.random() - 0.5);

        div.innerHTML = `
            <p style="font-weight: bold; color: #0b2c81; margin-bottom: 10px;">${indexPregunta + 1}. ${p.pregunta}</p>
            <div id="grupo_p${indexPregunta}">
                ${opcionesMezcladas.map((op) => `
                    <label id="label_p${indexPregunta}_o${op.originalIndex}" style="display: block; margin: 8px 0; cursor: pointer; padding: 8px; border-radius: 5px; background: #f8fafc; border: 1px solid #e2e8f0;">
                        <input type="radio" name="p${indexPregunta}" value="${op.originalIndex}" style="width: auto; margin-right: 10px; cursor: pointer;">
                        ${op.texto}
                    </label>
                `).join("")}
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function corregir() {
    let respuestasCorrectas = 0;
    let totalPreguntas = preguntasActuales.length;

    preguntasActuales.forEach((p, indexPregunta) => {
        let seleccion = document.querySelector(`input[name="p${indexPregunta}"]:checked`);
        let respuestaCorrectaOriginal = p.respuesta;

        // Resaltar la respuesta correcta en color verde
        let labelCorrecto = document.getElementById(`label_p${indexPregunta}_o${respuestaCorrectaOriginal}`);
        if (labelCorrecto) {
            labelCorrecto.style.background = "#d1fae5"; 
            labelCorrecto.style.borderColor = "#10b981";
            labelCorrecto.style.fontWeight = "bold";
            labelCorrecto.innerHTML += "  ✓ (Correcta)";
        }

        if (seleccion) {
            let valorRespondido = parseInt(seleccion.value);
            if (valorRespondido === respuestaCorrectaOriginal) {
                respuestasCorrectas++;
            } else {
                // Si falló, pintar de rojo la opción que marcó
                let labelIncorrecto = document.getElementById(`label_p${indexPregunta}_o${valorRespondido}`);
                if (labelIncorrecto) {
                    labelIncorrecto.style.background = "#fee2e2"; 
                    labelIncorrecto.style.borderColor = "#ef4444";
                    labelIncorrecto.innerHTML += "  ✗ (Tu respuesta)";
                }
            }
        }

        // Bloquear respuestas
        let inputs = document.getElementsByName(`p${indexPregunta}`);
        inputs.forEach(input => input.disabled = true);
    });

    let puntajeFinal = (respuestasCorrectas / totalPreguntas) * 100;
    let elementoResultado = document.getElementById("resultado");
    if (elementoResultado) {
        elementoResultado.innerHTML = `
            <div style="padding: 20px; background: #e0f2fe; border: 2px solid #0284c7; border-radius: 8px; color: #0369a1; text-align: center; margin-top: 20px;">
                <p style="font-size: 1.1em;">Has acertado <b>${respuestasCorrectas}</b> de <b>${totalPreguntas}</b> preguntas.</p>
                <span style="font-size: 1.6em; font-weight: bold;">Calificación Final: ${puntajeFinal.toFixed(2)} / 100</span>
            </div>
        `;
        elementoResultado.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById("btnEnviar").style.display = "none";
    document.getElementById("btnReiniciar").style.display = "block";
}

function reiniciarQuiz() {
    cargarPreguntas();
    document.getElementById("quiz").scrollIntoView({ behavior: 'smooth' });
}

// ESTA LÍNEA ASEGURA QUE SE CARGUE SIN IMPORTAR LO QUE DIGAN LOS OTROS ARCHIVOS
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cargarPreguntas);
} else {
    cargarPreguntas();
}