import { useState } from 'react'
import Dashboard from './components/Dashboard'
import FormularioAvaluo from './components/FormularioAvaluo'
import GestorPlantillas from './components/GestorPlantillas' // <-- Aquí importamos el nuevo componente

function App() {
  const [sesionIniciada, setSesionIniciada] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard'); 
  const [idEdicion, setIdEdicion] = useState(null);

  const cerrarSesion = () => { if (window.confirm("¿Deseas cerrar la sesión?")) setSesionIniciada(false); };
  
  const manejarEditar = (id) => {
    setIdEdicion(id);
    setVistaActiva('formulario');
  };

  const manejarNuevo = () => {
    setIdEdicion(null);
    setVistaActiva('formulario');
  };

  if (!sesionIniciada) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="card shadow-lg border-0 rounded-3" style={{ width: '400px' }}>
          <div className="card-header text-center text-white py-4" style={{ backgroundColor: '#1d429a' }}>
            <h4 className="mb-0 fw-bold">Candamil & Asociados</h4>
            <small>Sistema de Avalúos</small>
          </div>
          <div className="card-body p-4">
            <button className="btn btn-primary w-100 fw-bold py-2" onClick={() => setSesionIniciada(true)}>INGRESAR</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f4f6f9' }}>
      <nav className="navbar navbar-dark shadow-sm" style={{ backgroundColor: '#1d429a' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 h1 fw-bold">Candamil & Asociados - Avalúos 2.0</span>
          <button className="btn btn-sm btn-light text-danger fw-bold shadow-sm" onClick={cerrarSesion}>Cerrar Sesión</button>
        </div>
      </nav>

      <div className="row g-0">
        <div className="col-md-2 bg-white border-end min-vh-100 shadow-sm">
          <div className="list-group list-group-flush mt-3">
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'dashboard' ? 'active fw-bold' : ''}`} 
               onClick={() => setVistaActiva('dashboard')} style={{cursor:'pointer'}}>
               📊 Dashboard
            </a>
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'formulario' ? 'active fw-bold' : ''}`} 
               onClick={manejarNuevo} style={{cursor:'pointer'}}>
               📝 Nuevo Avalúo
            </a>
            
            {/* BOTÓN: EDITOR DE PLANTILLAS */}
            <div className="mt-4 mb-2 px-3 small fw-bold text-muted text-uppercase">Configuración</div>
            <a className={`list-group-item list-group-item-action ${vistaActiva === 'plantillas' ? 'active fw-bold' : ''}`} 
               onClick={() => setVistaActiva('plantillas')} style={{cursor:'pointer', borderLeft: vistaActiva === 'plantillas' ? '4px solid #1d429a' : 'none'}}>
               🎨 Editor de Plantillas
            </a>
          </div>
        </div>

        <div className="col-md-10 p-4">
          {/* RENDERIZADO CONDICIONAL DE LAS PANTALLAS */}
          {vistaActiva === 'dashboard' && (
            <Dashboard 
              setVistaActiva={setVistaActiva} 
              onEditar={manejarEditar}
              onNuevo={manejarNuevo}
            />
          )}
          {vistaActiva === 'formulario' && (
            <FormularioAvaluo 
              setVistaActiva={setVistaActiva} 
              idEdicion={idEdicion} 
            />
          )}
          
          {/* AQUÍ CARGAMOS TU NUEVO MAQUETADOR VISUAL */}
          {vistaActiva === 'plantillas' && (
            <GestorPlantillas /> 
          )}

        </div>
      </div>
    </div>
  )
}

export default App