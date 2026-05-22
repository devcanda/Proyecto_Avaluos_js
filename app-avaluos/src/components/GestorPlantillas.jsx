import React, { useState, useEffect } from 'react';

const VARIABLES_DISPONIBLES = [
  { token: '{{id}}', label: 'Radicado / ID' },
  { token: '{{Solicitante}}', label: 'Nombre Solicitante' },
  { token: '{{NumeroDocumento}}', label: 'Identificación' },
  { token: '{{Direccion}}', label: 'Dirección Predio' },
  { token: '{{TipoDeAvaluo}}', label: 'Tipo de Avalúo' },
  { token: '{{AreaLote}}', label: 'Área Lote' },
  { token: '{{AreaValorada}}', label: 'Área Valorada Final' },
  { token: '{{Departamento}}', label: 'Departamento' },
  { token: '{{Municipio}}', label: 'Municipio' }
];

const BLOQUES_PREDEFINIDOS = [
  { tipo: 'titulo', label: 'Título Libre', default: { id: Date.now(), tipo: 'titulo', contenido: 'NUEVO TÍTULO', alineacion: 'center', fontSize: '14px', color: '#1a2b4c' } },
  { tipo: 'texto_libre', label: 'Texto Libre', default: { id: Date.now(), tipo: 'texto_libre', contenido: 'Escriba un texto aquí o agregue {{variables}}.', alineacion: 'left' } },
  { tipo: 'seccion_general_imagenes', label: '1. General e Imágenes', default: { id: Date.now(), tipo: 'seccion_general_imagenes' } },
  { tipo: 'seccion_areas_normatividad', label: '2. Aspectos Jurídicos y Áreas', default: { id: Date.now(), tipo: 'seccion_areas_normatividad' } },
  { tipo: 'seccion_predio_dotacion', label: '3. Predio y Dotación', default: { id: Date.now(), tipo: 'seccion_predio_dotacion' } },
  { tipo: 'seccion_croquis', label: '4. Croquis', default: { id: Date.now(), tipo: 'seccion_croquis' } },
  { tipo: 'seccion_sector', label: '5. Sector y Estructura', default: { id: Date.now(), tipo: 'seccion_sector' } },
  { tipo: 'seccion_comparables_valoracion', label: '6. Comparables/Valor', default: { id: Date.now(), tipo: 'seccion_comparables_valoracion' } },
  { tipo: 'seccion_usos_propuestos', label: '7. Usos Propuestos', default: { id: Date.now(), tipo: 'seccion_usos_propuestos' } },
  { tipo: 'seccion_textos_legales', label: '8. Textos Legales', default: { id: Date.now(), tipo: 'seccion_textos_legales' } }
];

