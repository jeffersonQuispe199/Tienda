/* ==========================================================================
   SISTEMA DE FACTURACIÓN Y GESTIÓN DE INVENTARIOS CON FECHAS Y BÚSQUEDA
   ========================================================================== */

let productos = []; // Productos en la factura actual
let totalGeneralGlobal = 0; 
let productoLiquidoPendiente = null; // Variable temporal para el modal de líquidos

// MANTENIDO SIN CAMBIOS (APARTADO A): Credenciales de contabilidad
const CREDANCIALES_CONTABILIDAD = { usuario: "admin", clave: "1234" };
let accesoContabilidadConcedido = false;

// HELPER: OBTENER FECHA Y HORA ACTUAL (FORMATO AAAA-MM-DD HH:MM)
function obtenerFechaActual() {
    let ahora = new Date();
    let fecha = ahora.toISOString().split('T')[0];
    let hora = ahora.toTimeString().split(' ')[0].substring(0, 5);
    return `${fecha} ${hora}`;
}

// PRODUCTOS POR DEFECTO CON PROPIEDAD 'esLiquido'
const productosPorDefecto = [
  { codigo: "P001", nombre: "Arroz", precioCompra: 2.00, precioVenta: 2.50, cantidad: 50, stockMaximo: 100, iva: true, esLiquido: false },
  { codigo: "P002", nombre: "Leche 1L", precioCompra: 0.90, precioVenta: 1.20, cantidad: 30, stockMaximo: 100, iva: true, esLiquido: true },
  { codigo: "P003", nombre: "Pan", precioCompra: 0.35, precioVenta: 0.50, cantidad: 80, stockMaximo: 100, iva: false, esLiquido: false },
  { codigo: "P004", nombre: "Coca Cola 1.5L", precioCompra: 1.10, precioVenta: 1.50, cantidad: 25, stockMaximo: 50, iva: true, esLiquido: true },
  { codigo: "P005", nombre: "Agua Mineral 500ml", precioCompra: 0.25, precioVenta: 0.50, cantidad: 60, stockMaximo: 100, iva: false, esLiquido: true }
];

let listaProductos = JSON.parse(localStorage.getItem("productos_sistema")) || productosPorDefecto;

function mostrarTodos() { pintarProductos(listaProductos); }
function mostrarConIva() { pintarProductos(listaProductos.filter(p => p.iva)); }
function mostrarSinIva() { pintarProductos(listaProductos.filter(p => !p.iva)); }

// BÚSQUEDA EN TIEMPO REAL EN INVENTARIO
function buscarProductoInventario() {
    let filtro = document.getElementById("buscarInventarioInput").value.trim().toLowerCase();
    let filtrados = listaProductos.filter(p => 
        p.nombre.toLowerCase().includes(filtro) || 
        (p.codigo && p.codigo.toLowerCase().includes(filtro))
    );
    pintarProductos(filtrados);
}

let indiceEditando = null;

