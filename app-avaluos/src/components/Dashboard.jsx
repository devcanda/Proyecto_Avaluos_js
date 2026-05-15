import { useState, useEffect } from 'react'

export default function Dashboard({ setVistaActiva, onEditar, onNuevo }) {
  const [kpis, setKpis] = useState({ pendientes: 0, enProceso: 0, atrasados: 0 });
  const [avaluos, setAvaluos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaVisitaFiltro, setFechaVisitaFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;
  const [filtroKpi, setFiltroKpi] = useState(null);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [avaluoEdit, setAvaluoEdit] = useState(null);
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState("");
  
  const [generandoId, setGenerandoId] = useState(null);

  const hoy = new Date().toISOString().split('T')[0];

  const cargarDatos = () => {
    fetch('http://localhost:3000/api/dashboard').then(res => res.json()).then(data => setKpis(data));
    fetch('http://localhost:3000/api/avaluos').then(res => res.json()).then(data => setAvaluos(data));
  };

  useEffect(() => { cargarDatos(); }, []);

  const toggleFiltroKpi = (tipo) => { if (filtroKpi === tipo) setFiltroKpi(null); else { setFiltroKpi(tipo); setPaginaActual(1); } };

  const obtenerEstadoSLA = (av) => {
    if (av.estado === 'Finalizado') return { texto: 'Finalizado', color: 'bg-success' };
    if (av.estado === 'Inactivo') return { texto: 'Inactivo', color: 'bg-secondary' };
    if (!av.fecha_limite_entrega) return { texto: 'Pendiente', color: 'bg-info text-dark' };
    if (av.fecha_limite_entrega.substring(0, 10) < hoy) return { texto: 'Atrasado', color: 'bg-danger' };
    return { texto: 'En Proceso', color: 'bg-warning text-dark' };
  };

  const avaluosFiltrados = avaluos.filter((av) => {
    const termino = busqueda.toLowerCase();
    const coincideTexto = av.id.toString().includes(termino) || (av.solicitante && av.solicitante.toLowerCase().includes(termino)) || (av.documento && av.documento.toString().includes(termino));
    let coincideFecha = true;
    if (fechaVisitaFiltro && av.fecha_vis_formato) coincideFecha = av.fecha_vis_formato === fechaVisitaFiltro;
    else if (fechaVisitaFiltro && !av.fecha_vis_formato) coincideFecha = false;
    let coincideKpi = true;
    if (filtroKpi === 'Pendientes') coincideKpi = av.estado === 'Activo' && !av.fecha_limite_entrega;
    else if (filtroKpi === 'Atrasados') coincideKpi = av.estado === 'Activo' && av.fecha_limite_entrega && av.fecha_limite_entrega.substring(0, 10) < hoy;
    else if (filtroKpi === 'En Proceso') coincideKpi = av.estado === 'Activo' && av.fecha_limite_entrega && av.fecha_limite_entrega.substring(0, 10) >= hoy;
    return coincideTexto && coincideFecha && coincideKpi;
  });

  const indiceUltimo = paginaActual * registrosPorPagina;
  const indicePrimer = indiceUltimo - registrosPorPagina;
  const registrosPaginados = avaluosFiltrados.slice(indicePrimer, indiceUltimo);
  const totalPaginas = Math.ceil(avaluosFiltrados.length / registrosPorPagina);

  const abrirModalTiempos = (avaluo) => { setAvaluoEdit(avaluo); setNuevaFechaLimite(avaluo.fecha_limite_entrega ? avaluo.fecha_limite_entrega.substring(0, 10) : ""); setMostrarModal(true); };

  const guardarFecha = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/avaluos/${avaluoEdit.id}/tiempo`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha_limite: nuevaFechaLimite }) });
      if (res.ok) { setMostrarModal(false); cargarDatos(); }
    } catch (e) { alert("Error de conexión."); }
  };

  const finalizarAvaluo = async (id) => {
    if (!window.confirm("¿Marcar este avalúo como Finalizado?")) return;
    try { const res = await fetch(`http://localhost:3000/api/avaluos/${id}/finalizar`, { method: 'PUT' }); if (res.ok) cargarDatos(); } catch (e) {}
  };

  const reactivarAvaluo = async (id) => {
    if (!window.confirm("¿Deseas reactivar este avalúo?")) return;
    try { const res = await fetch(`http://localhost:3000/api/avaluos/${id}/reactivar`, { method: 'PUT' }); if (res.ok) cargarDatos(); } catch (e) {}
  };

  // === SOLUCIÓN PANTALLA BLANCA DEL PDF ===
  const generarPDF = async (id) => {
    setGenerandoId(id); 
    try {
        // Descargamos el archivo como "Blob" en segundo plano
        const response = await fetch(`http://localhost:3000/api/avaluos/${id}/pdf`);
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

  return (
    <div className="fade-in">
      <style>{`
        .btn-editar-custom { background-color: #0d6efd; color: white; border: 1px solid #0d6efd; } .btn-editar-custom:hover { background-color: white; color: #0d6efd; }
        .btn-tiempo-custom { background-color: #ffc107; color: #000; border: 1px solid #ffc107; } .btn-tiempo-custom:hover { background-color: white; color: #ffc107; }
        .btn-pdf-custom { background-color: #dc3545; color: white; border: 1px solid #dc3545; } .btn-pdf-custom:hover { background-color: white; color: black; border: 1px solid #dc3545; }
        .btn-nuevo-custom { background-color: #1d429a; color: white; font-weight: bold; }
        .btn-finalizar-custom { background-color: #198754; color: white; border: 1px solid #198754; } .btn-finalizar-custom:hover { background-color: white; color: #198754; }
        .btn-reactivar-custom { background-color: #6c757d; color: white; border: 1px solid #6c757d; } .btn-reactivar-custom:hover { background-color: white; color: #6c757d; }
        .card-kpi { cursor: pointer; transition: all 0.2s; } .card-kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; }
        .kpi-pressed { transform: scale(0.96); box-shadow: inset 0 4px 6px rgba(0,0,0,0.15) !important; opacity: 0.95; }
        .kpi-pressed.border-info { background-color: #eaf8fc !important; border-left-width: 8px !important; }
        .kpi-pressed.border-warning { background-color: #fff9e6 !important; border-left-width: 8px !important; }
        .kpi-pressed.border-danger { background-color: #fceeee !important; border-left-width: 8px !important; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <h3 className="mb-4 fw-bold text-secondary">Control de Tiempos</h3>
      
      <div className="row mb-4">
        <div className="col-md-4 mb-2"><div className={`card shadow-sm border-0 border-start border-info border-4 card-kpi ${filtroKpi === 'Pendientes' ? 'kpi-pressed' : ''}`} onClick={() => toggleFiltroKpi('Pendientes')}><div className="card-body"><h6 className="text-muted text-uppercase mb-2">Pendientes</h6><h2 className="fw-bold text-info">{kpis.pendientes}</h2></div></div></div>
        <div className="col-md-4 mb-2"><div className={`card shadow-sm border-0 border-start border-warning border-4 card-kpi ${filtroKpi === 'En Proceso' ? 'kpi-pressed' : ''}`} onClick={() => toggleFiltroKpi('En Proceso')}><div className="card-body"><h6 className="text-muted text-uppercase mb-2">En Proceso</h6><h2 className="fw-bold text-warning">{kpis.enProceso}</h2></div></div></div>
        <div className="col-md-4 mb-2"><div className={`card shadow-sm border-0 border-start border-danger border-4 card-kpi ${filtroKpi === 'Atrasados' ? 'kpi-pressed' : ''}`} onClick={() => toggleFiltroKpi('Atrasados')}><div className="card-body"><h6 className="text-muted text-uppercase mb-2">Atrasados</h6><h2 className="fw-bold text-danger">{kpis.atrasados}</h2></div></div></div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <h5 className="mb-0 fw-bold text-secondary">Monitoreo de Radicados {filtroKpi && <span className="badge bg-secondary ms-2 small">Filtro: {filtroKpi}</span>}</h5>
          <div className="d-flex flex-grow-1 justify-content-center gap-2">
            <div className="input-group input-group-sm" style={{ maxWidth: '220px' }}><span className="input-group-text bg-light border-primary fw-bold">📅 F. Visita</span><input type="date" className="form-control border-primary" value={fechaVisitaFiltro} onChange={(e) => { setFechaVisitaFiltro(e.target.value); setPaginaActual(1); }} />{fechaVisitaFiltro && <button className="btn btn-outline-danger" onClick={() => setFechaVisitaFiltro("")}>✖</button>}</div>
            <div style={{ width: '250px' }}><input type="text" className="form-control form-control-sm border-primary" placeholder="🔍 Buscar ID, Nombre o Doc..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} /></div>
          </div>
          <button className="btn btn-sm btn-nuevo-custom shadow-sm px-3" onClick={onNuevo}>+ Nuevo Avalúo</button>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 text-center align-middle" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light"><tr><th>ID</th><th>Solicitante</th><th># Documento</th><th>T. Avalúo</th><th>F. Visita</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {registrosPaginados.length > 0 ? (
                  registrosPaginados.map((av) => {
                    const estadoSLA = obtenerEstadoSLA(av);
                    return (
                      <tr key={av.id}>
                        <td className="fw-bold text-primary">#{av.id}</td><td className="text-truncate" style={{ maxWidth: '160px' }}>{av.solicitante}</td><td>{av.documento}</td><td><span className="badge bg-light text-dark border">{av.tipo_avaluo}</span></td><td>{av.fecha_visita ? new Date(av.fecha_visita).toLocaleDateString() : '-'}</td>
                        <td>{av.fecha_limite_entrega ? (<span className={`fw-bold ${new Date(av.fecha_limite_entrega) < new Date(hoy) && av.estado === 'Activo' ? 'text-danger' : 'text-success'}`}>{new Date(av.fecha_limite_entrega).toLocaleDateString()}</span>) : (<span className="text-muted fst-italic">Sin definir</span>)}</td>
                        <td><span className={`badge ${estadoSLA.color}`}>{estadoSLA.texto}</span></td>
                        <td>
                          <button className="btn btn-sm btn-editar-custom me-1" onClick={() => onEditar(av.id)} title="Editar">✏️</button>
                          {av.estado !== 'Finalizado' && (<><button className="btn btn-sm btn-tiempo-custom me-1" onClick={() => abrirModalTiempos(av)} title="Asignar Vencimiento">⏲️</button><button className="btn btn-sm btn-finalizar-custom me-1 fw-bold" onClick={() => finalizarAvaluo(av.id)} title="Entregado">✅</button></>)}
                          {av.estado === 'Finalizado' && (<button className="btn btn-sm btn-reactivar-custom me-1 fw-bold" onClick={() => reactivarAvaluo(av.id)} title="Reactivar">🔄</button>)}
                          
                          <button 
                            className={`btn btn-sm fw-bold ${generandoId === av.id ? 'btn-secondary' : 'btn-pdf-custom'}`} 
                            onClick={() => generarPDF(av.id)} 
                            disabled={generandoId === av.id}
                          >
                            {generandoId === av.id ? '⏳ Generando...' : 'PDF'}
                          </button>

                        </td>
                      </tr>
                    );
                  })
                ) : (<tr><td colSpan="8" className="py-4 text-muted">No hay resultados para este filtro...</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
          <span className="text-muted small">Mostrando {indicePrimer + 1} a {Math.min(indiceUltimo, avaluosFiltrados.length)} de {avaluosFiltrados.length}</span>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button></li>
            <li className={`page-item ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}