import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:3000/api';

// Paleta alineada al azul corporativo del membrete. Los estados usan tonos
// desaturados con fondo tenue: se distinguen sin convertir la tabla en un
// semáforo, que era el efecto de los colores planos de Bootstrap.
const AZUL = '#1d429a';
const ESTADOS = {
  'Pendiente':  { color: '#0e7490', fondo: '#e0f2fe', punto: '#0891b2' },
  'En Proceso': { color: '#b45309', fondo: '#fef3c7', punto: '#d97706' },
  'Atrasado':   { color: '#b91c1c', fondo: '#fee2e2', punto: '#dc2626' },
  'Finalizado': { color: '#15803d', fondo: '#dcfce7', punto: '#16a34a' },
  'Inactivo':   { color: '#4b5563', fondo: '#f3f4f6', punto: '#9ca3af' }
};

function Icono({ nombre, size = 16 }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'
  };
  switch (nombre) {
    case 'lapiz': return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
    case 'reloj': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'check': return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case 'reactivar': return <svg {...p}><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.7 3" /><path d="M3 4v5h5" /></svg>;
    case 'pdf': return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></svg>;
    case 'buscar': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    case 'calendario': return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>;
    case 'mas': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'x': return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case 'reloj-grande': return <svg {...p} strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    default: return null;
  }
}

