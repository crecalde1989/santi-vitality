import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {
    const inputNombre = document.createElement("input");
    inputNombre.type = "text";
    inputNombre.id = "nombreCliente";
    inputNombre.placeholder = "Nombre del comprador";
    inputNombre.classList.add("form-control", "mb-2");
    document.querySelector(".container").insertBefore(inputNombre, document.getElementById("facturaBody").parentNode);
});

async function guardarVenta() {
    const nombreCliente = document.getElementById("nombreCliente").value.trim();
    if (!nombreCliente) {
        alert("Por favor, ingrese el nombre del comprador.");
        return;
    }

    const detallesVenta = generarMensajeWhatsApp();
    if (!detallesVenta.trim()) {
        alert("No hay productos en la factura.");
        return;
    }

    const productosVendidos = [];
    document.querySelectorAll("#facturaBody tr").forEach(row => {
        const productoNombre = row.cells[0].innerText;
        const cantidad = parseInt(row.cells[1].innerText);
        productosVendidos.push({ nombre: productoNombre, cantidad: cantidad });
    });

    try {
        await addDoc(collection(db, "ventas"), {
            nombreCliente: nombreCliente,
            detalles: detallesVenta,
            fecha: new Date().toISOString(),
            productos: productosVendidos
        });

        for (const producto of productosVendidos) {
            const productoRef = query(collection(db, "productos"), where("nombre", "==", producto.nombre));
            const productoSnapshot = await getDocs(productoRef);
            productoSnapshot.forEach(async (docSnap) => {
                const productoData = docSnap.data();
                const stockActual = productoData.stock || 0;
                const nuevoStock = stockActual - producto.cantidad;
                if (nuevoStock >= 0) {
                    await updateDoc(docSnap.ref, { stock: nuevoStock });
                } else {
                    console.warn(`Stock insuficiente para ${producto.nombre}. No se actualizó.`);
                }
            });
        }

        alert("Venta guardada correctamente y stock actualizado.");
        
        // Limpiar la tabla de facturación de manera segura
        const facturaBody = document.getElementById("facturaBody");
        while (facturaBody.firstChild) {
            facturaBody.removeChild(facturaBody.firstChild);
        }
        
        document.getElementById("granTotal").textContent = "$0";

        // Limpiar los campos de selección y cantidad
        document.getElementById("producto").selectedIndex = 0;
        document.getElementById("cantidad").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("total").value = "";
        document.getElementById("nombreCliente").value = "";
    } catch (error) {
        console.error("Error al guardar la venta:", error);
        alert("Ocurrió un error al guardar la venta.");
    }
}

document.getElementById("btnGuardarVenta").addEventListener("click", guardarVenta);
