/************************************************
 * facturacion.js
 * Maneja la generación y registro de ventas en Firebase,
 * permite ingresar el nombre del cliente y descuenta stock.
 ************************************************/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ajusta con tus credenciales de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "nutrisanti-b4944.firebaseapp.com",
  projectId: "nutrisanti-b4944",
  storageBucket: "nutrisanti-b4944.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "1:181448783075:web:43b59620907300165a81d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias a elementos del HTML
const inputCliente = document.getElementById("cliente");
const selectProducto = document.getElementById("producto");
const inputCantidad = document.getElementById("cantidad");
const inputPrecio = document.getElementById("precio");
const inputTotal = document.getElementById("total");
const facturaBody = document.getElementById("facturaBody");
const granTotalElem = document.getElementById("granTotal");
const btnAgregar = document.getElementById("btnAgregar");
const btnGuardarVenta = document.getElementById("btnGuardarVenta");

// Eventos
document.addEventListener("DOMContentLoaded", cargarProductos);
selectProducto.addEventListener("change", actualizarPrecio);
inputCantidad.addEventListener("input", calcularTotal);
btnAgregar.addEventListener("click", agregarProducto);
btnGuardarVenta.addEventListener("click", guardarVenta);

/**
 * Carga los productos desde Firebase y llena el <select>
 */
async function cargarProductos() {
  selectProducto.innerHTML = '<option value="">Selecciona un producto</option>';
  try {
    const snapshot = await getDocs(collection(db, "productos"));
    snapshot.forEach(docSnap => {
      const producto = docSnap.data();
      // Ajusta si tu campo en Firebase es distinto de "precioSugerido"
      const option = document.createElement("option");
      option.value = JSON.stringify({
        nombre: producto.nombre,
        precio: producto.precioSugerido
      });
      option.textContent = `${producto.nombre} - $${formatearCOP(producto.precioSugerido)}`;
      selectProducto.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

/**
 * Actualiza el input de precio unitario según el producto seleccionado
 */
function actualizarPrecio() {
  const productoSeleccionado = selectProducto.value;
  if (!productoSeleccionado) {
    inputPrecio.value = "";
    inputTotal.value = "";
    btnAgregar.disabled = true;
    return;
  }
  btnAgregar.disabled = false;

  const { precio } = JSON.parse(productoSeleccionado);
  inputPrecio.value = `$${formatearCOP(precio)}`;
  calcularTotal();
}

/**
 * Calcula el total (precio unitario x cantidad)
 */
function calcularTotal() {
  const cantidad = parseInt(inputCantidad.value) || 1;
  const precio = parseInt(inputPrecio.value.replace(/\D/g, "")) || 0;
  const total = cantidad * precio;
  inputTotal.value = `$${formatearCOP(total)}`;
}

/**
 * Agrega un producto a la tabla de factura
 */
function agregarProducto() {
  const productoSeleccionado = selectProducto.value;
  if (!productoSeleccionado) return;

  const { nombre, precio } = JSON.parse(productoSeleccionado);
  const cantidad = parseInt(inputCantidad.value) || 1;
  const subtotal = cantidad * precio;

  // Crear la fila en la tabla
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td>${nombre}</td>
    <td>${cantidad}</td>
    <td>$${formatearCOP(precio)}</td>
    <td>$${formatearCOP(subtotal)}</td>
    <td>
      <button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); actualizarGranTotal();">
        Eliminar
      </button>
    </td>
  `;
  facturaBody.appendChild(fila);

  // Actualizar gran total
  actualizarGranTotal();
}

/**
 * Suma todos los subtotales de la tabla
 */
function actualizarGranTotal() {
  let suma = 0;
  facturaBody.querySelectorAll("tr").forEach(row => {
    const subtotalCelda = row.cells[3].textContent || "$0";
    const valor = parseInt(subtotalCelda.replace(/\D/g, "")) || 0;
    suma += valor;
  });
  granTotalElem.textContent = `$${formatearCOP(suma)}`;
}

/**
 * Guarda la venta en Firebase, descuenta stock y limpia la factura
 */
async function guardarVenta() {
  const cliente = inputCliente.value.trim() || "Cliente desconocido";

  // Recorrer la tabla para armar la lista de productos vendidos
  const productosVendidos = [];
  let totalVenta = 0;
  facturaBody.querySelectorAll("tr").forEach(row => {
    const celdas = row.querySelectorAll("td");
    const nombreProducto = celdas[0].textContent;
    const cantidad = parseInt(celdas[1].textContent);
    const subtotal = parseInt(celdas[3].textContent.replace(/\D/g, "")) || 0;

    totalVenta += subtotal;
    productosVendidos.push({
      nombre: nombreProducto,
      cantidad: cantidad,
      total: subtotal
    });
  });

  if (productosVendidos.length === 0) {
    alert("No hay productos en la factura.");
    return;
  }

  const nuevaVenta = {
    fecha: new Date().toISOString(),
    cliente: cliente,
    total: totalVenta,
    productos: productosVendidos
  };

  try {
    // 1. Guardar la venta en Firebase
    await addDoc(collection(db, "ventas"), nuevaVenta);

    // 2. Descontar el stock de cada producto vendido
    for (const p of productosVendidos) {
      await descontarStock(p.nombre, p.cantidad);
    }

    alert("Venta guardada correctamente y stock actualizado.");

    // 3. Limpiar la tabla y el campo de cliente
    facturaBody.innerHTML = "";
    granTotalElem.textContent = "$0";
    inputCliente.value = "";
  } catch (error) {
    console.error("Error al guardar la venta:", error);
    alert("Ocurrió un error al guardar la venta.");
  }
}

/**
 * Descuenta la cantidad vendida del stock en la colección 'productos'
 */
async function descontarStock(nombreProducto, cantidadVendida) {
  try {
    const q = query(collection(db, "productos"), where("nombre", "==", nombreProducto));
    const snapshot = await getDocs(q);
    snapshot.forEach(async docSnap => {
      const data = docSnap.data();
      const nuevoStock = (data.stock || 0) - cantidadVendida;
      if (nuevoStock < 0) {
        console.warn(`Stock insuficiente para ${nombreProducto}`);
        return;
      }
      await updateDoc(doc(db, "productos", docSnap.id), { stock: nuevoStock });
    });
  } catch (error) {
    console.error("Error al descontar stock:", error);
  }
}

/**
 * Formatea un número en formato de pesos colombianos (COP)
 */
function formatearCOP(valor) {
  return valor.toLocaleString("es-CO");
}