function pintarProductos(lista = listaProductos) {
    let contenido = "";
    for (let i = 0; i < lista.length; i++) {
        let pCompra = parseFloat(lista[i].precioCompra) || 0;
        let pVenta = parseFloat(lista[i].precioVenta) || parseFloat(lista[i].precio) || 0;
        let ganancia = pVenta - pCompra;
        let margenPorcentaje = pCompra > 0 ? ((ganancia / pCompra) * 100).toFixed(1) : "0.0";
        let ivaPorcentaje = lista[i].iva ? 15 : 0;
        let totalConIva = pVenta + (pVenta * (ivaPorcentaje / 100));

        if (indiceEditando === i) {
            contenido += `
            <tr>
                <td><input type="text" id="editCodigo" value="${lista[i].codigo || ''}" style="width: 70px;"></td>
                <td><input type="text" id="editNombre" value="${lista[i].nombre}" style="width: 90%;"></td>
                <td><input type="number" id="editPrecioCompra" step="0.01" value="${pCompra}" style="width: 60px;"></td>
                <td><input type="number" id="editPrecioVenta" step="0.01" value="${pVenta}" style="width: 60px;"></td>
                <td>-</td>
                <td>-</td>
                <td><input type="number" id="editCantidad" value="${lista[i].cantidad || 0}" style="width: 50px;"></td>
                <td>
                    <select id="editEsLiquido">
                        <option value="true" ${lista[i].esLiquido ? 'selected' : ''}>Sí</option>
                        <option value="false" ${!lista[i].esLiquido ? 'selected' : ''}>No</option>
                    </select>
                </td>
                <td>
                    <select id="editIva">
                        <option value="true" ${lista[i].iva ? 'selected' : ''}>15%</option>
                        <option value="false" ${!lista[i].iva ? 'selected' : ''}>0%</option>
                    </select>
                </td>
                <td>$${totalConIva.toFixed(2)}</td>
                <td>
                    <button onclick="guardarEdicionProducto(${i})" style="background: #2ea44f; color: white;">💾</button>
                    <button onclick="cancelarEdicionProducto()" style="background: #6e7681; color: white;">❌</button>
                </td>
            </tr>`;
        } else {
            contenido += `
            <tr>
                <td><strong>${lista[i].codigo || 'S/C'}</strong></td>
                <td>${lista[i].nombre}</td>
                <td>$${pCompra.toFixed(2)}</td>
                <td><strong>$${pVenta.toFixed(2)}</strong></td>
                <td style="color: #2ea44f; font-weight: bold;">$${ganancia.toFixed(2)}</td>
                <td style="color: #58a6ff;">${margenPorcentaje}%</td>
                <td>${lista[i].cantidad || 0} u.</td>
                <td>${lista[i].esLiquido ? '🥤 Sí' : '📦 No'}</td>
                <td>${ivaPorcentaje}%</td>
                <td>$${totalConIva.toFixed(2)}</td>
                <td>
                    <button onclick="activarEdicionProducto(${i})" style="background: #0969da; color: white;">✏️</button>
                    <button onclick="eliminarProductoLista('${lista[i].nombre}')" style="background: #cf222e; color: white;">X</button>
                </td>
            </tr>`;
        }
    }
    document.getElementById("tablaProductosLista").innerHTML = contenido === "" ? "<tr><td colspan='11'>No se encontraron productos.</td></tr>" : contenido;
}

function activarEdicionProducto(i) { indiceEditando = i; pintarProductos(); }
function cancelarEdicionProducto() { indiceEditando = null; pintarProductos(); }

function guardarEdicionProducto(i) {
    let nuevoCodigo = document.getElementById("editCodigo").value.trim();
    let nuevoNombre = document.getElementById("editNombre").value.trim();
    let nuevoPrecioCompra = parseFloat(document.getElementById("editPrecioCompra").value) || 0;
    let nuevoPrecioVenta = parseFloat(document.getElementById("editPrecioVenta").value);
    let nuevaCantidad = parseInt(document.getElementById("editCantidad").value) || 0;
    let nuevoEsLiquido = document.getElementById("editEsLiquido").value === "true";
    let nuevoIva = document.getElementById("editIva").value === "true";

    if (nuevoNombre === "" || isNaN(nuevoPrecioVenta) || nuevoPrecioVenta <= 0) {
        alert("Ingrese datos válidos.");
        return;
    }

    listaProductos[i] = {
        ...listaProductos[i],
        codigo: nuevoCodigo,
        nombre: nuevoNombre,
        precioCompra: nuevoPrecioCompra,
        precioVenta: nuevoPrecioVenta,
        precio: nuevoPrecioVenta,
        cantidad: nuevaCantidad,
        esLiquido: nuevoEsLiquido,
        iva: nuevoIva
    };

    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));
    indiceEditando = null;
    pintarProductos();
    pintarHistorialContable();
}

function eliminarProductoLista(nombre) {
    listaProductos = listaProductos.filter(p => p.nombre !== nombre);
    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));
    pintarProductos();
    pintarHistorialContable();
}

// AUTOCOMPLETADO Y ENTER EN FACTURACIÓN
function asignarAutocompletadoFactura() {
    let input = document.getElementById("producto");
    if (!input) return;

    input.addEventListener("input", function() {
        let txt = this.value.trim().toLowerCase();
        let prod = listaProductos.find(p => p.nombre.toLowerCase() === txt || (p.codigo && p.codigo.toLowerCase() === txt));
        if (prod) {
            document.getElementById("precio").value = prod.precioVenta || prod.precio;
        }
    });

    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            procesarAgregarProducto();
        }
    });
}