export default function Dashboard({ setVistaActiva, onEditar, onNuevo }) {
  const [kpis, setKpis] = useState({ pendientes: 0, enProceso: 0, atrasados: 0 });
  const [avaluos, setAvaluos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaVisitaFiltro, setFechaVisitaFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [filtroKpi, setFiltroKpi] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [avaluoEdit, setAvaluoEdit] = useState(null);
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const inputFechaRef = useRef(null);

  const [generandoId, setGenerandoId] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [orden, setOrden] = useState({ clave: null, direccion: 'asc' });

  const hoy = new Date().toISOString().split('T')[0];
  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const cargarDatos = () => {
    fetch(`${API}/dashboard`)
      .then(res => res.json())
      .then(data => {
          if (data.error) console.error("Error backend KPIs:", data.error);
          else setKpis(data);
      })
      .catch(() => console.error("Error de red cargando KPIs"));

    fetch(`${API}/avaluos`)
      .then(res => res.json())
      .then(data => {
          // Programación defensiva: Solo guardar si es un Array
          if (Array.isArray(data)) {
              setAvaluos(data);
          } else {
              console.error("Respuesta inválida del servidor:", data);
              setAvaluos([]); // Fallback para evitar que .filter() rompa la app
          }
      })
      .catch(() => {
          console.error("Error de red cargando Avalúos");
          setAvaluos([]);
      });
  };

  useEffect(() => { cargarDatos(); }, []);

  // El aviso de confirmación se retira solo.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const toggleFiltroKpi = (tipo) => { if (filtroKpi === tipo) setFiltroKpi(null); else { setFiltroKpi(tipo); setPaginaActual(1); } };

  const obtenerEstadoSLA = (av) => {
    if (av.estado === 'Finalizado') return 'Finalizado';
    if (av.estado === 'Inactivo') return 'Inactivo';
    if (!av.fecha_limite_entrega) return 'Pendiente';
    if (av.fecha_limite_entrega.substring(0, 10) < hoy) return 'Atrasado';
    return 'En Proceso';
  };

  const avaluosFiltrados = avaluos.filter((av) => {
    const termino = busqueda.toLowerCase();
    const coincideTexto = busqueda === "" || av.id.toString().includes(termino) || (av.solicitante && av.solicitante.toLowerCase().includes(termino)) || (av.documento && av.documento.toString().includes(termino));
    
    let coincideFecha = true;
    if (fechaVisitaFiltro && av.fecha_vis_formato) coincideFecha = av.fecha_vis_formato === fechaVisitaFiltro;
    else if (fechaVisitaFiltro && !av.fecha_vis_formato) coincideFecha = false;
    
    let coincideKpi = true;
    if (filtroKpi === 'Pendientes') coincideKpi = av.estado === 'Activo' && !av.fecha_limite_entrega;
    else if (filtroKpi === 'Atrasados') coincideKpi = av.estado === 'Activo' && av.fecha_limite_entrega && av.fecha_limite_entrega.substring(0, 10) < hoy;
    else if (filtroKpi === 'En Proceso') coincideKpi = av.estado === 'Activo' && av.fecha_limite_entrega && av.fecha_limite_entrega.substring(0, 10) >= hoy;

    return coincideTexto && coincideFecha && coincideKpi;
  });

  const avaluosOrdenados = [...avaluosFiltrados].sort((a, b) => {
    if (!orden.clave) return 0;
    let valA = a[orden.clave] || '';
    let valB = b[orden.clave] || '';
    
    if (orden.clave === 'estadoSLA') {
      valA = obtenerEstadoSLA(a);
      valB = obtenerEstadoSLA(b);
    }
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
    if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const indiceUltimo = paginaActual * registrosPorPagina;
  const indicePrimer = indiceUltimo - registrosPorPagina;
  const registrosPaginados = avaluosOrdenados.slice(indicePrimer, indiceUltimo);
  const totalPaginas = Math.ceil(avaluosFiltrados.length / registrosPorPagina);

  // ===== ASIGNAR VENCIMIENTO =====
  const abrirModalTiempos = (avaluo) => {
    setAvaluoEdit(avaluo);
    setNuevaFechaLimite(avaluo.fecha_limite_entrega ? avaluo.fecha_limite_entrega.substring(0, 10) : "");
    setErrorModal("");
    setMostrarModal(true);
  };

  const cerrarModal = () => { setMostrarModal(false); setAvaluoEdit(null); setErrorModal(""); };

  // Cerrar con Escape y enfocar el campo al abrir.
  useEffect(() => {
    if (!mostrarModal) return;
    const alTeclear = (e) => { if (e.key === 'Escape') cerrarModal(); };
    window.addEventListener('keydown', alTeclear);
    const t = setTimeout(() => inputFechaRef.current && inputFechaRef.current.focus(), 50);
    return () => { window.removeEventListener('keydown', alTeclear); clearTimeout(t); };
  }, [mostrarModal]);

  const sumarDias = (dias) => {
    const d = new Date(`${hoy}T00:00:00`);
    d.setDate(d.getDate() + dias);
    setNuevaFechaLimite(d.toISOString().split('T')[0]);
  };

  // Estado que va a quedar el avalúo con la fecha elegida. Se muestra en el
  // modal para que el usuario sepa qué va a pasar antes de guardar.
  const estadoResultante = !nuevaFechaLimite
    ? 'Pendiente'
    : (nuevaFechaLimite < hoy ? 'Atrasado' : 'En Proceso');

  const guardarFecha = async (quitar = false) => {
    if (!avaluoEdit) return;
    setGuardandoFecha(true);
    setErrorModal("");
    try {
      const res = await fetch(`${API}/avaluos/${avaluoEdit.id}/tiempo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_limite: quitar ? null : nuevaFechaLimite })
      });
      if (res.ok) {
        const id = avaluoEdit.id;
        cerrarModal();
        cargarDatos();
        setAviso(quitar || !nuevaFechaLimite
          ? { tipo: 'Pendiente', texto: `Se quitó el vencimiento del avalúo #${id}. Vuelve a Pendiente.` }
          : { tipo: estadoResultante, texto: `Vencimiento del avalúo #${id} guardado. Ahora está ${estadoResultante === 'Atrasado' ? 'Atrasado' : 'En Proceso'}.` });
      } else {
        setErrorModal("El servidor rechazó el cambio. Intenta de nuevo.");
      }
    } catch (e) {
      setErrorModal("No hay conexión con el servidor.");
    } finally {
      setGuardandoFecha(false);
    }
  };

  const finalizarAvaluo = async (id) => {
    if (!window.confirm("¿Marcar este avalúo como Finalizado?")) return;
    try { const res = await fetch(`${API}/avaluos/${id}/finalizar`, { method: 'PUT' }); if (res.ok) { cargarDatos(); setAviso({ tipo: 'Finalizado', texto: `Avalúo #${id} marcado como Finalizado.` }); } } catch (e) {}
  };

  const reactivarAvaluo = async (id) => {
    if (!window.confirm("¿Deseas reactivar este avalúo?")) return;
    try { const res = await fetch(`${API}/avaluos/${id}/reactivar`, { method: 'PUT' }); if (res.ok) { cargarDatos(); setAviso({ tipo: 'Pendiente', texto: `Avalúo #${id} reactivado.` }); } } catch (e) {}
  };

  // === SOLUCIÓN PANTALLA BLANCA DEL PDF ===
  const generarPDF = async (id) => {
    setGenerandoId(id);
    try {
        // Descargamos el archivo como "Blob" en segundo plano
        const response = await fetch(`${API}/avaluos/${id}/pdf`);
        if (response.ok) {
            const blob = await response.blob();
            // Creamos una URL local instantánea con el archivo descargado
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank'); // Abre instantáneo sin pantalla blanca
        } else {
            alert("Error: El servidor no pudo generar el PDF. Revisa los datos.");
        }
    } catch (err) {
        alert("Fallo de conexión al generar PDF.");
    } finally {
        setGenerandoId(null);
    }
  };

  const tarjetas = [
    { clave: 'Pendientes', etiqueta: 'Pendientes', valor: kpis.pendientes, estado: 'Pendiente', pie: 'Sin vencimiento asignado' },
    { clave: 'En Proceso', etiqueta: 'En proceso', valor: kpis.enProceso, estado: 'En Proceso', pie: 'Dentro del plazo' },
    { clave: 'Atrasados', etiqueta: 'Atrasados', valor: kpis.atrasados, estado: 'Atrasado', pie: 'Plazo vencido' }
  ];

  return (
    <div className="ca-dash">
      <style>{`
        .ca-dash { --azul:${AZUL}; --tinta:#1f2937; --suave:#6b7280; --linea:#e5e7eb; --fondo:#f8fafc;
                   animation: caFade .35s ease-out; }
        @keyframes caFade { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }

        /* Encabezado */
        .ca-titulo { font-size:1.35rem; font-weight:700; color:var(--tinta); letter-spacing:-.01em; margin:0; }
        .ca-sub { font-size:.8rem; color:var(--suave); margin:.15rem 0 0; }

        /* Tarjetas KPI: el número va en tinta, el color queda en la barra y el
           punto. Antes el número gigante de color competía con todo. */
        .ca-kpi { position:relative; width:100%; text-align:left; background:#fff; border:1px solid var(--linea);
                  border-radius:12px; padding:1rem 1.1rem; cursor:pointer; transition:box-shadow .18s, border-color .18s, transform .18s;
                  overflow:hidden; }
        .ca-kpi:hover { box-shadow:0 6px 18px rgba(16,24,40,.08); transform:translateY(-1px); }
        .ca-kpi::before { content:''; position:absolute; inset:0 auto 0 0; width:4px; background:var(--acento); }
        .ca-kpi[data-activo="si"] { border-color:var(--acento); box-shadow:0 0 0 3px var(--halo); }
        .ca-kpi-etq { display:flex; align-items:center; gap:.4rem; font-size:.7rem; font-weight:700; letter-spacing:.07em;
                      text-transform:uppercase; color:var(--suave); }
        .ca-punto { width:7px; height:7px; border-radius:50%; background:var(--acento); flex:none; }
        .ca-kpi-num { font-size:2rem; font-weight:700; color:var(--tinta); line-height:1.1; margin:.35rem 0 .1rem; font-variant-numeric:tabular-nums; }
        .ca-kpi-pie { font-size:.7rem; color:var(--suave); }
        .ca-kpi-chip { position:absolute; top:.7rem; right:.8rem; font-size:.62rem; font-weight:700; text-transform:uppercase;
                       letter-spacing:.05em; color:var(--acento); background:var(--halo); padding:.15rem .45rem; border-radius:5px; }

        /* Panel */
        .ca-panel { background:#fff; border:1px solid var(--linea); border-radius:12px; overflow:hidden; }
        .ca-panel-top { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; justify-content:space-between;
                        padding:.9rem 1.1rem; border-bottom:1px solid var(--linea); }
        .ca-panel-tit { font-size:.95rem; font-weight:700; color:var(--tinta); margin:0; }

        /* Campos */
        .ca-campo { position:relative; display:flex; align-items:center; }
        .ca-campo > svg { position:absolute; left:.6rem; color:var(--suave); pointer-events:none; }
        .ca-input { border:1px solid var(--linea); border-radius:8px; padding:.42rem .6rem .42rem 2rem; font-size:.82rem;
                    color:var(--tinta); background:#fff; outline:none; transition:border-color .15s, box-shadow .15s; width:100%; }
        .ca-input:focus { border-color:var(--azul); box-shadow:0 0 0 3px rgba(29,66,154,.12); }
        .ca-limpiar { position:absolute; right:.35rem; border:none; background:transparent; color:var(--suave);
                      display:flex; padding:.2rem; border-radius:5px; cursor:pointer; }
        .ca-limpiar:hover { color:#b91c1c; background:#fee2e2; }



        .ca-btn-primario { display:inline-flex; align-items:center; gap:.4rem; background:var(--azul); color:#fff; border:none;
                           border-radius:8px; padding:.5rem .9rem; font-size:.82rem; font-weight:600; cursor:pointer;
                           transition:filter .15s, box-shadow .15s; }
        .ca-btn-primario:hover { filter:brightness(1.12); box-shadow:0 4px 12px rgba(29,66,154,.25); }

        /* Tabla */
        .ca-tabla { width:100%; border-collapse:collapse; font-size:.83rem; }
        .ca-tabla th { font-size:.68rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--suave);
                       background:var(--fondo); padding:.6rem .75rem; text-align:left; border-bottom:1px solid var(--linea);
                       white-space:nowrap; transition:background .15s; }
        .ca-th-sortable { cursor:pointer; user-select:none; }
        .ca-th-sortable:hover { background:#f1f5f9; color:var(--azul); }
        .ca-th-activo { color:var(--azul); }
        .ca-tabla td { padding:.62rem .75rem; border-bottom:1px solid #f1f5f9; color:var(--tinta); vertical-align:middle; }
        .ca-tabla tbody tr:hover { background:#f9fbff; }
        .ca-tabla tbody tr:last-child td { border-bottom:none; }
        .ca-num { font-variant-numeric:tabular-nums; }
        .ca-id { font-weight:700; color:var(--azul); text-decoration:none; }
        .ca-nombre { font-weight:600; max-width:210px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ca-tag { display:inline-block; font-size:.66rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
                  color:#374151; background:var(--fondo); border:1px solid var(--linea); border-radius:5px; padding:.15rem .45rem; }
        .ca-estado { display:inline-flex; align-items:center; gap:.35rem; font-size:.7rem; font-weight:700; letter-spacing:.03em;
                     border-radius:999px; padding:.22rem .6rem; white-space:nowrap; }
        .ca-vacio { color:var(--suave); font-style:italic; }

        /* Acciones: cada botón lleva su color por defecto (fondo sólido, ícono
           blanco); al pasar el mouse se aclara a blanco con el color en el
           borde y el ícono, como retroalimentación de "vas a hacer clic aquí".
           Paleta en el rango 500-600 (no 700): más viva y menos apagada que
           el ámbar sucio / verde bosque / rojo ladrillo de la primera pasada. */
        .ca-acciones { display:flex; gap:.3rem; justify-content:flex-end; }
        .ca-ico { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px;
                  border:1px solid var(--tono); background:var(--tono); color:#fff; cursor:pointer;
                  box-shadow:0 1px 2px rgba(15,23,42,.12);
                  transition:color .15s, border-color .15s, background .15s, box-shadow .15s, transform .15s; }
        .ca-ico:hover { color:var(--tono); border-color:var(--tono); background:#fff; box-shadow:0 4px 10px rgba(15,23,42,.14); transform:translateY(-1px); }
        .ca-ico:active { transform:translateY(0); }
        .ca-ico:disabled { opacity:.5; cursor:default; box-shadow:none; transform:none; }
        .ca-ico-pdf { width:auto; padding:0 .55rem; gap:.3rem; font-size:.72rem; font-weight:700; }

        .ca-panel-pie { display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; justify-content:space-between;
                        padding:.7rem 1.1rem; border-top:1px solid var(--linea); background:#fcfdff; }
        .ca-pag { display:flex; gap:.35rem; align-items:center; }
        .ca-pag button { border:1px solid var(--linea); background:#fff; color:var(--tinta); border-radius:7px;
                         padding:.32rem .7rem; font-size:.78rem; cursor:pointer; }
        .ca-pag button:hover:not(:disabled) { border-color:var(--azul); color:var(--azul); }
        .ca-pag button:disabled { opacity:.45; cursor:default; }
        .ca-pag-info { font-size:.78rem; color:var(--suave); font-variant-numeric:tabular-nums; }
        .ca-select-pag { border:1px solid var(--linea); border-radius:6px; padding:.2rem .4rem; font-size:.75rem; color:var(--tinta); background:#fff; cursor:pointer; outline:none; transition:border-color .15s; }
        .ca-select-pag:focus { border-color:var(--azul); box-shadow:0 0 0 2px rgba(29,66,154,.12); }

        /* Modal de vencimiento */
        .ca-overlay { position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center;
                      justify-content:center; z-index:1080; padding:1rem; animation:caFade .18s ease-out; }
        .ca-modal { background:#fff; border-radius:14px; width:100%; max-width:440px; box-shadow:0 20px 50px rgba(0,0,0,.3); overflow:hidden; }
        .ca-modal-top { display:flex; align-items:flex-start; gap:.8rem; padding:1.1rem 1.2rem .9rem; border-bottom:1px solid var(--linea); }
        .ca-modal-ico { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:10px;
                        background:#fef3c7; color:#b45309; flex:none; }
        .ca-modal-body { padding:1.1rem 1.2rem; }
        .ca-modal-pie { display:flex; gap:.5rem; justify-content:flex-end; padding:.9rem 1.2rem; background:var(--fondo);
                        border-top:1px solid var(--linea); }
        .ca-etq { display:block; font-size:.7rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
                  color:var(--suave); margin-bottom:.35rem; }
        .ca-fecha { border:1px solid var(--linea); border-radius:8px; padding:.5rem .65rem; font-size:.9rem; width:100%;
                    color:var(--tinta); outline:none; }
        .ca-fecha:focus { border-color:var(--azul); box-shadow:0 0 0 3px rgba(29,66,154,.12); }
        .ca-presets { display:flex; gap:.4rem; margin-top:.55rem; flex-wrap:wrap; }
        .ca-preset { border:1px solid var(--linea); background:#fff; border-radius:999px; padding:.25rem .7rem;
                     font-size:.74rem; color:var(--tinta); cursor:pointer; }
        .ca-preset:hover { border-color:var(--azul); color:var(--azul); background:#f5f8ff; }
        .ca-btn-sec { border:1px solid var(--linea); background:#fff; color:var(--tinta); border-radius:8px;
                      padding:.45rem .9rem; font-size:.82rem; cursor:pointer; }
        .ca-btn-sec:hover { border-color:var(--suave); }
        .ca-btn-quitar { border:1px solid #fecaca; background:#fff; color:#b91c1c; border-radius:8px;
                         padding:.45rem .9rem; font-size:.82rem; cursor:pointer; margin-right:auto; }
        .ca-btn-quitar:hover { background:#fee2e2; }
        .ca-error { font-size:.78rem; color:#b91c1c; background:#fee2e2; border-radius:7px; padding:.45rem .6rem; margin-top:.7rem; }

        /* Aviso de confirmación */
        .ca-aviso { position:fixed; right:1.1rem; bottom:1.1rem; z-index:1090; display:flex; align-items:center; gap:.55rem;
                    background:#fff; border:1px solid var(--linea); border-left:4px solid var(--acento); border-radius:10px;
                    padding:.7rem .9rem; box-shadow:0 12px 30px rgba(16,24,40,.14); font-size:.82rem; color:var(--tinta);
                    max-width:340px; animation:caFade .2s ease-out; }
      `}</style>

      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h3 className="ca-titulo">Control de Tiempos</h3>
          <p className="ca-sub">Seguimiento de radicados y plazos de entrega</p>
        </div>
        <button className="ca-btn-primario" onClick={onNuevo}>
          <Icono nombre="mas" /> Nuevo Avalúo
        </button>
      </div>

      <div className="row g-3 mb-3">
        {tarjetas.map(t => {
          const e = ESTADOS[t.estado];
          const activo = filtroKpi === t.clave;
          return (
            <div className="col-md-4" key={t.clave}>
              <button
                type="button"
                className="ca-kpi"
                data-activo={activo ? 'si' : 'no'}
                style={{ '--acento': e.punto, '--halo': e.fondo }}
                onClick={() => toggleFiltroKpi(t.clave)}
                title={activo ? 'Quitar filtro' : `Filtrar por ${t.etiqueta}`}
              >
                {activo && <span className="ca-kpi-chip">Filtrando</span>}
                <span className="ca-kpi-etq"><span className="ca-punto" />{t.etiqueta}</span>
                <div className="ca-kpi-num">{t.valor}</div>
                <span className="ca-kpi-pie">{t.pie}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="ca-panel">
        <div className="ca-panel-top">
          <h5 className="ca-panel-tit">
            Monitoreo de Radicados
            {filtroKpi && (
              <span className="ca-estado ms-2" style={{ background: ESTADOS[filtroKpi === 'Pendientes' ? 'Pendiente' : filtroKpi === 'Atrasados' ? 'Atrasado' : 'En Proceso'].fondo, color: ESTADOS[filtroKpi === 'Pendientes' ? 'Pendiente' : filtroKpi === 'Atrasados' ? 'Atrasado' : 'En Proceso'].color }}>
                {filtroKpi}
                <span role="button" onClick={() => setFiltroKpi(null)} title="Quitar filtro" style={{ display: 'inline-flex', cursor: 'pointer' }}><Icono nombre="x" size={11} /></span>
              </span>
            )}
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            <div className="ca-campo" style={{ width: '190px' }}>
              <Icono nombre="calendario" size={14} />
              <input type="date" className="ca-input" value={fechaVisitaFiltro}
                     onChange={(e) => { setFechaVisitaFiltro(e.target.value); setPaginaActual(1); }}
                     title="Filtrar por fecha de visita" />
              {fechaVisitaFiltro && <button className="ca-limpiar" onClick={() => setFechaVisitaFiltro("")} title="Quitar fecha"><Icono nombre="x" size={13} /></button>}
            </div>
            <div className="ca-campo" style={{ width: '250px' }}>
              <Icono nombre="buscar" size={14} />
              <input type="text" className="ca-input" placeholder="Buscar ID, nombre o documento"
                     value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} />
              {busqueda && <button className="ca-limpiar" onClick={() => setBusqueda("")} title="Limpiar"><Icono nombre="x" size={13} /></button>}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="ca-tabla">
            <thead>
              <tr>
                <th className={`ca-th-sortable ${orden.clave === 'id' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'id', direccion: orden.clave === 'id' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>ID {orden.clave === 'id' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th className={`ca-th-sortable ${orden.clave === 'solicitante' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'solicitante', direccion: orden.clave === 'solicitante' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>Solicitante {orden.clave === 'solicitante' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th className={`ca-th-sortable ${orden.clave === 'documento' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'documento', direccion: orden.clave === 'documento' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>Documento {orden.clave === 'documento' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th className={`ca-th-sortable ${orden.clave === 'tipo_avaluo' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'tipo_avaluo', direccion: orden.clave === 'tipo_avaluo' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>Tipo {orden.clave === 'tipo_avaluo' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th className={`ca-th-sortable ${orden.clave === 'fecha_visita' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'fecha_visita', direccion: orden.clave === 'fecha_visita' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>F. visita {orden.clave === 'fecha_visita' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th className={`ca-th-sortable ${orden.clave === 'fecha_limite_entrega' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'fecha_limite_entrega', direccion: orden.clave === 'fecha_limite_entrega' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>Vencimiento {orden.clave === 'fecha_limite_entrega' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th className={`ca-th-sortable ${orden.clave === 'estadoSLA' ? 'ca-th-activo' : ''}`} onClick={() => setOrden({ clave: 'estadoSLA', direccion: orden.clave === 'estadoSLA' && orden.direccion === 'asc' ? 'desc' : 'asc' })}>Estado {orden.clave === 'estadoSLA' ? (orden.direccion === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosPaginados.length > 0 ? registrosPaginados.map((av) => {
                const texto = obtenerEstadoSLA(av);
                const e = ESTADOS[texto];
                const vencido = texto === 'Atrasado';
                return (
                  <tr key={av.id}>
                    <td><a className="ca-id" href="#" onClick={(ev) => { ev.preventDefault(); onEditar(av.id); }} title="Abrir expediente">#{av.id}</a></td>
                    <td><div className="ca-nombre" title={av.solicitante}>{av.solicitante || '—'}</div></td>
                    <td className="ca-num" style={{ color: '#374151', fontWeight: '500' }}>{av.documento || '—'}</td>
                    <td><span className="ca-tag">{av.tipo_avaluo || '—'}</span></td>
                    <td className="ca-num" style={{ color: '#374151', fontWeight: '500' }}>{fmtFecha(av.fecha_visita)}</td>
                    <td className="ca-num">
                      {av.fecha_limite_entrega
                        ? <span style={{ fontWeight: 600, color: vencido ? '#b91c1c' : 'var(--tinta)' }}>{fmtFecha(av.fecha_limite_entrega)}</span>
                        : <span className="ca-vacio">Sin definir</span>}
                    </td>
                    <td><span className="ca-estado" style={{ background: e.fondo, color: e.color }}><span className="ca-punto" style={{ '--acento': e.punto, background: e.punto }} />{texto}</span></td>
                    <td>
                      <div className="ca-acciones">
                        <button className="ca-ico" style={{ '--tono': AZUL }}
                                onClick={() => onEditar(av.id)} title="Editar expediente"><Icono nombre="lapiz" /></button>

                        {av.estado !== 'Finalizado' && (
                          <>
                            <button className="ca-ico" style={{ '--tono': '#f59e0b' }}
                                    onClick={() => abrirModalTiempos(av)} title="Asignar vencimiento"><Icono nombre="reloj" /></button>
                            <button className="ca-ico" style={{ '--tono': '#059669' }}
                                    onClick={() => finalizarAvaluo(av.id)} title="Marcar como entregado"><Icono nombre="check" /></button>
                          </>
                        )}

                        {av.estado === 'Finalizado' && (
                          <button className="ca-ico" style={{ '--tono': '#475569' }}
                                  onClick={() => reactivarAvaluo(av.id)} title="Reactivar"><Icono nombre="reactivar" /></button>
                        )}

                        <button className="ca-ico ca-ico-pdf" style={{ '--tono': '#ef4444' }}
                                onClick={() => generarPDF(av.id)} disabled={generandoId === av.id}
                                title="Generar informe PDF">
                          <Icono nombre="pdf" size={14} />{generandoId === av.id ? 'Generando…' : 'PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--suave)' }}>
                  No hay radicados que coincidan con los filtros.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ca-panel-pie">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className="ca-pag-info">
              {avaluosFiltrados.length > 0
                ? <>Mostrando <strong>{indicePrimer + 1}–{Math.min(indiceUltimo, avaluosFiltrados.length)}</strong> de <strong>{avaluosFiltrados.length}</strong></>
                : 'Sin resultados'}
            </span>
            <select className="ca-select-pag" value={registrosPorPagina} onChange={(e) => { setRegistrosPorPagina(Number(e.target.value)); setPaginaActual(1); }}>
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
          <div className="ca-pag">
            <button onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}>Anterior</button>
            <span className="ca-pag-info px-1">Página {totalPaginas === 0 ? 0 : paginaActual} de {totalPaginas}</span>
            <button onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas || totalPaginas === 0}>Siguiente</button>
          </div>
        </div>
      </div>

      {/* MODAL DE VENCIMIENTO — faltaba por completo: el botón cambiaba el
          estado pero no había nada que renderizar. */}
      {mostrarModal && avaluoEdit && (
        <div className="ca-overlay" onClick={cerrarModal}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ca-modal-top">
              <div className="ca-modal-ico"><Icono nombre="reloj-grande" size={20} /></div>
              <div>
                <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--tinta)' }}>Asignar vencimiento</h5>
                <p style={{ margin: '.15rem 0 0', fontSize: '.8rem', color: 'var(--suave)' }}>
                  Avalúo <strong>#{avaluoEdit.id}</strong> · {avaluoEdit.solicitante || 'Sin solicitante'}
                </p>
              </div>
            </div>

            <div className="ca-modal-body">
              <label className="ca-etq" htmlFor="ca-fecha-limite">Fecha límite de entrega</label>
              <input id="ca-fecha-limite" ref={inputFechaRef} type="date" className="ca-fecha"
                     value={nuevaFechaLimite}
                     onChange={(e) => setNuevaFechaLimite(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') guardarFecha(false); }} />

              <div className="ca-presets">
                <button type="button" className="ca-preset" onClick={() => sumarDias(7)}>+ 7 días</button>
                <button type="button" className="ca-preset" onClick={() => sumarDias(15)}>+ 15 días</button>
                <button type="button" className="ca-preset" onClick={() => sumarDias(30)}>+ 30 días</button>
              </div>

              <div style={{ marginTop: '.9rem', fontSize: '.8rem', color: 'var(--suave)' }}>
                El avalúo quedará en{' '}
                <span className="ca-estado" style={{ background: ESTADOS[estadoResultante].fondo, color: ESTADOS[estadoResultante].color }}>
                  <span className="ca-punto" style={{ background: ESTADOS[estadoResultante].punto }} />{estadoResultante}
                </span>
                {estadoResultante === 'Atrasado' && <span style={{ color: '#b91c1c' }}> — la fecha ya pasó.</span>}
                {estadoResultante === 'Pendiente' && <span> — sin fecha no se controla el plazo.</span>}
              </div>

              {errorModal && <div className="ca-error">{errorModal}</div>}
            </div>

            <div className="ca-modal-pie">
              {avaluoEdit.fecha_limite_entrega && (
                <button className="ca-btn-quitar" onClick={() => guardarFecha(true)} disabled={guardandoFecha}>
                  Quitar vencimiento
                </button>
              )}
              <button className="ca-btn-sec" onClick={cerrarModal} disabled={guardandoFecha}>Cancelar</button>
              <button className="ca-btn-primario" onClick={() => guardarFecha(false)} disabled={guardandoFecha || !nuevaFechaLimite}>
                {guardandoFecha ? 'Guardando…' : 'Guardar vencimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div className="ca-aviso" style={{ '--acento': ESTADOS[aviso.tipo].punto }}>
          <span className="ca-punto" style={{ background: ESTADOS[aviso.tipo].punto }} />
          <span>{aviso.texto}</span>
        </div>
      )}
    </div>
  );
}
