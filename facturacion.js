let ultimoProductoEliminado = null;
let productos = []; // Productos agregados a la factura actual
let totalGeneralGlobal = 0; // Total acumulado en dinero de la compra activa

// CREDENCIALES DE ACCESO A CONTABILIDAD
const CREDANCIALES_CONTABILIDAD = {
    usuario: "admin",
    clave: "1234"
};
let accesoContabilidadConcedido = false;

// PERSISTENCIA DE PRODUCTOS (CON / SIN IVA)
const productosPorDefecto = [
  { nombre: "Arroz", precio: 2.50, iva: true },
  { nombre: "Leche", precio: 1.20, iva: true },
  { nombre: "Pan", precio: 0.50, iva: false },
  { nombre: "Queso", precio: 3.00, iva: true },
  { nombre: "Agua", precio: 0.80, iva: false }
];

let listaProductos = JSON.parse(localStorage.getItem("productos_sistema")) || productosPorDefecto;

function mostrarTodos() {
    pintarProductos(listaProductos);
}

function mostrarConIva() {
    pintarProductos(listaProductos.filter(p => p.iva));
}

function mostrarSinIva() {
    pintarProductos(listaProductos.filter(p => !p.iva));
}

let indiceEditando = null;

function pintarProductos(lista) {
    let contenido = "";
    for (let i = 0; i < lista.length; i++) {
        let ivaPorcentaje = lista[i].iva ? 15 : 0;
        let ivaValor = lista[i].precio * (ivaPorcentaje / 100);
        let total = lista[i].precio + ivaValor;

        if (indiceEditando === i) {
            contenido += `
            <tr>
                <td>
                    <input type="text" id="editNombre" value="${lista[i].nombre}" style="width: 90%; padding: 4px;">
                </td>
                <td>
                    <input type="number" id="editPrecio" step="0.01" value="${lista[i].precio}" style="width: 70%; padding: 4px;">
                </td>
                <td>
                    <select id="editIva" style="padding: 4px;">
                        <option value="true" ${lista[i].iva ? 'selected' : ''}>15%</option>
                        <option value="false" ${!lista[i].iva ? 'selected' : ''}>0%</option>
                    </select>
                </td>
                <td>$${ivaValor.toFixed(2)}</td>
                <td>$${total.toFixed(2)}</td>
                <td>
                    <button onclick="guardarEdicionProducto(${i})" style="background: #2ea44f; color: white; padding: 4px 8px; margin-right: 5px;">💾</button>
                    <button onclick="cancelarEdicionProducto()" style="background: #6e7681; color: white; padding: 4px 8px;">❌</button>
                </td>
            </tr>
            `;
        } else {
            contenido += `
            <tr>
                <td>${lista[i].nombre}</td>
                <td>$${lista[i].precio.toFixed(2)}</td>
                <td>${ivaPorcentaje}%</td>
                <td>$${ivaValor.toFixed(2)}</td>
                <td>$${total.toFixed(2)}</td>
                <td>
                    <button onclick="activarEdicionProducto(${i})" style="background: #0969da; color: white; padding: 4px 8px; margin-right: 5px;">✏️</button>
                    <button onclick="eliminarProductoLista('${lista[i].nombre}')" style="background: #cf222e; color: white; padding: 4px 8px;">X</button>
                </td>
            </tr>
            `;
        }
    }
    document.getElementById("tablaProductosLista").innerHTML = contenido;
}

function activarEdicionProducto(indice) {
    indiceEditando = indice;
    pintarProductos(listaProductos);
}

function cancelarEdicionProducto() {
    indiceEditando = null;
    pintarProductos(listaProductos);
}