function procesarAgregarProducto() {
    let productoInput = document.getElementById("producto").value.trim();
    let cantidad = parseFloat(document.getElementById("cantidad").value);
    let precio = parseFloat(document.getElementById("precio").value);

    let prodEncontrado = listaProductos.find(p => 
        p.nombre.toLowerCase() === productoInput.toLowerCase() || 
        (p.codigo && p.codigo.toLowerCase() === productoInput.toLowerCase())
    );

    if (prodEncontrado && (isNaN(precio) || precio <= 0)) {
        precio = prodEncontrado.precioVenta || prodEncontrado.precio;
        document.getElementById("precio").value = precio;
    }

    if (productoInput === "" || isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio <= 0) {
        alert("Complete los datos del producto correctamente.");
        return;
    }

    if (prodEncontrado && prodEncontrado.esLiquido) {
        productoLiquidoPendiente = {
            baseNombre: prodEncontrado.nombre,
            cantidad: cantidad,
            precioBase: precio,
            iva: prodEncontrado.iva
        };
        document.getElementById("modalTemperatura").style.display = "flex";
    } else {
        let esIva = prodEncontrado ? prodEncontrado.iva : true;
        let nombre = prodEncontrado ? prodEncontrado.nombre : productoInput;
        ejecutarAgregarAFactura(nombre, cantidad, precio, esIva);
    }
}

function confirmarAgregarLiquido(opcion) {
    if (!productoLiquidoPendiente) return;

    let recargo = opcion === 'frio' ? 0.10 : 0.00;
    let precioFinalUnitario = productoLiquidoPendiente.precioBase + recargo;
    let etiqueta = opcion === 'frio' ? " (Frío)" : " (Al Clima)";
    let nombreCompleto = productoLiquidoPendiente.baseNombre + etiqueta;

    ejecutarAgregarAFactura(
        nombreCompleto, 
        productoLiquidoPendiente.cantidad, 
        precioFinalUnitario, 
        productoLiquidoPendiente.iva
    );

    cerrarModalTemperatura();
}

function cerrarModalTemperatura() {
    document.getElementById("modalTemperatura").style.display = "none";
    productoLiquidoPendiente = null;
}

