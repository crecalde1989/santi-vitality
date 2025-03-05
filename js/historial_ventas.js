/************************************************
 * historial_ventas.js
 * Muestra las ventas de la colección 'ventas',
 * separa la columna de Cliente, Productos y Total,
 * y hace un Gran Total final.
 ************************************************/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase
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

// Referencia al tbody donde se mostrarán las ventas
const ventasBody = document.getElementById("ventasBody");

document.addEventListener("DOMContentLoaded", cargarHistorialVentas);

/**
 * Carga todas las ventas desde Firebase, ordenadas por fecha desc
 */
async function cargarHistorialVentas() {
  ventasBody.innerHTML = "";
  let granTotal = 0;

  try {
    const q = query(collection(db, "ventas"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const venta = docSnap.data();
      const idVenta = docSnap.id;

      // Campos de la venta
      const fecha = new Date(venta.fecha).toLocaleString();
      const cliente = venta.cliente || "Cliente desconocido";
      const totalVenta = venta.total || 0;

      // Acumular para el Gran Total
      granTotal += totalVenta;

      // Construir lista de productos
      const productosHTML = (venta.productos || [])
        .map(
          p => `• ${p.nombre} x${p.cantidad} - $${p.total?.toLocaleString("es-CO")}`
        )
        .join("<br>");

      // Crear la fila con 5 columnas: Fecha, Cliente, Productos, Total, Acción
      const fila = `
        <tr>
          <td>${fecha}</td>
          <td>${cliente}</td>
          <td>${productosHTML}</td>
          <td>$${totalVenta.toLocaleString("es-CO")}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="eliminarVenta('${idVenta}')">
              Eliminar
            </button>
          </td>
        </tr>
      `;
      ventasBody.insertAdjacentHTML("beforeend", fila);
    });

    // Agregar fila final para el Gran Total de todas las ventas
    if (granTotal > 0) {
      const filaGranTotal = `
        <tr class="table-success">
          <td colspan="3" style="text-align:right;"><strong>Gran Total:</strong></td>
          <td><strong>$${granTotal.toLocaleString("es-CO")}</strong></td>
          <td></td>
        </tr>
      `;
      ventasBody.insertAdjacentHTML("beforeend", filaGranTotal);
    }
  } catch (error) {
    console.error("Error al cargar historial de ventas:", error);
  }
}

/**
 * Elimina una venta de Firebase
 */
window.eliminarVenta = async function (idVenta) {
  if (!confirm("¿Seguro que deseas eliminar esta venta?")) return;

  try {
    await deleteDoc(doc(db, "ventas", idVenta));
    alert("Venta eliminada correctamente.");
    cargarHistorialVentas();
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    alert("No se pudo eliminar la venta.");
  }
};