function guardarEdicionProducto(indice) {
    let nuevoNombre = document.getElementById("editNombre").value.trim();
    let nuevoPrecio = parseFloat(document.getElementById("editPrecio").value);
    let nuevoIva = document.getElementById("editIva").value === "true";

    if (nuevoNombre === "" || isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        alert("Por favor, ingresa datos válidos.");
        return;
    }

    let existe = listaProductos.some((p, idx) => p.nombre.toLowerCase() === nuevoNombre.toLowerCase() && idx !== indice);
    if (existe) {
        alert("Ya existe otro producto con este nombre.");
        return;
    }

    listaProductos[indice] = {
        nombre: nuevoNombre,
        precio: nuevoPrecio,
        iva: nuevoIva
    };

    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));
    indiceEditando = null;
    
    pintarProductos(listaProductos);
    asignarAutocompletadoFactura(); 
    alert("Producto actualizado correctamente.");
}

function eliminarProductoLista(nombreProducto) {
    listaProductos = listaProductos.filter(p => p.nombre !== nombreProducto);
    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));
    pintarProductos(listaProductos);
}

function asignarAutocompletadoFactura() {
    let inputProductoFactura = document.getElementById("producto");
    if (!inputProductoFactura) return;

    inputProductoFactura.addEventListener("input", function() {
        let textoEscrito = this.value.trim().toLowerCase();
        let precioInput = document.getElementById("precio");
        let ivaSelectFactura = document.getElementById("iva");

        let productoEncontrado = listaProductos.find(p => p.nombre.toLowerCase() === textoEscrito);

        if (productoEncontrado) {
            precioInput.value = productoEncontrado.precio;
            if (ivaSelectFactura) {
                ivaSelectFactura.value = productoEncontrado.iva ? 15 : 0;
                calcularTotales();
            }
        }
    });
}

function agregarProducto() {
    let productoInput = document.getElementById("producto").value.trim();
    let cantidad = parseFloat(document.getElementById("cantidad").value);
    let precio = parseFloat(document.getElementById("precio").value);

    if (productoInput === "" || cantidad <= 0 || precio <= 0 || isNaN(cantidad) || isNaN(precio)) {
        alert("Complete los datos correctamente");
        return;
    }

    let productoEncontrado = listaProductos.find(p => p.nombre.toLowerCase() === productoInput.toLowerCase());
    let precioConIva = precio;

    if (productoEncontrado && productoEncontrado.iva) {
        precioConIva = precio * 1.15;
    }

    let subtotal = cantidad * precioConIva;

    productos.push({
        producto: productoInput,
        cantidad: cantidad,
        precio: precioConIva,
        subtotal: subtotal
    });

    pintarTabla();
    limpiarInputs();
}

function pintarTabla() {
    let contenido = "";
    for (let i = 0; i < productos.length; i++) {
        contenido += `
        <tr>
            <td>${productos[i].producto}</td>
            <td>${productos[i].cantidad}</td>
            <td>$ ${productos[i].precio.toFixed(2)}</td>
            <td>$ ${productos[i].subtotal.toFixed(2)}</td>
            <td>
                <button onclick="eliminarProducto(${i})">X</button>
            </td>
        </tr>
        `;
    }
    document.getElementById("tablaProductos").innerHTML = contenido;
    calcularTotales();
}

function eliminarProducto(posicion) {
    productos.splice(posicion, 1);
    pintarTabla();
}

function calcularTotales() {
    let totalGeneral = 0;
    for (let i = 0; i < productos.length; i++) {
        totalGeneral += productos[i].subtotal;
    }
    totalGeneralGlobal = totalGeneral;

    let subtotalSinIva = totalGeneral / 1.15;
    let valorIvaDesglosado = totalGeneral - subtotalSinIva;
    
    document.getElementById("subtotal").innerHTML = "$ " + subtotalSinIva.toFixed(2);
    document.getElementById("valorIva").innerHTML = "$ " + valorIvaDesglosado.toFixed(2);
    document.getElementById("total").innerHTML = "$ " + totalGeneral.toFixed(2);

    calcularVuelto();
}