function ejecutarAgregarAFactura(nombre, cantidad, precioUnitario, tieneIva) {
    let ivaPorcentaje = tieneIva ? 15 : 0;
    let subtotalSinIva = cantidad * precioUnitario;
    let montoIva = subtotalSinIva * (ivaPorcentaje / 100);
    let totalConIva = subtotalSinIva + montoIva;

    productos.push({
        producto: nombre,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotalSinIva: subtotalSinIva,
        ivaPorcentaje: ivaPorcentaje,
        montoIva: montoIva,
        subtotal: totalConIva
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
            <td>$ ${productos[i].precioUnitario.toFixed(2)}</td>
            <td>$ ${productos[i].subtotal.toFixed(2)}</td>
            <td><button onclick="eliminarProducto(${i})">X</button></td>
        </tr>`;
    }
    document.getElementById("tablaProductos").innerHTML = contenido;
    calcularTotales();
}

function eliminarProducto(i) {
    productos.splice(i, 1);
    pintarTabla();
}

function calcularTotales() {
    let sumaSubtotalSinIva = 0;
    let sumaIva = 0;
    let sumaTotal = 0;

    for (let i = 0; i < productos.length; i++) {
        sumaSubtotalSinIva += productos[i].subtotalSinIva;
        sumaIva += productos[i].montoIva;
        sumaTotal += productos[i].subtotal;
    }

    totalGeneralGlobal = sumaTotal;

    document.getElementById("subtotal").innerHTML = "$ " + sumaSubtotalSinIva.toFixed(2);
    document.getElementById("valorIva").innerHTML = "$ " + sumaIva.toFixed(2);
    document.getElementById("total").innerHTML = "$ " + sumaTotal.toFixed(2);

    calcularVuelto();
}

function calcularVuelto() {
    let pago = parseFloat(document.getElementById("montoRecibido").value) || 0;
    let vuelto = pago - totalGeneralGlobal;
    document.getElementById("vueltoCliente").innerHTML = (pago <= 0 || vuelto < 0) ? "$ 0.00" : "$ " + vuelto.toFixed(2);
}

function limpiarInputs() {
    document.getElementById("producto").value = "";
    document.getElementById("cantidad").value = 1;
    document.getElementById("precio").value = "";
    document.getElementById("producto").focus();
}

// CONTROL DE SECCIONES CON ACCESO
function mostrarSeccion(id) {
    if (id === "contabilidad" && !accesoContabilidadConcedido) {
        let modal = document.getElementById("modalLoginContabilidad");
        if (modal) {
            modal.style.display = "flex";
            document.getElementById("usuarioContabilidad").value = "";
            document.getElementById("claveContabilidad").value = "";
            document.getElementById("usuarioContabilidad").focus();
        }
        return;
    }

    let secciones = document.getElementsByClassName("seccion");
    for (let i = 0; i < secciones.length; i++) secciones[i].style.display = "none";

    let sec = document.getElementById(id);
    if (sec) {
        sec.style.display = "block";
        if (id === "compras") {
            let inputComp = document.getElementById("compraProductoInput");
            if (inputComp) inputComp.focus();
        }
    }
}

function validarAccesoContabilidad() {
    let u = document.getElementById("usuarioContabilidad").value.trim();
    let p = document.getElementById("claveContabilidad").value.trim();

    if (u === CREDANCIALES_CONTABILIDAD.usuario && p === CREDANCIALES_CONTABILIDAD.clave) {
        accesoContabilidadConcedido = true;
        cerrarModalLogin();
        mostrarSeccion("contabilidad");
        pintarHistorialContable();
    } else {
        alert("Usuario o clave incorrectos.");
    }
}

function cerrarModalLogin() { document.getElementById("modalLoginContabilidad").style.display = "none"; }
function cerrarSesionContabilidad() { accesoContabilidadConcedido = false; mostrarSeccion("facturacion"); }
function evaluarTeclaLogin(e) { if (e.key === "Enter") validarAccesoContabilidad(); }

// MANEJO Y BÚSQUEDA DE CLIENTES
let clientes = JSON.parse(localStorage.getItem("clientes_sistema")) || [];

function buscarClienteTabla() {
    let filtro = document.getElementById("buscarClienteInput").value.trim().toLowerCase();
    let filtrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(filtro) || 
        c.cedula.toLowerCase().includes(filtro) ||
        c.telefono.toLowerCase().includes(filtro)
    );
    pintarClientes(filtrados);
}

function guardarCliente() {
    let nombre = document.getElementById("nombreCliente").value.trim();
    let cedula = document.getElementById("cedulaCliente").value.trim();
    let telefono = document.getElementById("telefonoCliente").value.trim();
    let correo = document.getElementById("correoCliente").value.trim();

    if (nombre === "" || cedula === "") { alert("Ingrese datos obligatorios."); return; }

    clientes.push({ nombre, cedula, telefono, correo });
    localStorage.setItem("clientes_sistema", JSON.stringify(clientes));
    pintarClientes();
    limpiarClientes();
}

function buscarCliente() {
    let ced = document.getElementById("cedulaCliente").value.trim();
    let c = clientes.find(item => item.cedula === ced);
    if (c) {
        document.getElementById("nombreCliente").value = c.nombre;
        document.getElementById("telefonoCliente").value = c.telefono;
        document.getElementById("correoCliente").value = c.correo;
    } else { alert("Cliente no registrado"); }
}

function modificarCliente() {
    let ced = document.getElementById("cedulaCliente").value.trim();
    let idx = clientes.findIndex(c => c.cedula === ced);
    if (idx !== -1) {
        clientes[idx].nombre = document.getElementById("nombreCliente").value.trim();
        clientes[idx].telefono = document.getElementById("telefonoCliente").value.trim();
        clientes[idx].correo = document.getElementById("correoCliente").value.trim();
        localStorage.setItem("clientes_sistema", JSON.stringify(clientes));
        pintarClientes();
        limpiarClientes();
    }
}

function pintarClientes(lista = clientes) {
    let html = "";
    for (let i = 0; i < lista.length; i++) {
        html += `<tr><td>${lista[i].nombre}</td><td>${lista[i].cedula}</td><td>${lista[i].telefono}</td><td>${lista[i].correo}</td><td><button onclick="eliminarCliente(${i})">X</button></td></tr>`;
    }
    document.getElementById("tablaClientes").innerHTML = html === "" ? "<tr><td colspan='5'>No hay clientes registrados.</td></tr>" : html;
}

function eliminarCliente(i) {
    clientes.splice(i, 1);
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
    let ced = document.getElementById("cedula").value.trim();
    let c = clientes.find(item => item.cedula === ced);
    if (c) {
        document.getElementById("cliente").value = c.nombre;
        document.getElementById("telefono").value = c.telefono;
        document.getElementById("correo").value = c.correo;
    } else { alert("Cliente no encontrado."); }
}

// TEMA CLARO / OSCURO
function alternarTema() {
    document.body.classList.toggle("light-theme");
    let btn = document.getElementById("btn-tema");
    if (document.body.classList.contains("light-theme")) {
        btn.innerHTML = "☀️ Modo Claro";
        localStorage.setItem("tema_sistema", "claro");
    } else {
        btn.innerHTML = "🌙 Modo Oscuro";
        localStorage.setItem("tema_sistema", "oscuro");
    }
}

(function cargarTemaGuardado() {
    if (localStorage.getItem("tema_sistema") === "claro") {
        document.body.classList.add("light-theme");
    }
})();

// GUARDAR FACTURA CON FECHA AUTOMÁTICA
let historialContable = JSON.parse(localStorage.getItem("historial_contabilidad")) || [];

function guardarYLimpiarFactura() {
    if (productos.length === 0) {
        alert("No se puede guardar una factura sin productos.");
        return;
    }

    let inputCliente = document.getElementById("cliente").value.trim() || "Consumidor Final";
    let inputCedula = document.getElementById("cedula").value.trim() || "9999999999";
    let totalFactura = 0;
    let costoTotalFactura = 0;

    for (let i = 0; i < productos.length; i++) {
        totalFactura += productos[i].subtotal;

        let nombreLimpio = productos[i].producto.replace(" (Frío)", "").replace(" (Al Clima)", "").trim();
        let prodSistema = listaProductos.find(p => p.nombre.toLowerCase() === nombreLimpio.toLowerCase());
        
        if (prodSistema) {
            let costoUnitario = parseFloat(prodSistema.precioCompra) || 0;
            costoTotalFactura += (costoUnitario * productos[i].cantidad);
            prodSistema.cantidad = Math.max(0, (prodSistema.cantidad || 0) - productos[i].cantidad);
        }
    }

    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));
    pintarProductos();

    let pagoCliente = parseFloat(document.getElementById("montoRecibido").value) || totalFactura;
    if (pagoCliente < totalFactura) {
        alert("El monto ingresado es menor al total.");
        return;
    }

    let vueltoEntregado = pagoCliente - totalFactura;
    let listadoTexto = productos.map(p => `${p.producto} (x${p.cantidad})`).join(", ");

    historialContable.push({
        fecha: obtenerFechaActual(), // FECHA
        cliente: inputCliente,
        cedula: inputCedula,
        productos: listadoTexto,
        total: totalFactura,
        costoTotal: costoTotalFactura,
        pago: pagoCliente,
        vuelto: vueltoEntregado > 0 ? vueltoEntregado : 0
    });

    localStorage.setItem("historial_contabilidad", JSON.stringify(historialContable));
    pintarHistorialContable();

    alert(`¡Venta Guardada Exitosamente!\nFecha: ${obtenerFechaActual()}\nTotal: $${totalFactura.toFixed(2)}`);

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

// BÚSQUEDA Y FILTRADO POR FECHA EN CONTABILIDAD
function filtrarContabilidad() {
    let filtroTexto = document.getElementById("buscarContabilidad").value.trim().toLowerCase();
    let fechaInicio = document.getElementById("filtroFechaInicio").value;
    let fechaFin = document.getElementById("filtroFechaFin").value;

    let resultados = historialContable.filter(item => {
        let coincideTexto = item.cliente.toLowerCase().includes(filtroTexto) ||
                            item.cedula.toLowerCase().includes(filtroTexto) ||
                            item.productos.toLowerCase().includes(filtroTexto);

        let fechaItem = item.fecha ? item.fecha.split(' ')[0] : '';
        let coincideFecha = true;

        if (fechaInicio && fechaItem < fechaInicio) coincideFecha = false;
        if (fechaFin && fechaItem > fechaFin) coincideFecha = false;

        return coincideTexto && coincideFecha;
    });

    pintarHistorialContable(resultados);
}

function pintarHistorialContable(lista = historialContable) {
    let contenido = "";
    let acumuladorVentas = 0;
    let acumuladorCostos = 0;

    for (let i = 0; i < lista.length; i++) {
        acumuladorVentas += lista[i].total;
        acumuladorCostos += (lista[i].costoTotal || 0);

        contenido += `
        <tr>
            <td><small>${lista[i].fecha || 'N/A'}</small></td>
            <td>${lista[i].cliente}</td>
            <td>${lista[i].cedula}</td>
            <td>${lista[i].productos}</td>
            <td>$ ${lista[i].total.toFixed(2)}</td>
            <td>$ ${(lista[i].pago || 0).toFixed(2)}</td>
            <td>$ ${(lista[i].vuelto || 0).toFixed(2)}</td>
        </tr>`;
    }

    let valorTotalInventario = listaProductos.reduce((total, p) => {
        let precioCosto = parseFloat(p.precioCompra) || 0;
        let unidades = parseInt(p.cantidad) || 0;
        return total + (precioCosto * unidades);
    }, 0);

    let gananciaNeta = acumuladorVentas - acumuladorCostos;

    if (document.getElementById("metricaVentasBrutas")) document.getElementById("metricaVentasBrutas").innerHTML = "$ " + acumuladorVentas.toFixed(2);
    if (document.getElementById("metricaCostoVendido")) document.getElementById("metricaCostoVendido").innerHTML = "$ " + acumuladorCostos.toFixed(2);
    if (document.getElementById("metricaGananciaNeta")) document.getElementById("metricaGananciaNeta").innerHTML = "$ " + gananciaNeta.toFixed(2);
    if (document.getElementById("metricaInversionStock")) document.getElementById("metricaInversionStock").innerHTML = "$ " + valorTotalInventario.toFixed(2);

    let tabla = document.getElementById("tablaHistorialContable");
    if (tabla) {
        tabla.innerHTML = contenido === "" ? "<tr><td colspan='7'>No se encontraron registros.</td></tr>" : contenido;
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
    let csv = `<meta charset="utf-8"><table border="1"><tr><th>Fecha</th><th>Cliente</th><th>Cédula</th><th>Productos</th><th>Total</th></tr>`;
    for (let i = 0; i < historialContable.length; i++) {
        csv += `<tr><td>${historialContable[i].fecha || 'N/A'}</td><td>${historialContable[i].cliente}</td><td>${historialContable[i].cedula}</td><td>${historialContable[i].productos}</td><td>${historialContable[i].total.toFixed(2)}</td></tr>`;
    }
    csv += "</table>";
    let blob = new Blob([csv], { type: "application/vnd.ms-excel" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Contabilidad_${obtenerFechaActual().split(' ')[0]}.xls`;
    a.click();
}

// IMPRESIÓN CON FECHA Y COMPATIBILIDAD MÓVIL
function imprimirFacturaClientePDF() {
    if (productos.length === 0) {
        alert("Agregue productos para generar la factura.");
        return;
    }
    let txtCliente = document.getElementById("cliente").value.trim() || "Consumidor Final";
    let txtCedula = document.getElementById("cedula").value.trim() || "9999999999";
    let fechaHora = obtenerFechaActual();
    
    let contenedorImpresion = document.getElementById("areaImpresionGlobal");
    if (!contenedorImpresion) {
        contenedorImpresion = document.createElement("div");
        contenedorImpresion.id = "areaImpresionGlobal";
        document.body.appendChild(contenedorImpresion);
    }

    let html = `
        <div style="padding: 20px; font-family: sans-serif; color: #000;">
            <h2>Factura - Víveres DARIO</h2>
            <p><strong>Fecha / Hora:</strong> ${fechaHora}</p>
            <p><strong>Cliente:</strong> ${txtCliente}<br><strong>Cédula/RUC:</strong> ${txtCedula}</p>
            <table border="1" style="width:100%; border-collapse:collapse; margin-top: 10px;">
                <thead>
                    <tr><th>Producto</th><th>Cant</th><th>Subtotal</th></tr>
                </thead>
                <tbody>`;
    
    for (let i = 0; i < productos.length; i++) {
        html += `<tr><td>${productos[i].producto}</td><td style="text-align:center;">${productos[i].cantidad}</td><td style="text-align:right;">$${productos[i].subtotal.toFixed(2)}</td></tr>`;
    }
    
    html += `
                </tbody>
            </table>
            <h3 style="text-align:right; margin-top: 15px;">Total: ${document.getElementById("total").innerHTML}</h3>
        </div>`;

    contenedorImpresion.innerHTML = html;
    window.print();
}

// INVENTARIO - AGREGAR PRODUCTO
function agregarProductoLista() {
    let inputCodigo = document.getElementById("nuevoCodigo").value.trim();
    let inputNombre = document.getElementById("nuevoProducto").value.trim();
    let inputPrecioCompra = parseFloat(document.getElementById("nuevoPrecioCompra").value) || 0;
    let inputPrecioVenta = parseFloat(document.getElementById("nuevoPrecioVenta").value);
    let inputCantidad = parseInt(document.getElementById("nuevaCantidad").value) || 0;
    let inputStockMaximo = parseInt(document.getElementById("nuevoStockMaximo").value) || 100;
    let inputEsLiquido = document.getElementById("nuevoEsLiquido").value === "true";
    let inputIva = document.getElementById("nuevoIva").value === "true";

    if (inputCodigo === "" || inputNombre === "" || isNaN(inputPrecioVenta) || inputPrecioVenta <= 0) {
        alert("Por favor complete los campos requeridos correctamente.");
        return;
    }

    listaProductos.push({
        codigo: inputCodigo,
        nombre: inputNombre,
        precioCompra: inputPrecioCompra,
        precioVenta: inputPrecioVenta,
        precio: inputPrecioVenta,
        cantidad: inputCantidad,
        stockMaximo: inputStockMaximo,
        esLiquido: inputEsLiquido,
        iva: inputIva
    });

    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));

    document.getElementById("nuevoCodigo").value = "";
    document.getElementById("nuevoProducto").value = "";
    document.getElementById("nuevoPrecioCompra").value = "";
    document.getElementById("nuevoPrecioVenta").value = "";
    document.getElementById("nuevaCantidad").value = "";

    pintarProductos();
    pintarHistorialContable();
    alert("¡Producto registrado con éxito!");
}

