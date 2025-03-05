import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc 
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

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
});

async function cargarProductos() {
    const productosBody = document.getElementById("productosBody");
    productosBody.innerHTML = "";
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        querySnapshot.forEach((docSnap) => {
            const producto = docSnap.data();
            const fila = document.createElement("tr");
            fila.setAttribute("data-id", docSnap.id);
            fila.innerHTML = `
                <td contenteditable="true" id="nombre-${docSnap.id}">${producto.nombre}</td>
                <td contenteditable="true" id="precioSugerido-${docSnap.id}">${producto.precioSugerido}</td>
                <td contenteditable="true" id="precio-${docSnap.id}">${producto.precio}</td>
                <td contenteditable="true" id="stock-${docSnap.id}">${producto.stock}</td>
                <td>
                    <button class="btn btn-success btn-sm guardar-btn" data-id="${docSnap.id}">Guardar</button>
                    <button class="btn btn-danger btn-sm eliminar-btn" data-id="${docSnap.id}">Eliminar</button>
                </td>
            `;
            productosBody.appendChild(fila);
        });
        
        document.querySelectorAll(".guardar-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                const id = event.target.getAttribute("data-id");
                await guardarCambios(id);
            });
        });
        
        document.querySelectorAll(".eliminar-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                const id = event.target.getAttribute("data-id");
                await eliminarProducto(id);
            });
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

async function guardarCambios(id) {
    const nombre = document.getElementById(`nombre-${id}`).innerText.trim();
    const precioSugerido = parseFloat(document.getElementById(`precioSugerido-${id}`).innerText.trim());
    const precio = parseFloat(document.getElementById(`precio-${id}`).innerText.trim());
    const stock = parseInt(document.getElementById(`stock-${id}`).innerText.trim());

    if (!nombre || isNaN(precioSugerido) || isNaN(precio) || isNaN(stock)) {
        alert("Todos los campos deben estar llenos y ser válidos.");
        return;
    }

    try {
        await updateDoc(doc(db, "productos", id), {
            nombre: nombre,
            precioSugerido: precioSugerido,
            precio: precio,
            stock: stock
        });
        alert("Producto actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        alert("Error al actualizar el producto.");
    }
}

async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        try {
            await deleteDoc(doc(db, "productos", id));
            alert("Producto eliminado correctamente.");
            cargarProductos();
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            alert("Ocurrió un error al eliminar el producto.");
        }
    }
}

document.getElementById("productoForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const precioSugerido = parseFloat(document.getElementById("precioSugerido").value);
    const precio = parseFloat(document.getElementById("precio").value);
    const stock = parseInt(document.getElementById("stock").value);
    
    if (!nombre || isNaN(precioSugerido) || isNaN(precio) || isNaN(stock)) {
        alert("Todos los campos deben estar llenos y ser válidos.");
        return;
    }

    try {
        await addDoc(collection(db, "productos"), { 
            nombre: nombre, 
            precioSugerido: precioSugerido, 
            precio: precio,
            stock: stock 
        });
        alert("Producto agregado correctamente.");
        cargarProductos();
    } catch (error) {
        console.error("Error al agregar producto:", error);
        alert("Error al agregar el producto.");
    }
});