function calcularVuelto() {
    let montoRecibidoInput = document.getElementById("montoRecibido");
    let spanVuelto = document.getElementById("vueltoCliente");

    if (!montoRecibidoInput || !spanVuelto) return;

    let pagoCliente = parseFloat(montoRecibidoInput.value) || 0;
    let vuelto = pagoCliente - totalGeneralGlobal;

    if (pagoCliente <= 0 || vuelto < 0) {
        spanVuelto.innerHTML = "$ 0.00";
    } else {
        spanVuelto.innerHTML = "$ " + vuelto.toFixed(2);
    }
}

function limpiarInputs() {
    document.getElementById("producto").value = "";
    document.getElementById("cantidad").value = 1;
    document.getElementById("precio").value = "";
}

// CONTROL DE SECCIONES CON BLOQUEO A CONTABILIDAD
function mostrarSeccion(id) {
    let modalLogin = document.getElementById("modalLoginContabilidad");

    if (id === "contabilidad" && !accesoContabilidadConcedido) {
        if (modalLogin) {
            modalLogin.style.display = "flex";
            document.getElementById("usuarioContabilidad").value = "";
            document.getElementById("claveContabilidad").value = "";
            document.getElementById("usuarioContabilidad").focus();
        }
        return;
    }

    let secciones = document.getElementsByClassName("seccion");
    for (let i = 0; i < secciones.length; i++) {
        secciones[i].style.display = "none";
    }

    let seccionSeleccionada = document.getElementById(id);
    if (seccionSeleccionada) {
        seccionSeleccionada.style.display = "block";
    }
}

function validarAccesoContabilidad() {
    let userInput = document.getElementById("usuarioContabilidad").value.trim();
    let passInput = document.getElementById("claveContabilidad").value.trim();

    if (userInput === CREDANCIALES_CONTABILIDAD.usuario && passInput === CREDANCIALES_CONTABILIDAD.clave) {
        accesoContabilidadConcedido = true;
        cerrarModalLogin();
        
        let secciones = document.getElementsByClassName("seccion");
        for (let i = 0; i < secciones.length; i++) {
            secciones[i].style.display = "none";
        }
        document.getElementById("contabilidad").style.display = "block";
        pintarHistorialContable();
    } else {
        alert("Usuario o contraseña incorrectos.");
        document.getElementById("claveContabilidad").value = "";
    }
}

function cerrarModalLogin() {
    let modalLogin = document.getElementById("modalLoginContabilidad");
    if (modalLogin) {
        modalLogin.style.display = "none";
    }
}

function cerrarSesionContabilidad() {
    accesoContabilidadConcedido = false;
    mostrarSeccion("facturacion");
    alert("Sesión de contabilidad cerrada.");
}

function evaluarTeclaLogin(event) {
    if (event.key === "Enter") {
        validarAccesoContabilidad();
    }
}

// VALIDACIONES ECUADOR Y FORMATOS
function validarNombreApellido(nombre) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,})*$/;
    return regex.test(nombre.trim());
}

function validarCedulaEcuador(cedula) {
    cedula = cedula.trim();
    if (cedula.length !== 10 || isNaN(cedula)) return false;
    const provincia = parseInt(cedula.substring(0, 2), 10);
    const tercerDigito = parseInt(cedula.charAt(2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;
    if (tercerDigito >= 6) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < coeficientes.length; i++) {
        let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
        if (valor >= 10) valor -= 9; 
        suma += valor;
    }
    const verificadorCalculado = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
    return verificadorCalculado === parseInt(cedula.charAt(9), 10);
}

function validarTelefonoEcuador(telefono) {
    const regex = /^(09\d{8}|0[2-7]\d{7})$/;
    return regex.test(telefono.trim());
}

function validarCorreo(correo) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo.trim());
}