// CÁMARA / LECTOR MULTIMODO
let html5QrcodeScanner = null;

function iniciarEscaneoCamara(modo = 'factura') {
    let idContenedor = modo === 'factura' ? "contenedorLectorCamaraFactura" : 
                      (modo === 'compras' ? "contenedorLectorCamaraCompras" : "contenedorLectorCamaraInventario");
    let idReader = modo === 'factura' ? "readerFactura" : 
                  (modo === 'compras' ? "readerCompras" : "readerInventario");

    document.getElementById(idContenedor).style.display = "block";

    html5QrcodeScanner = new Html5Qrcode(idReader);
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            detenerEscaneoCamara(modo);
            if (modo === 'factura') {
                document.getElementById("producto").value = decodedText;
                let prod = listaProductos.find(p => p.nombre.toLowerCase() === decodedText.toLowerCase() || (p.codigo && p.codigo.toLowerCase() === decodedText.toLowerCase()));
                if (prod) {
                    document.getElementById("precio").value = prod.precioVenta || prod.precio;
                }
                procesarAgregarProducto();
            } else if (modo === 'compras') {
                document.getElementById("compraProductoInput").value = decodedText;
                let prod = listaProductos.find(p => p.nombre.toLowerCase() === decodedText.toLowerCase() || (p.codigo && p.codigo.toLowerCase() === decodedText.toLowerCase()));
                if (prod) {
                    document.getElementById("compraPrecioCosto").value = prod.precioCompra || 0;
                }
                agregarItemACompra();
            } else {
                document.getElementById("nuevoCodigo").value = decodedText;
            }
        },
        () => {}
    ).catch(() => document.getElementById(idContenedor).style.display = "none");
}

