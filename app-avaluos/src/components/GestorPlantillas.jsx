import { useState, useEffect } from 'react';

const BLOQUES_DISPONIBLES = [
  { id: 'b_general', label: '■ 1. Información General y Solicitante' },
  { id: 'b_ubicacion', label: '■ 2. Ubicación, Entorno y Urbanismo' },
  { id: 'b_equipamiento', label: '■ Equipamiento Urbano (Tabla)' },
  { id: 'b_juridico', label: '■ 3. Aspectos Jurídicos y Titulación' },
  { id: 'b_areas', label: '■ 4. Características Físicas y Áreas' },
  { id: 'b_estructura', label: '■ 5. Elementos Estructurales' },
  { id: 'b_acabados', label: '■ 6. Detalle de Acabados y Dependencias' },
  { id: 'b_comunal', label: '■ 7. Dotación Comunal y Administración' },
  { id: 'b_mercado', label: '■ 8. Análisis de Mercado' },
  { id: 'b_liquidacion', label: '■ 9. Resumen de Valoración (Liquidación)' },
  { id: 'b_fotos', label: '■ 10 y 11. Registro Fotográfico (Anexos)' }
];

export default function GestorPlantillas() {
  const [plantillas, setPlantillas] = useState([]);
  const [vista, setVista] = useState('lista'); 
  
  const [nombrePlantilla, setNombrePlantilla] = useState('Nueva Plantilla Personalizada');
  const [imagenFondo, setImagenFondo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [ejeX, setEjeX] = useState(0); 
  const [ejeY, setEjeY] = useState(0); 
  const [escala, setEscala] = useState(100); 
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState(BLOQUES_DISPONIBLES.map(b => b.id));

  const cargarPlantillas = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/plantillas');
      const data = await res.json();
      setPlantillas(data);
    } catch (e) { console.error("Error al cargar plantillas"); }
  };

  useEffect(() => { cargarPlantillas(); }, []);

  const manejarSubidaFondo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFondo(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleBloque = (id) => {
    if (bloquesSeleccionados.includes(id)) {
      setBloquesSeleccionados(bloquesSeleccionados.filter(b => b !== id));
    } else {
      setBloquesSeleccionados([...bloquesSeleccionados, id]);
    }
  };

  const guardarPlantilla = async () => {
    if (!nombrePlantilla) return alert("Ponle un nombre a la plantilla.");
    
    const paquete = new FormData();
    const config = { nombre: nombrePlantilla, ejeX, ejeY, escala, bloquesSeleccionados };
    paquete.append('configuracion', JSON.stringify(config));
    
    if (imagenFondo) paquete.append('membrete', imagenFondo);

    try {
        const res = await fetch('http://localhost:3000/api/plantillas', { method: 'POST', body: paquete });
        if (res.ok) {
            alert("¡Plantilla maquetada y guardada con éxito!");
            cargarPlantillas();
            setVista('lista');
        }
    } catch (e) { alert("Error de conexión al servidor."); }
  };

  const fijarPredeterminada = async (id) => {
      try {
          const res = await fetch(`http://localhost:3000/api/plantillas/${id}/activa`, { method: 'PUT' });
          if (res.ok) cargarPlantillas();
      } catch(e) { alert("Error de conexión."); }
  };

  if (vista === 'editor') {
    return (
      <div className="container-fluid fade-in">
        <style>{`
          .lienzo-carta { width: 215.9mm; height: 279.4mm; background-color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); position: relative; overflow: hidden; margin: 0 auto; transform: scale(0.65); transform-origin: top center; }
          .marca-agua { position: absolute; transition: all 0.1s ease; }
          .zona-segura { position: absolute; top: 45mm; bottom: 30mm; left: 20mm; right: 20mm; border: 2px dashed rgba(29, 66, 154, 0.4); background: rgba(255,255,255,0.85); padding: 10mm; font-size: 10px; color: #555; display: flex; flex-direction: column; gap: 10px; }
          .bloque-fantasma { background: #f4f6f9; border: 1px solid #dee2e6; padding: 10px; font-weight: bold; color: #1d429a;}
        `}</style>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary mb-0">🎨 Editor de Plantillas</h4>
          <div>
            <button className="btn btn-outline-secondary me-2 fw-bold" onClick={() => setVista('lista')}>Cancelar</button>
            <button className="btn btn-success fw-bold px-4" onClick={guardarPlantilla}>💾 Guardar Diseño</button>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <label className="fw-bold text-muted small">Nombre de la Plantilla</label>
                <input className="form-control border-primary mb-3" value={nombrePlantilla} onChange={e => setNombrePlantilla(e.target.value)} />

                <label className="fw-bold text-muted small">Membrete / Fondo (Imagen)</label>
                <input type="file" className="form-control form-control-sm mb-4" accept="image/*" onChange={manejarSubidaFondo} />

                <h6 className="fw-bold text-primary border-bottom pb-2">Ojo Milimétrico (Ajuste Visual)</h6>
                
                <label className="small fw-bold mt-2 d-flex justify-content-between"><span>Eje X (Izquierda/Derecha)</span> <span>{ejeX} mm</span></label>
                <input type="range" className="form-range" min="-100" max="100" value={ejeX} onChange={e => setEjeX(Number(e.target.value))} />

                <label className="small fw-bold mt-2 d-flex justify-content-between"><span>Eje Y (Arriba/Abajo)</span> <span>{ejeY} mm</span></label>
                <input type="range" className="form-range" min="-100" max="100" value={ejeY} onChange={e => setEjeY(Number(e.target.value))} />

                <label className="small fw-bold mt-2 d-flex justify-content-between"><span>Escala (Zoom)</span> <span>{escala}%</span></label>
                <input type="range" className="form-range" min="50" max="150" value={escala} onChange={e => setEscala(Number(e.target.value))} />
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-header bg-white"><h6 className="fw-bold text-primary mb-0">Contenido Dinámico</h6></div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <p className="small text-muted mb-3">Marca los bloques que deseas imprimir en este documento.</p>
                {BLOQUES_DISPONIBLES.map(bloque => (
                  <div className="form-check mb-2" key={bloque.id}>
                    <input className="form-check-input" type="checkbox" id={bloque.id} checked={bloquesSeleccionados.includes(bloque.id)} onChange={() => toggleBloque(bloque.id)} />
                    <label className="form-check-label small fw-bold text-secondary" htmlFor={bloque.id}>{bloque.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-8 bg-light rounded d-flex justify-content-center pt-4" style={{ minHeight: '800px' }}>
            <div className="lienzo-carta">
              {previewUrl ? (
                <img src={previewUrl} className="marca-agua" style={{ top: `${ejeY}mm`, left: `${ejeX}mm`, width: `${escala}%`, height: 'auto' }} />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted" style={{ background: '#eee' }}>Sube un membrete para previsualizar</div>
              )}
              
              <div className="zona-segura">
                <div className="text-center fw-bold text-danger mb-2 border-bottom border-danger pb-2">ZONA DE IMPRESIÓN DINÁMICA (Texto seguro)</div>
                {BLOQUES_DISPONIBLES.filter(b => bloquesSeleccionados.includes(b.id)).map((bloque, index) => (
                  <div key={bloque.id} className="bloque-fantasma">{bloque.label} <span className="float-end text-muted fw-normal">Pág {Math.ceil((index + 1) / 4)}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 fade-in">
      <div className="card-header bg-white py-4 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold" style={{ color: '#1d429a' }}>GESTOR DE PLANTILLAS PDF</h5>
        <button className="btn btn-primary fw-bold" onClick={() => setVista('editor')}>+ Crear Nueva Plantilla</button>
      </div>
      <div className="card-body p-0">
        <table className="table table-hover align-middle mb-0 text-center">
          <thead className="table-light"><tr><th>ID</th><th>Nombre del Diseño</th><th>Fecha Creación</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {plantillas.length > 0 ? plantillas.map(p => (
              <tr key={p.id}>
                <td className="fw-bold text-primary">#{p.id}</td>
                <td className="fw-bold">{p.nombre}</td>
                <td>{new Date(p.fecha_creacion).toLocaleDateString()}</td>
                <td>{p.es_predeterminada === 1 ? <span className="badge bg-success">Activa Oficial</span> : <span className="badge bg-secondary">Borrador</span>}</td>
                <td>
                  {p.es_predeterminada === 0 && <button className="btn btn-sm btn-outline-success fw-bold" onClick={() => fijarPredeterminada(p.id)}>Fijar como Oficial</button>}
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="py-4 text-muted">No hay plantillas guardadas. Crea la primera.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}