function validarCamposCliente(nombre, cedula, telefono, correo) {
    if (!validarNombreApellido(nombre)) { alert("Nombre y Apellido inválidos."); return false; }
    if (!validarCedulaEcuador(cedula)) { alert("Cédula de Ecuador inválida."); return false; }
    if (!validarTelefonoEcuador(telefono)) { alert("Teléfono inválido."); return false; }
    if (!validarCorreo(correo)) { alert("Correo inválido."); return false; }
    return true;
}

// CLIENTES
let clientes = JSON.parse(localStorage.getItem("clientes_sistema")) || [];

function guardarCliente() {
    let nombre = document.getElementById("nombreCliente").value;
    let cedula = document.getElementById("cedulaCliente").value;
    let telefono = document.getElementById("telefonoCliente").value;
    let correo = document.getElementById("correoCliente").value;

    if (!validarCamposCliente(nombre, cedula, telefono, correo)) return; 

    if (clientes.some(c => c.cedula === cedula.trim())) {
        alert("Esta cédula ya está registrada.");
        return;
    }

    clientes.push({ nombre: nombre.trim(), cedula: cedula.trim(), telefono: telefono.trim(), correo: correo.trim() });
    localStorage.setItem("clientes_sistema", JSON.stringify(clientes));
    pintarClientes();
    limpiarClientes();
    alert("Cliente guardado.");
}

function buscarCliente() {
    let cedulaBuscar = document.getElementById("cedulaCliente").value;
    let encontrado = false;
    for (let i = 0; i < clientes.length; i++) {
        if (clientes[i].cedula === cedulaBuscar) {
            document.getElementById("nombreCliente").value = clientes[i].nombre;
            document.getElementById("telefonoCliente").value = clientes[i].telefono;
            document.getElementById("correoCliente").value = clientes[i].correo;
            encontrado = true;
        }
    }
    if (!encontrado) alert("Cliente no encontrado");
}

function modificarCliente() {
    let cedulaBuscar = document.getElementById("cedulaCliente").value;
    let nombre = document.getElementById("nombreCliente").value;
    let telefono = document.getElementById("telefonoCliente").value;
    let correo = document.getElementById("correoCliente").value;
    let encontrado = false;

    if (!validarCamposCliente(nombre, cedulaBuscar, telefono, correo)) return;

    for (let i = 0; i < clientes.length; i++) {
        if (clientes[i].cedula === cedulaBuscar) {
            clientes[i].nombre = nombre.trim();
            clientes[i].telefono = telefono.trim();
            clientes[i].correo = correo.trim();
            encontrado = true;
        }
    }
    if (encontrado) {
        localStorage.setItem("clientes_sistema", JSON.stringify(clientes));
        pintarClientes();
        limpiarClientes();
        alert("Cliente modificado");
    } else {
        alert("Cliente no encontrado");
    }
}

function pintarClientes() {
    let contenido = "";
    for (let i = 0; i < clientes.length; i++) {
        contenido += `<tr><td>${clientes[i].nombre}</td><td>${clientes[i].cedula}</td><td>${clientes[i].telefono}</td><td>${clientes[i].correo}</td><td><button onclick="eliminarCliente(${i})">X</button></td></tr>`;
    }
    document.getElementById("tablaClientes").innerHTML = contenido;
}

function eliminarCliente(posicion) {
    clientes.splice(posicion, 1);
    localStorage.setItem("clientes_sistema", JSON.stringify(clientes));
    pintarClientes();
}

function limpiarClientes() {
    document.getElementById("nombreCliente").value = "";
    document.getElementById("cedulaCliente").value = "";
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("correoCliente").value = "";
}

function buscarClienteFactura() {
    let cedulaBuscar = document.getElementById("cedula").value;
    let encontrado = false;
    if (cedulaBuscar === "") { alert("Ingrese una cédula."); return; }
    for (let i = 0; i < clientes.length; i++) {
        if (clientes[i].cedula === cedulaBuscar) {
            document.getElementById("cliente").value = clientes[i].nombre;
            document.getElementById("telefono").value = clientes[i].telefono;
            document.getElementById("correo").value = clientes[i].correo;
            encontrado = true;
            break; 
        }
    }
    if (!encontrado) alert("Cliente no registrado. Puede ingresarlo manualmente o dejarlo en blanco.");
}