function detenerEscaneoCamara(modo = 'factura') {
    let idContenedor = modo === 'factura' ? "contenedorLectorCamaraFactura" : 
                      (modo === 'compras' ? "contenedorLectorCamaraCompras" : "contenedorLectorCamaraInventario");
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            document.getElementById(idContenedor).style.display = "none";
            html5QrcodeScanner = null;
        }).catch(() => document.getElementById(idContenedor).style.display = "none");
    }
}

// MÓDULO DE COMPRAS A PROVEEDORES
let itemsCompraActual = [];
let historialCompras = JSON.parse(localStorage.getItem("compras_sistema")) || [];

function buscarComprasTabla() {
    let filtro = document.getElementById("buscarCompraInput").value.trim().toLowerCase();
    let filtrados = historialCompras.filter(c => 
        c.proveedor.toLowerCase().includes(filtro) || 
        c.numFactura.toLowerCase().includes(filtro) ||
        c.detalle.toLowerCase().includes(filtro)
    );
    pintarHistorialCompras(filtrados);
}

function agregarAutocompletadoCompras() {
    let inputComp = document.getElementById("compraProductoInput");
    if (!inputComp) return;

    inputComp.addEventListener("input", function() {
        let txt = this.value.trim().toLowerCase();
        let prod = listaProductos.find(p => p.nombre.toLowerCase() === txt || (p.codigo && p.codigo.toLowerCase() === txt));
        if (prod) {
            document.getElementById("compraPrecioCosto").value = prod.precioCompra || 0;
        }
    });

    inputComp.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            let txt = this.value.trim().toLowerCase();
            let prod = listaProductos.find(p => p.nombre.toLowerCase() === txt || (p.codigo && p.codigo.toLowerCase() === txt));
            if (prod && (!document.getElementById("compraPrecioCosto").value || document.getElementById("compraPrecioCosto").value == 0)) {
                document.getElementById("compraPrecioCosto").value = prod.precioCompra || 0;
            }
            agregarItemACompra();
        }
    });
}

