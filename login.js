/* ==========================================================================
   SISTEMA INTERACTIVO DE LOGIN Y CANVAS ANIMADO (2026)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    iniciarParticulasFondo();
    configurarTogglePassword();
    configurarFormularioLogin();
});

/* 1. SISTEMA DE PARTÍCULAS INTERACTIVAS (CANVAS NEÓN) */
function iniciarParticulasFondo() {
    const canvas = document.getElementById("canvasParticulas");
    const ctx = canvas.getContext("2d");

    let ancho = canvas.width = window.innerWidth;
    let alto = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        ancho = canvas.width = window.innerWidth;
        alto = canvas.height = window.innerHeight;
    });

    const particulas = [];
    const numParticulas = window.innerWidth < 768 ? 30 : 60;

    for (let i = 0; i < numParticulas; i++) {
        particulas.push({
            x: Math.random() * ancho,
            y: Math.random() * alto,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            radio: Math.random() * 2 + 1,
            color: Math.random() > 0.5 ? '#00f0ff' : '#7000ff'
        });
    }

    function animar() {
        ctx.clearRect(0, 0, ancho, alto);

        particulas.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > ancho) p.vx *= -1;
            if (p.y < 0 || p.y > alto) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();

            for (let j = index + 1; j < particulas.length; j++) {
                const p2 = particulas[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animar);
    }

    animar();
}

/* 2. MOSTRAR / OCULTAR CONTRASEÑA */
function configurarTogglePassword() {
    const toggleBtn = document.getElementById("togglePassword");
    const inputClave = document.getElementById("inputClave");

    toggleBtn.addEventListener("click", () => {
        const esPassword = inputClave.type === "password";
        inputClave.type = esPassword ? "text" : "password";
        toggleBtn.classList.toggle("fa-eye", !esPassword);
        toggleBtn.classList.toggle("fa-eye-slash", esPassword);
    });
}

/* 3. LÓGICA DE VALIDACIÓN Y REDIRECCIÓN A OTRO HTML */
function configurarFormularioLogin() {
    const form = document.getElementById("loginForm");
    const btnTexto = document.getElementById("btnTexto");
    const btnSpinner = document.getElementById("btnSpinner");
    const iconoBtn = form.querySelector(".icono-btn");
    const mensaje = document.getElementById("mensajeFeedback");
    const tarjeta = document.querySelector(".tarjeta-login");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const usuario = document.getElementById("inputUsuario").value.trim();
        const clave = document.getElementById("inputClave").value.trim();

        // Ocultar mensajes anteriores
        mensaje.classList.add("oculto");
        tarjeta.classList.remove("shake");

        // Estado de Carga (Spinner)
        btnTexto.textContent = "VERIFICANDO...";
        iconoBtn.classList.add("oculto");
        btnSpinner.classList.remove("oculto");

        setTimeout(() => {
            btnSpinner.classList.add("oculto");

            // Validación de credenciales solicitadas
            if (usuario === "admin" && clave === "1234") {
                btnTexto.textContent = "¡ACCESO CONCEDIDO!";
                mostrarFeedback("Autenticación exitosa. Redireccionando...", "exito");
                
                // Redirigir a tu otro archivo HTML (Asegúrate de que se llame index.html o cambia el nombre)
                setTimeout(() => {
                    window.location.href = "sistema.html"; 
                }, 1000);

            } else {
                btnTexto.textContent = "INICIAR SESIÓN";
                iconoBtn.classList.remove("oculto");
                mostrarFeedback("Usuario o contraseña incorrectos.", "error");
                
                // Efecto visual de error (Shake)
                tarjeta.classList.add("shake");
            }
        }, 1500);
    });
}

function mostrarFeedback(txt, tipo) {
    const mensaje = document.getElementById("mensajeFeedback");
    mensaje.textContent = txt;
    mensaje.className = `mensaje-alerta ${tipo}`;
}