'use strict';

// nginx proxies /auth/ and /api/ to the Go API — use relative paths
const API_GO = '';

// aca guardamos el token cuando el usuario inicia sesion
let tokenSesion = null;

// referencias a los elementos del DOM que usamos seguido
const seccionLogin          = document.getElementById('login-section');
const seccionMatriz         = document.getElementById('matrix-section');
const contenedorResultados  = document.getElementById('results');
const estadoUsuario         = document.getElementById('auth-status');
const botonSalir            = document.getElementById('logout-btn');
const alertaLogin           = document.getElementById('login-alert');
const alertaCalculo         = document.getElementById('calc-alert');

// ── tema claro / oscuro ────────────────────────────────────────────────────────
const botonTema = document.getElementById('theme-btn');
const iconoLuna = document.getElementById('icon-moon');
const iconoSol  = document.getElementById('icon-sun');

// aplicamos el tema que el usuario tenia guardado, si no hay usamos claro
const temaGuardado = localStorage.getItem('theme') || 'light';
aplicarTema(temaGuardado);

botonTema.addEventListener('click', () => {
  const temaActual = document.documentElement.getAttribute('data-theme');
  aplicarTema(temaActual === 'dark' ? 'light' : 'dark');
});

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  localStorage.setItem('theme', tema);

  // cambiamos el icono segun el tema activo
  if (tema === 'dark') {
    iconoLuna.style.display = 'none';
    iconoSol.style.display  = 'block';
  } else {
    iconoLuna.style.display = 'block';
    iconoSol.style.display  = 'none';
  }
}

// ── helpers ────────────────────────────────────────────────────────────────────
function mostrarAlerta(elemento, mensaje, esError = true) {
  elemento.textContent   = mensaje;
  elemento.className     = `alert ${esError ? 'alert-error' : 'alert-success'}`;
  elemento.style.display = 'block';
}
function ocultarAlerta(elemento) { elemento.style.display = 'none'; }

// formatea los numeros para que no tengan demasiados decimales
function formatearNumero(numero) {
  return typeof numero === 'number' ? parseFloat(numero.toFixed(8)).toString() : String(numero);
}

// ── login ──────────────────────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultarAlerta(alertaLogin);

  const boton        = evento.target.querySelector('button[type="submit"]');
  const nombreUsuario = document.getElementById('username').value.trim();
  const contrasena    = document.getElementById('password').value;

  // mostramos spinner mientras espera la respuesta
  boton.innerHTML = '<span class="spinner"></span>Ingresando…';
  boton.disabled  = true;

  try {
    const respuesta     = await fetch(`${API_GO}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: nombreUsuario, password: contrasena }),
    });
    const datosRespuesta = await respuesta.json();
    if (!respuesta.ok) throw new Error(datosRespuesta.error || 'Error de autenticacion');

    // guardamos el token y mostramos la seccion principal
    tokenSesion = datosRespuesta.token;
    seccionLogin.style.display         = 'none';
    seccionMatriz.style.display        = 'block';
    estadoUsuario.textContent          = nombreUsuario;
    botonSalir.style.display           = 'inline-flex';
    construirGrilla();
  } catch (error) {
    mostrarAlerta(alertaLogin, error.message);
  } finally {
    boton.innerHTML = 'Iniciar sesión';
    boton.disabled  = false;
  }
});

// ── logout ─────────────────────────────────────────────────────────────────────
botonSalir.addEventListener('click', () => {
  // limpiamos todo y volvemos al login
  tokenSesion = null;
  seccionLogin.style.display        = 'flex';
  seccionMatriz.style.display       = 'none';
  contenedorResultados.style.display = 'none';
  estadoUsuario.textContent         = '';
  botonSalir.style.display          = 'none';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
});

// ── construccion de la grilla ──────────────────────────────────────────────────
function construirGrilla() {
  const numFilas    = parseInt(document.getElementById('rows').value, 10);
  const numColumnas = parseInt(document.getElementById('cols').value, 10);

  if (isNaN(numFilas) || isNaN(numColumnas) || numFilas < 1 || numColumnas < 1) return;

  // la descomposicion QR necesita que filas >= columnas
  if (numFilas < numColumnas) {
    mostrarAlerta(alertaCalculo, `La factorización QR requiere filas ≥ columnas (m ≥ n). Actual: ${numFilas} < ${numColumnas}.`);
    return;
  }
  ocultarAlerta(alertaCalculo);

  // generamos los inputs de la tabla
  const contenedor = document.getElementById('matrix-grid');
  let contenidoHTML = '<table>';
  for (let i = 0; i < numFilas; i++) {
    contenidoHTML += '<tr>';
    for (let j = 0; j < numColumnas; j++) {
      contenidoHTML += `<td><input type="number" step="any" value="0"
                            id="cell-${i}-${j}" aria-label="Fila ${i + 1} Col ${j + 1}"></td>`;
    }
    contenidoHTML += '</tr>';
  }
  contenidoHTML += '</table>';
  contenedor.innerHTML = contenidoHTML;
}

// reconstruimos la grilla si cambian las dimensiones
document.getElementById('rows').addEventListener('change', construirGrilla);
document.getElementById('cols').addEventListener('change', construirGrilla);
document.getElementById('build-btn').addEventListener('click', construirGrilla);

// carga un ejemplo clasico de la literatura (Golub & Van Loan)
document.getElementById('example-btn').addEventListener('click', () => {
  document.getElementById('rows').value = 3;
  document.getElementById('cols').value = 3;
  construirGrilla();
  [[12, -51, 4], [6, 167, -68], [-4, 24, -41]].forEach((filaActual, i) =>
    filaActual.forEach((valorCelda, j) => {
      const celda = document.getElementById(`cell-${i}-${j}`);
      if (celda) celda.value = valorCelda;
    })
  );
});

// ── calcular QR ────────────────────────────────────────────────────────────────
document.getElementById('calc-form').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultarAlerta(alertaCalculo);
  contenedorResultados.style.display = 'none';

  const numFilas    = parseInt(document.getElementById('rows').value, 10);
  const numColumnas = parseInt(document.getElementById('cols').value, 10);

  // leemos los valores de cada celda
  const matrizEntrada = [];
  for (let i = 0; i < numFilas; i++) {
    const filaActual = [];
    for (let j = 0; j < numColumnas; j++) {
      const valorCelda = parseFloat(document.getElementById(`cell-${i}-${j}`)?.value ?? 0);
      filaActual.push(isNaN(valorCelda) ? 0 : valorCelda);
    }
    matrizEntrada.push(filaActual);
  }

  const boton = evento.target.querySelector('button[type="submit"]');
  boton.innerHTML = '<span class="spinner"></span>Calculando…';
  boton.disabled  = true;

  try {
    // mandamos la matriz a la api de go con el token en el header
    const respuesta = await fetch(`${API_GO}/api/matrix/qr`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${tokenSesion}`,
      },
      body: JSON.stringify({ matrix: matrizEntrada }),
    });
    const datosRespuesta = await respuesta.json();
    if (!respuesta.ok) throw new Error(datosRespuesta.error || 'Error al calcular');

    mostrarResultados(datosRespuesta);
  } catch (error) {
    mostrarAlerta(alertaCalculo, error.message);
  } finally {
    boton.innerHTML = 'Calcular factorización QR';
    boton.disabled  = false;
  }
});