function agregarItemACompra() {
    let txtProd = document.getElementById("compraProductoInput").value.trim();
    let cant = parseInt(document.getElementById("compraCantidad").value) || 0;
    let costo = parseFloat(document.getElementById("compraPrecioCosto").value) || 0;

    let prodEncontrado = listaProductos.find(p => 
        p.nombre.toLowerCase() === txtProd.toLowerCase() || 
        (p.codigo && p.codigo.toLowerCase() === txtProd.toLowerCase())
    );

    if (!prodEncontrado) {
        alert("El producto no existe en el Inventario. Regístralo primero en la sección 'Productos'.");
        return;
    }

    if (costo <= 0) costo = prodEncontrado.precioCompra || 0;

    if (cant <= 0 || costo <= 0) {
        alert("Ingrese una cantidad y costo válidos.");
        return;
    }

    let subtotal = cant * costo;

    itemsCompraActual.push({
        codigo: prodEncontrado.codigo,
        nombre: prodEncontrado.nombre,
        cantidad: cant,
        costoUnitario: costo,
        subtotal: subtotal
    });

    pintarTablaItemsCompra();
    
    document.getElementById("compraProductoInput").value = "";
    document.getElementById("compraCantidad").value = 1;
    document.getElementById("compraPrecioCosto").value = "";
    document.getElementById("compraProductoInput").focus();
}