// TEMA CLARO / OSCURO
function alternarTema() {
    const body = document.body;
    const boton = document.getElementById("btn-tema");
    body.classList.toggle("light-theme");
    if (body.classList.contains("light-theme")) {
        boton.innerHTML = "☀️ Modo Claro";
        localStorage.setItem("tema_sistema", "claro");
    } else {
        boton.innerHTML = "🌙 Modo Oscuro";
        localStorage.setItem("tema_sistema", "oscuro");
    }
}

(function cargarTemaGuardado() {
    const temaGuardado = localStorage.getItem("tema_sistema");
    if (temaGuardado === "claro") {
        document.body.classList.add("light-theme");
        setTimeout(() => { if(document.getElementById("btn-tema")) document.getElementById("btn-tema").innerHTML = "☀️ Modo Claro"; }, 50);
    }
})();

// CONTABILIDAD, GUARDADO Y CONTROL DE GANANCIAS
let historialContable = JSON.parse(localStorage.getItem("historial_contabilidad")) || [];

function guardarYLimpiarFactura() {
    if (productos.length === 0) {
        alert("No se puede guardar una factura sin productos.");
        return;
    }

    let inputCliente = document.getElementById("cliente").value.trim() || "Consumidor Final";
    let inputCedula = document.getElementById("cedula").value.trim() || "9999999999";

    let totalFactura = 0;
    for (let i = 0; i < productos.length; i++) {
        totalFactura += productos[i].subtotal;
    }

    let pagoCliente = parseFloat(document.getElementById("montoRecibido").value) || totalFactura;

    if (pagoCliente < totalFactura) {
        alert("El monto ingresado ($" + pagoCliente.toFixed(2) + ") es menor al total a pagar ($" + totalFactura.toFixed(2) + ").");
        return;
    }

    let vueltoEntregado = pagoCliente - totalFactura;
    let listadoProductosTexto = productos.map(p => `${p.producto} (x${p.cantidad})`).join(", ");

    historialContable.push({
        cliente: inputCliente,
        cedula: inputCedula,
        productos: listadoProductosTexto,
        total: totalFactura,
        pago: pagoCliente,
        vuelto: vueltoEntregado > 0 ? vueltoEntregado : 0
    });

    localStorage.setItem("historial_contabilidad", JSON.stringify(historialContable));
    pintarHistorialContable();

    alert(`¡Venta Guardada Exitosamente!\n-----------------------------\nCliente: ${inputCliente}\nTotal: $${totalFactura.toFixed(2)}\nRecibido: $${pagoCliente.toFixed(2)}\nVuelto a entregar: $${(vueltoEntregado > 0 ? vueltoEntregado : 0).toFixed(2)}`);

    productos = [];
    pintarTabla();
    
    document.getElementById("cedula").value = "";
    document.getElementById("cliente").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("montoRecibido").value = "";
    document.getElementById("vueltoCliente").innerHTML = "$ 0.00";
    limpiarInputs();
}