// ── renderizado de resultados ──────────────────────────────────────────────────
function mostrarResultados(datosRespuesta) {
  pintarMatriz('original-matrix', datosRespuesta.original_matrix, 'A — Matriz original');
  pintarMatriz('q-matrix',        datosRespuesta.Q,               'Q — Ortogonal');
  pintarMatriz('r-matrix',        datosRespuesta.R,               'R — Triangular superior');

  pintarEstadisticas('q-stats-container',       datosRespuesta.statistics.q_stats,       'Estadísticas de Q');
  pintarEstadisticas('r-stats-container',       datosRespuesta.statistics.r_stats,       'Estadísticas de R');
  pintarEstadisticasCombinadas('combined-stats-container', datosRespuesta.statistics.combined_stats);

  contenedorResultados.style.display = 'block';
  contenedorResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// pinta una matriz como tabla html
function pintarMatriz(idContenedor, matriz, etiqueta) {
  const contenedor = document.getElementById(idContenedor);
  if (!matriz || matriz.length === 0) {
    contenedor.innerHTML = '<em style="color:var(--text-subtle)">Vacía</em>';
    return;
  }

  const numColumnas = matriz[0].length;
  let contenidoHTML = `<p class="section-title">${etiqueta}</p>
    <div class="matrix-wrap">
      <table class="matrix-table">
        <thead><tr><th></th>`;

  for (let j = 0; j < numColumnas; j++) contenidoHTML += `<th>Col ${j + 1}</th>`;
  contenidoHTML += '</tr></thead><tbody>';

  matriz.forEach((filaActual, i) => {
    contenidoHTML += `<tr><th>Fila ${i + 1}</th>`;
    filaActual.forEach(valorCelda => { contenidoHTML += `<td>${formatearNumero(valorCelda)}</td>`; });
    contenidoHTML += '</tr>';
  });

  contenidoHTML += '</tbody></table></div>';
  contenedor.innerHTML = contenidoHTML;
}

// pinta las estadisticas de una matriz
function pintarEstadisticas(idContenedor, estadisticas, titulo) {
  const contenedor     = document.getElementById(idContenedor);
  const insigniaDiagonal = estadisticas.is_diagonal
    ? '<span class="badge badge-yes">Sí</span>'
    : '<span class="badge badge-no">No</span>';

  contenedor.innerHTML = `
    <p class="section-title">${titulo}</p>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-label">Máximo</span><span class="stat-value">${formatearNumero(estadisticas.max)}</span></div>
      <div class="stat-card"><span class="stat-label">Mínimo</span><span class="stat-value">${formatearNumero(estadisticas.min)}</span></div>
      <div class="stat-card"><span class="stat-label">Promedio</span><span class="stat-value">${formatearNumero(estadisticas.average)}</span></div>
      <div class="stat-card"><span class="stat-label">Suma total</span><span class="stat-value">${formatearNumero(estadisticas.sum)}</span></div>
      <div class="stat-card"><span class="stat-label">¿Es diagonal?</span><span class="stat-value">${insigniaDiagonal}</span></div>
    </div>`;
}

// pinta las estadisticas combinadas de Q y R juntas
function pintarEstadisticasCombinadas(idContenedor, estadisticas) {
  const contenedor = document.getElementById(idContenedor);
  contenedor.innerHTML = `
    <p class="section-title">Estadísticas combinadas (Q + R)</p>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-label">Máximo</span><span class="stat-value">${formatearNumero(estadisticas.max)}</span></div>
      <div class="stat-card"><span class="stat-label">Mínimo</span><span class="stat-value">${formatearNumero(estadisticas.min)}</span></div>
      <div class="stat-card"><span class="stat-label">Promedio</span><span class="stat-value">${formatearNumero(estadisticas.average)}</span></div>
      <div class="stat-card"><span class="stat-label">Suma total</span><span class="stat-value">${formatearNumero(estadisticas.sum)}</span></div>
    </div>`;
}

// al inicio ocultamos el boton de cerrar sesion
botonSalir.style.display = 'none';
