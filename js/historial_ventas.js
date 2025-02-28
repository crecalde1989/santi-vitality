import { db } from "./base_datos.js"; 
import { collection, getDocs, query, orderBy, limit, startAfter, doc, getDoc } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let lastVisible = null;
const pageSize = 10;

document.addEventListener("DOMContentLoaded", () => {
    cargarVentas();
});

// 🔹 Función para cargar ventas desde Firebase
async function cargarVentas(reset = true) {
    let ventasQuery = query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(pageSize));

    if (lastVisible) {
        ventasQuery = query(ventasQuery, startAfter(lastVisible));
    }

    const snapshot = await getDocs(ventasQuery);
    const ventas = snapshot.docs.map(doc => doc.data());
    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    const ventasTableBody = document.getElementById("ventasTableBody");
    ventas.forEach(venta => {
        const row = `
            <tr>
                <td>${venta.fecha}</td>
                <td>${venta.detalles}</td>
                <td>${venta.productos.map(p => `${p.producto} x${p.cantidad}`).join(', ')}</td>
            </tr>
        `;
        ventasTableBody.insertAdjacentHTML("beforeend", row);
    });
}

// Llamado cuando se quiera cargar más ventas
async function cargarMasVentas() {
    await cargarVentas(false);
}
