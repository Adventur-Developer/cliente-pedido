let db;

document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("miDB", 1);

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("clientes")) {
      db.createObjectStore("clientes", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("pedidos")) {
      db.createObjectStore("pedidos", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;
    obtenerClientes();
    obtenerPedidos();
  };

  request.onerror = (e) => {
    console.error("Error DB:", e.target.error);
  };

  document.getElementById("form-cliente").addEventListener("submit", agregarCliente);
  document.getElementById("form-pedido").addEventListener("submit", agregarPedido);
});

function agregarCliente(e) {
  e.preventDefault();
  const nombre = document.getElementById("nombre-cliente").value;
  const ci = document.getElementById("ci-cliente").value;

  const trans = db.transaction(["clientes"], "readwrite");
  const store = trans.objectStore("clientes");
  store.add({ nombre, ci });

  trans.oncomplete = () => {
    e.target.reset();
    obtenerClientes();
  };
}

function obtenerClientes() {
  const select = document.getElementById("select-cliente");
  select.innerHTML = "";
  const trans = db.transaction(["clientes"], "readonly");
  const store = trans.objectStore("clientes");
  const request = store.openCursor();

  request.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const option = document.createElement("option");
      option.value = cursor.value.nombre;
      option.textContent = cursor.value.nombre;
      select.appendChild(option);
      cursor.continue();
    }
  };
}

function agregarPedido(e) {
  e.preventDefault();
  const producto = document.getElementById("producto-pedido").value;
  const cantidad = parseInt(document.getElementById("cantidad-pedido").value);
  const cliente = document.getElementById("select-cliente").value;

  const trans = db.transaction(["pedidos"], "readwrite");
  const store = trans.objectStore("pedidos");
  store.add({ producto, cantidad, cliente });

  trans.oncomplete = () => {
    e.target.reset();
    obtenerPedidos();
  };
}

function obtenerPedidos() {
  const tbody = document.querySelector("#tabla-pedidos tbody");
  tbody.innerHTML = "";

  const trans = db.transaction(["pedidos"], "readonly");
  const store = trans.objectStore("pedidos");
  const request = store.openCursor();

  request.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const { id, producto, cantidad, cliente } = cursor.value;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${producto}</td>
        <td>${cantidad}</td>
        <td>${cliente}</td>
        <td>
          <button onclick="editarPedido(${id})">Editar</button>
          <button onclick="eliminarPedido(${id})">Borrar</button>
        </td>`;
      tbody.appendChild(tr);
      cursor.continue();
    }
  };
}

function eliminarPedido(id) {
  const trans = db.transaction(["pedidos"], "readwrite");
  const store = trans.objectStore("pedidos");
  store.delete(id);
  trans.oncomplete = obtenerPedidos;
}

function editarPedido(id) {
  const nuevoProducto = prompt("Nuevo nombre de producto:");
  const nuevaCantidad = prompt("Nueva cantidad:");
  const nuevoCliente = prompt("Nuevo cliente:");

  const trans = db.transaction(["pedidos"], "readwrite");
  const store = trans.objectStore("pedidos");
  const request = store.get(id);

  request.onsuccess = () => {
    const data = request.result;
    data.producto = nuevoProducto;
    data.cantidad = parseInt(nuevaCantidad);
    data.cliente = nuevoCliente;

    const updateRequest = store.put(data);
    updateRequest.onsuccess = obtenerPedidos;
  };
}