function pintarTablaItemsCompra() {
    let html = "";
    let totalGeneral = 0;

    for (let i = 0; i < itemsCompraActual.length; i++) {
        totalGeneral += itemsCompraActual[i].subtotal;
        html += `
        <tr>
            <td>${itemsCompraActual[i].nombre}</td>
            <td>${itemsCompraActual[i].cantidad} u.</td>
            <td>$${itemsCompraActual[i].costoUnitario.toFixed(2)}</td>
            <td>$${itemsCompraActual[i].subtotal.toFixed(2)}</td>
            <td><button onclick="eliminarItemCompra(${i})" style="background: #cf222e; color: white;">X</button></td>
        </tr>`;
    }

    document.getElementById("tablaItemsCompra").innerHTML = html === "" ? "<tr><td colspan='5'>No hay ítems en la factura de compra.</td></tr>" : html;
    document.getElementById("totalCompraFactura").innerHTML = "$ " + totalGeneral.toFixed(2);
}

function eliminarItemCompra(index) {
    itemsCompraActual.splice(index, 1);
    pintarTablaItemsCompra();
}

function guardarFacturaCompra() {
    let proveedor = document.getElementById("compraProveedor").value.trim() || "Proveedor Varios";
    let numFactura = document.getElementById("compraNumFactura").value.trim() || "S/N";

    if (itemsCompraActual.length === 0) {
        alert("Debe agregar al menos un producto a la compra.");
        return;
    }

    let totalCompra = 0;
    let detalleTexto = [];

    for (let i = 0; i < itemsCompraActual.length; i++) {
        let item = itemsCompraActual[i];
        totalCompra += item.subtotal;
        detalleTexto.push(`${item.nombre} (+${item.cantidad}u)`);

        let prodIndex = listaProductos.findIndex(p => p.nombre.toLowerCase() === item.nombre.toLowerCase());
        if (prodIndex !== -1) {
            listaProductos[prodIndex].cantidad = (parseInt(listaProductos[prodIndex].cantidad) || 0) + item.cantidad;
            listaProductos[prodIndex].precioCompra = item.costoUnitario;
        }
    }

    localStorage.setItem("productos_sistema", JSON.stringify(listaProductos));
    pintarProductos();

    historialCompras.push({
        fecha: obtenerFechaActual(), // FECHA EN COMPRAS
        proveedor: proveedor,
        numFactura: numFactura,
        detalle: detalleTexto.join(", "),
        total: totalCompra
    });

    localStorage.setItem("compras_sistema", JSON.stringify(historialCompras));
    pintarHistorialCompras();

    alert("¡Compra procesada con éxito! Se ha incrementado el stock.");

    itemsCompraActual = [];
    pintarTablaItemsCompra();
    document.getElementById("compraProveedor").value = "";
    document.getElementById("compraNumFactura").value = "";
}

function pintarHistorialCompras(lista = historialCompras) {
    let html = "";
    for (let i = 0; i < lista.length; i++) {
        html += `
        <tr>
            <td><small>${lista[i].fecha || 'N/A'}</small></td>
            <td><strong>${lista[i].proveedor}</strong></td>
            <td>${lista[i].numFactura}</td>
            <td>${lista[i].detalle}</td>
            <td style="color: #2ea44f; font-weight: bold;">$${lista[i].total.toFixed(2)}</td>
        </tr>`;
    }
    let tabla = document.getElementById("tablaHistorialCompras");
    if (tabla) {
        tabla.innerHTML = html === "" ? "<tr><td colspan='5'>No hay compras registradas.</td></tr>" : html;
    }
}

// INICIALIZACIÓN GENERAL
pintarClientes();
pintarProductos();
asignarAutocompletadoFactura();
agregarAutocompletadoCompras();
pintarHistorialContable();
pintarHistorialCompras();