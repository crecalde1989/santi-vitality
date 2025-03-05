/************************************************
 * historial_ventas.js
 * Muestra el historial de ventas con las columnas:
 * Fecha, Cliente, Productos, Total, Total Inversión, Diferencia y Acción.
 ************************************************/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const ventasBody = document.getElementById("ventasBody");
document.addEventListener("DOMContentLoaded", cargarHistorialVentas);

async function cargarHistorialVentas() {
  ventasBody.innerHTML = "";
  try {
    const q = query(collection(db, "ventas"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const venta = docSnap.data();
      const idVenta = docSnap.id;
      const fecha = new Date(venta.fecha).toLocaleString();
      const cliente = venta.cliente || "Cliente desconocido";
      const totalVenta = venta.total || 0;
      
      // Calcular Total Inversión: para cada producto, se consulta el campo "precio" (nuevo) de Firebase
      let totalInversionVenta = 0;
      if (venta.productos && venta.productos.length > 0) {
        const inversionPromises = venta.productos.map(async (p) => {
          const qProd = query(collection(db, "productos"), where("nombre", "==", p.nombre));
          const snapshotProd = await getDocs(qProd);
          let precioFirebase = 0;
          snapshotProd.forEach(doc => {
            const prodData = doc.data();
            // Usar el campo "precio" (nuevo) de Firebase
            precioFirebase = prodData.precio;
          });
          return p.cantidad * precioFirebase;
        });
        const inversionValues = await Promise.all(inversionPromises);
        totalInversionVenta = inversionValues.reduce((sum, cur) => sum + cur, 0);
      }
      
      const diferencia = totalVenta - totalInversionVenta;
      
      // Construir lista de productos
      const productosHTML = (venta.productos || [])
        .map(p => `• ${p.nombre} x${p.cantidad} - $${p.total.toLocaleString("es-CO")}`)
        .join("<br>");
      
      const row = `
        <tr>
          <td>${fecha}</td>
          <td>${cliente}</td>
          <td>${productosHTML}</td>
          <td>$${totalVenta.toLocaleString("es-CO")}</td>
          <td>$${totalInversionVenta.toLocaleString("es-CO")}</td>
          <td>$${diferencia.toLocaleString("es-CO")}</td>
          <td><button class="btn btn-danger btn-sm" onclick="eliminarVenta('${idVenta}')">Eliminar</button></td>
        </tr>
      `;
      ventasBody.insertAdjacentHTML("beforeend", row);
    }
  } catch (error) {
    console.error("Error al cargar historial de ventas:", error);
  }
}

window.eliminarVenta = async function(idVenta) {
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