export default function GestorPlantillas() {
  const [nombrePlantilla, setNombrePlantilla] = useState('Diseño Plantilla Oficial');
  const [imagenFondo, setImagenFondo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Controles de Membrete
  const [ejeX, setEjeX] = useState(0);
  const [ejeY, setEjeY] = useState(0);
  const [escala, setEscala] = useState(100);

  // Lienzo
  const [elementosLienzo, setElementosLienzo] = useState([
    { id: 1, tipo: 'seccion_general_imagenes' },
    { id: 2, tipo: 'seccion_sector' },
    { id: 3, tipo: 'seccion_areas_normatividad' },
    { id: 4, tipo: 'seccion_predio_dotacion' },
    { id: 5, tipo: 'seccion_croquis' },
    { id: 6, tipo: 'seccion_comparables_valoracion' },
    { id: 7, tipo: 'seccion_usos_propuestos' },
    { id: 8, tipo: 'seccion_textos_legales' }
  ]);

  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  const [draggedItem, setDraggedItem] = useState(null);

  // Manejo de imagen de fondo
  const handleFondoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFondo(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const agregarBloque = (bloqueDef) => {
    setElementosLienzo([...elementosLienzo, { ...bloqueDef.default, id: Date.now() }]);
  };

  const eliminarBloque = (id) => {
    setElementosLienzo(elementosLienzo.filter(b => b.id !== id));
  };

  const actualizarBloque = (id, nuevosDatos) => {
    setElementosLienzo(elementosLienzo.map(b => b.id === id ? { ...b, ...nuevosDatos } : b));
  };

  const guardarEstructura = async () => {
    try {
      const config = { nombre: nombrePlantilla, ejeX, ejeY, escala, estructuraLienzo: elementosLienzo };
      const formData = new FormData();
      formData.append('configuracion', JSON.stringify(config));
      if (imagenFondo) formData.append('membrete', imagenFondo);

      const response = await fetch('http://localhost:3000/api/plantillas', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        mostrarNotificacion('¡Plantilla guardada y configurada como predeterminada con éxito!', 'success');
      } else {
        mostrarNotificacion('Error al guardar la plantilla.', 'danger');
      }
    } catch (error) {
      mostrarNotificacion('Error de conexión con el servidor.', 'danger');
    }
  };

  const mostrarNotificacion = (mensaje, tipo) => {
    setNotificacion({ mostrar: true, mensaje, tipo });
    setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'success' }), 3000);
  };

  // UI Components helpers
  const renderBloque = (bloque, index) => {
    return (
      <div 
        key={bloque.id} 
        className="card mb-3 shadow-sm border-0 position-relative"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(5px)',
          transition: 'all 0.3s ease',
          cursor: 'grab'
        }}
        draggable
        onDragStart={() => setDraggedItem(index)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
            const nuevos = [...elementosLienzo];
            const item = nuevos.splice(draggedItem, 1)[0];
            nuevos.splice(index, 0, item);
            setElementosLienzo(nuevos);
            setDraggedItem(null);
        }}
      >
        <div className="card-header bg-light d-flex justify-content-between align-items-center py-2 border-0">
          <span className="badge bg-secondary text-uppercase" style={{fontSize:'0.7rem'}}>{bloque.tipo.replace('_', ' ')}</span>
          <button className="btn btn-sm btn-outline-danger border-0" onClick={() => eliminarBloque(bloque.id)}>
            <i className="bi bi-trash"></i> ✖
          </button>
        </div>
        <div className="card-body p-3">
          {bloque.tipo === 'titulo' && (
            <input 
              type="text" 
              className="form-control fw-bold border-0 bg-light" 
              style={{ textAlign: bloque.alineacion, color: bloque.color, fontSize: bloque.fontSize }}
              value={bloque.contenido} 
              onChange={(e) => actualizarBloque(bloque.id, { contenido: e.target.value })} 
            />
          )}

          {bloque.tipo === 'texto_libre' && (
             <textarea 
               className="form-control border-0 bg-light" 
               rows="3"
               style={{ textAlign: bloque.alineacion }}
               value={bloque.contenido} 
               onChange={(e) => actualizarBloque(bloque.id, { contenido: e.target.value })} 
             />
          )}

          {bloque.tipo === 'seccion_croquis' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-pin-map fs-1 mb-2 d-block"></i>
              <b>Sección: Croquis del Predio</b><br/>
              <small>(Mapa inyectado en pantalla completa en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_predio_dotacion' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-house-gear fs-1 mb-2 d-block"></i>
              <b>Sección: Predio, Acabados y Dotación</b><br/>
              <small>(Checkboxes y tablas inyectadas en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_comparables_valoracion' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-cash-coin fs-1 mb-2 d-block"></i>
              <b>Sección: Comparables y Valoración Financiera</b><br/>
              <small>(Tablas de precios y firma inyectadas en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_general_imagenes' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-layout-sidebar-inset fs-1 mb-2 d-block"></i>
              <b>Sección: Información General, Matrícula e Imágenes</b><br/>
              <small>(Diseño exacto inyectado en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_sector' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-ui-radios-grid fs-1 mb-2 d-block"></i>
              <b>Sección: Sector, Edificación y Equipamiento</b><br/>
              <small>(Diseño exacto inyectado en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_textos_legales' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-file-text fs-1 mb-2 d-block"></i>
              <b>Sección: Términos, Condicionantes y Metodología</b><br/>
              <small>(Diseño exacto inyectado en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_usos_propuestos' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-table fs-1 mb-2 d-block"></i>
              <b>Sección: Tabla de Usos Propuestos</b><br/>
              <small>(Diseño exacto inyectado en el PDF)</small>
            </div>
          )}

          {bloque.tipo === 'seccion_areas_normatividad' && (
            <div className="text-center text-muted p-3 border rounded bg-light" style={{borderStyle: 'dashed !important'}}>
              <i className="bi bi-aspect-ratio fs-1 mb-2 d-block"></i>
              <b>Sección: Áreas, Normatividad y Aspectos Jurídicos</b><br/>
              <small>(Diseño exacto inyectado en el PDF)</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-0" style={{ height: 'calc(100vh - 80px)' }}>
      {notificacion.mostrar && (
        <div className={`alert alert-${notificacion.tipo} position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg z-3`} style={{zIndex: 9999}}>
          {notificacion.mensaje}
        </div>
      )}
      
      <div className="row g-0 h-100">
        
        {/* PANEL IZQUIERDO - CONTROLES */}
        <div className="col-md-4 col-lg-3 bg-white border-end h-100 overflow-auto shadow-sm" style={{ zIndex: 10 }}>
          <div className="p-4">
            <h4 className="fw-bold mb-4" style={{ color: '#1d429a' }}>Maquetador Visual</h4>
            
            <div className="mb-4">
              <label className="form-label fw-bold small text-uppercase text-muted">Nombre de Plantilla</label>
              <input type="text" className="form-control shadow-sm" value={nombrePlantilla} onChange={(e) => setNombrePlantilla(e.target.value)} />
            </div>

            <hr className="my-4 opacity-25" />
            
            {/* Controles de Fondo */}
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><span className="badge bg-primary rounded-pill">1</span> Ajustes de Membrete</h6>
            <div className="card border-0 bg-light shadow-sm mb-4">
              <div className="card-body p-3">
                <input type="file" className="form-control form-control-sm mb-3" accept="image/*" onChange={handleFondoChange} />
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small mb-1">Eje X (mm)</label>
                    <input type="number" className="form-control form-control-sm" value={ejeX} onChange={(e) => setEjeX(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small mb-1">Eje Y (mm)</label>
                    <input type="number" className="form-control form-control-sm" value={ejeY} onChange={(e) => setEjeY(e.target.value)} />
                  </div>
                  <div className="col-12 mt-2">
                    <label className="form-label small mb-1 d-flex justify-content-between">Escala (%) <span>{escala}%</span></label>
                    <input type="range" className="form-range" min="10" max="200" value={escala} onChange={(e) => setEscala(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Constructor de Bloques */}
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><span className="badge bg-primary rounded-pill">2</span> Agregar Bloques</h6>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {BLOQUES_PREDEFINIDOS.map(b => (
                <button key={b.tipo} className="btn btn-sm btn-outline-primary rounded-pill flex-grow-1 shadow-sm" onClick={() => agregarBloque(b)}>
                  + {b.label}
                </button>
              ))}
            </div>

            <hr className="my-4 opacity-25" />

            {/* Diccionario de Variables */}
            <h6 className="fw-bold mb-3"><i className="bi bi-code-slash"></i> Variables Disponibles</h6>
            <div className="bg-light p-3 rounded shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <ul className="list-unstyled mb-0 small">
                {VARIABLES_DISPONIBLES.map(v => (
                  <li key={v.token} className="mb-2 pb-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="text-muted">{v.label}</span>
                    <span 
                      className="badge bg-white text-primary border cursor-pointer" 
                      style={{cursor: 'pointer'}} 
                      title="Copiar"
                      onClick={() => { navigator.clipboard.writeText(v.token); mostrarNotificacion(`Copiado: ${v.token}`, 'info'); }}
                    >
                      {v.token}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 pt-3 border-top position-sticky bottom-0 bg-white pb-3">
                <button className="btn w-100 py-2 fw-bold text-white shadow" style={{ backgroundColor: '#1d429a', borderRadius: '10px' }} onClick={guardarEstructura}>
                    💾 Guardar Plantilla
                </button>
            </div>
          </div>
        </div>

        {/* LIENZO - DERECHA */}
        <div className="col-md-8 col-lg-9 bg-secondary bg-opacity-10 h-100 overflow-auto position-relative p-4 d-flex justify-content-center pt-5">
            
            {/* Hoja tamaño carta simulada */}
            <div 
              className="shadow-lg position-relative overflow-hidden"
              style={{
                width: '215.9mm', 
                minHeight: '279.4mm', 
                backgroundColor: 'white',
                transformOrigin: 'top center',
                transform: 'scale(0.85)',
                marginBottom: '100px'
              }}
            >
              {/* Capa de Fondo (Membrete) */}
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Membrete" 
                  style={{
                    position: 'absolute',
                    top: `${ejeY}mm`,
                    left: `${ejeX}mm`,
                    width: `${escala}%`,
                    zIndex: 0,
                    pointerEvents: 'none', // Para no interferir con clicks en el contenido
                    opacity: 0.8
                  }} 
                />
              )}

              {/* Capa de Contenido (Bloques) */}
              <div style={{ position: 'relative', zIndex: 1, padding: '30mm 20mm' }}>
                
                {elementosLienzo.length === 0 ? (
                    <div className="text-center text-muted mt-5 p-5 border border-dashed rounded" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                        <h5>Lienzo Vacío</h5>
                        <p>Agrega bloques desde el panel izquierdo.</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {elementosLienzo.map((bloque, idx) => renderBloque(bloque, idx))}
                    </div>
                )}
                
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}