function pintarHistorialContable() {
    let contenido = "";
    let acumuladorGanancias = 0;

    for (let i = 0; i < historialContable.length; i++) {
        acumuladorGanancias += historialContable[i].total;
        let pagoText = historialContable[i].pago ? `$ ${historialContable[i].pago.toFixed(2)}` : "-";
        let vueltoText = historialContable[i].vuelto !== undefined ? `$ ${historialContable[i].vuelto.toFixed(2)}` : "-";

        contenido += `
        <tr>
            <td>${historialContable[i].cliente}</td>
            <td>${historialContable[i].cedula}</td>
            <td>${historialContable[i].productos}</td>
            <td>$ ${historialContable[i].total.toFixed(2)}</td>
            <td>${pagoText}</td>
            <td>${vueltoText}</td>
        </tr>
        `;
    }

    let tabla = document.getElementById("tablaHistorialContable");
    if (tabla) {
        tabla.innerHTML = contenido === "" ? "<tr><td colspan='6'>No hay facturas registradas.</td></tr>" : contenido;
    }
    let etiquetaTotal = document.getElementById("totalGananciasAcumuladas");
    if (etiquetaTotal) {
        etiquetaTotal.innerHTML = "$ " + acumuladorGanancias.toFixed(2);
    }
}

function vaciarHistorialContable() {
    if (confirm("¿Desea eliminar todo el historial contable?")) {
        historialContable = [];
        localStorage.removeItem("historial_contabilidad");
        pintarHistorialContable();
    }
}

function exportarContabilidadExcel() {
    if (historialContable.length === 0) return;
    let plantillaExcel = `<meta charset="utf-8"><table border="1"><tr style="background: #21262d; color: #58a6ff; font-weight: bold;"><th>Cliente</th><th>Cédula / RUC</th><th>Productos Agregados</th><th>Total Facturado ($)</th><th>Paga con ($)</th><th>Vuelto ($)</th></tr>`;
    for (let i = 0; i < historialContable.length; i++) {
        let pagoVal = historialContable[i].pago ? historialContable[i].pago.toFixed(2) : "0.00";
        let vueltoVal = historialContable[i].vuelto ? historialContable[i].vuelto.toFixed(2) : "0.00";
        plantillaExcel += `<tr><td>${historialContable[i].cliente}</td><td>${historialContable[i].cedula}</td><td>${historialContable[i].productos}</td><td>${historialContable[i].total.toFixed(2)}</td><td>${pagoVal}</td><td>${vueltoVal}</td></tr>`;
    }
    plantillaExcel += "</table>";

    let blob = new Blob([plantillaExcel], { type: "application/vnd.ms-excel" });
    let urlDescarga = URL.createObjectURL(blob);
    let tagEnlace = document.createElement("a");
    tagEnlace.href = urlDescarga;
    tagEnlace.download = "Reporte_Contabilidad_Ganancias.xls";
    document.body.appendChild(tagEnlace);
    tagEnlace.click();
    document.body.removeChild(tagEnlace);
}

// IMPRESIÓN EN PDF
function imprimirFacturaClientePDF() {
    if (productos.length === 0) {
        alert("No hay productos en la tabla para generar una factura.");
        return;
    }

    let txtCedula = document.getElementById("cedula").value.trim() || "9999999999";
    let txtCliente = document.getElementById("cliente").value.trim() || "Consumidor Final";
    let txtTelefono = document.getElementById("telefono").value.trim() || "S/N";
    let txtCorreo = document.getElementById("correo").value.trim() || "S/N";

    let valSubtotal = document.getElementById("subtotal").innerHTML;
    let valIva = document.getElementById("valorIva").innerHTML;
    let valTotal = document.getElementById("total").innerHTML;

    let pagoClienteInput = parseFloat(document.getElementById("montoRecibido").value) || totalGeneralGlobal;
    let vueltoClienteVal = pagoClienteInput - totalGeneralGlobal;

    let filasProductosHtml = "";
    for (let i = 0; i < productos.length; i++) {
        filasProductosHtml += `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${productos[i].producto}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${productos[i].cantidad}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$ ${productos[i].precio.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$ ${productos[i].subtotal.toFixed(2)}</td>
        </tr>
        `;
    }

    let ventanaImpresion = window.open("", "_blank");
    ventanaImpresion.document.write(`
    <html>
    <head>
        <title>Factura - ${txtCliente}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 40px; margin: 0; background-color: #fff; }
            .factura-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; }
            .encabezado { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f3c88; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-seccion h2 { color: #1f3c88; margin: 0; font-size: 28px; text-transform: uppercase; }
            .info-factura { text-align: right; font-size: 14px; line-height: 1.5; }
            .datos-cliente { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #1f3c88; }
            .datos-cliente h4 { margin: 0 0 10px 0; color: #1f3c88; text-transform: uppercase; }
            .grid-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #1f3c88; color: white; padding: 10px; font-size: 14px; }
            .seccion-totales { width: 320px; margin-left: auto; font-size: 15px; line-height: 2; }
            .fila-total { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; }
            .total-final { border-top: 2px solid #1f3c88; font-weight: bold; font-size: 18px; color: #1f3c88; }
            .pie { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="factura-box">
            <div class="encabezado">
                <div class="logo-seccion">
                    <h2>COREFACT S.A.</h2>
                    <p>Sistemas Inteligentes de Facturación</p>
                </div>
                <div class="info-factura">
                    <strong>RUC:</strong> 1792456789001<br>
                    <strong>Factura Nro:</strong> AUT-${Math.floor(100000 + Math.random() * 900000)}<br>
                    <strong>Fecha:</strong> ${new Date().toLocaleDateString()}<br>
                </div>
            </div>
            <div class="datos-cliente">
                <h4>Información del Cliente</h4>
                <div class="grid-datos">
                    <div><strong>Nombre:</strong> ${txtCliente}</div>
                    <div><strong>Cédula / RUC:</strong> ${txtCedula}</div>
                    <div><strong>Teléfono:</strong> ${txtTelefono}</div>
                    <div><strong>Correo:</strong> ${txtCorreo}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr><th>Descripción</th><th>Cantidad</th><th>P. Unitario</th><th>Total</th></tr>
                </thead>
                <tbody>${filasProductosHtml}</tbody>
            </table>
            <div class="seccion-totales">
                <div class="fila-total"><span>Subtotal Base:</span><span>${valSubtotal}</span></div>
                <div class="fila-total"><span>IVA Desglosado:</span><span>${valIva}</span></div>
                <div class="fila-total total-final"><span>TOTAL A PAGAR:</span><span>${valTotal}</span></div>
                <div class="fila-total"><span>Monto Recibido:</span><span>$ ${pagoClienteInput.toFixed(2)}</span></div>
                <div class="fila-total"><span>Vuelto / Cambio:</span><span>$ ${(vueltoClienteVal > 0 ? vueltoClienteVal : 0).toFixed(2)}</span></div>
            </div>
            <div class="pie"><p>Documento sin valor tributario legal - Ambiente de Desarrollo.</p></div>
        </div>
    </body>
    </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 350);
}

// INICIALIZACIÓN
pintarClientes();
pintarProductos(listaProductos);
asignarAutocompletadoFactura();
pintarHistorialContable();

function agregarProductoLista() {
    let inputNombre = document.getElementById("nuevoProducto").value.trim();
    let inputPrecio = parseFloat(document.getElementById("nuevoPrecio").value);
    let inputIva = document.getElementById("nuevoIva").value === "true";

    if (inputNombre === "" || isNaN(inputPrecio) || inputPrecio <= 0) {
        alert("Por favor, ingrese un nombre válido y un precio mayor a 0.");
        return;
    }

    let existe = listaProductos.some(p => p.nombre.toLowerCase() === inputNombre.toLowerCase());
    if (existe) {
        alert("Este producto ya está registrado en la lista.");
        return;
    }

    listaProductos.push({
        nombre: inputNombre,
        precio: inputPrecio,
        iva: inputIva
    });

    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));

    document.getElementById("nuevoProducto").value = "";
    document.getElementById("nuevoPrecio").value = "";
    document.getElementById("nuevoIva").value = "true";

    pintarProductos(listaProductos);
    asignarAutocompletadoFactura();

    alert("¡Producto guardado exitosamente en el sistema!");
}