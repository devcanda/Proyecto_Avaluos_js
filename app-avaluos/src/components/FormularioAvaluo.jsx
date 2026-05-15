import { useState, useEffect } from 'react'

// === 1. COMPONENTES DE APOYO ===
const Field = ({ label, name, type = "text", col = "col-md-3", options = null, formData = {}, onChange }) => {
  const valorSeguro = formData[name] != null ? String(formData[name]) : '';
  return (
    <div className={col}>
      <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '0.75rem' }}>{label}</label>
      {options ? (
        <select name={name} value={valorSeguro} onChange={onChange} className="form-select form-select-sm border-primary shadow-sm">
          <option value="">Seleccione...</option>
          {options.map((o, idx) => {
            const isObj = typeof o === 'object';
            const val = isObj ? String(o.value) : o;
            const txt = isObj ? o.label : o;
            return <option key={idx} value={val}>{txt}</option>;
          })}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} value={valorSeguro} onChange={onChange} className="form-control form-control-sm border-primary shadow-sm" rows="2"></textarea>
      ) : (
        <input type={type} name={name} value={valorSeguro} onChange={onChange} className="form-control form-control-sm border-primary shadow-sm" />
      )}
    </div>
  );
};

const Checkbox = ({ label, name, formData = {}, onChange }) => {
  return (
    <div className="col-auto">
      <div className="form-check form-check-inline">
        <input type="checkbox" name={name} checked={!!formData[name]} onChange={onChange} className="form-check-input border-primary" />
        <label className="form-check-label text-muted small">{label}</label>
      </div>
    </div>
  );
};

// ZONA DE DRAG AND DROP PARA IMÁGENES INDIVIDUALES
const DragDropZone = ({ label, icon, imagen, setImagen }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) setImagen({ archivoFisico: file, url: URL.createObjectURL(file) });
  };
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagen({ archivoFisico: file, url: URL.createObjectURL(file) });
  };
  return (
    <div className="col-md-6 mb-3">
      <label className="fw-bold text-primary small mb-1">{icon} {label}</label>
      <div 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-${label}`).click()}
        className="border border-2 border-primary rounded p-2 text-center position-relative shadow-sm" 
        style={{ borderStyle: 'dashed !important', backgroundColor: '#f8f9fa', cursor: 'pointer', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <input type="file" id={`file-${label}`} className="d-none" accept=".jpg,.jpeg,.png" onChange={handleChange} />
        {imagen ? (
          <>
             <img src={imagen.url} style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain', borderRadius: '5px' }} />
             <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 shadow" onClick={(e) => { e.stopPropagation(); setImagen(null); }}>✕</button>
          </>
        ) : (
          <div className="text-muted"><div style={{fontSize: '2.5rem', marginBottom: '10px'}}>{icon}</div><span className="small fw-bold">Clic o arrastra la imagen aquí</span></div>
        )}
      </div>
    </div>
  );
};

// === 2. COMPONENTE PRINCIPAL ===
export default function FormularioAvaluo({ setVistaActiva, idEdicion }) {
  const [pasoFormulario, setPasoFormulario] = useState(1);
  const [imagenesPreview, setImagenesPreview] = useState([]);
  
  // ESTADOS PARA LAS IMÁGENES DEL PASO 1
  const [fotoFachada, setFotoFachada] = useState(null);
  const [fotoMapa, setFotoMapa] = useState(null);
  
  const [cargando, setCargando] = useState(false);

  const estadoInicial = {
    FechaDeVisita: '', FechaDelAvalio: '', TipoDeAvaluo: '', FinalidadDelAvaluo: '', ObjetoDelAvaluo: '', Entidad: '',
    Solicitante: '', TipoDeDocumento: '', NumeroDocumento: '', TipoDeBien: '', Sector: '', ViviendaInteresSocial: '',
    Estrato: '', Producto: '', Departamento: 'VALLE DEL CAUCA', Municipio: 'TULUÁ', Barrio: '', Direccion: '', CodigoDane: '',
    matriculainmTipo1: '', matriculainmNumero1: '', matriculainmTipo2: '', matriculainmNumero2: '', Propietario: '', NumeroDeEscritura: '', AspJFecha: '', NumeroDeNotaria: '', AspMunicipio: '', AspDepartamento: '', Chip: '', CedulaCatastral: '', TipoDePropiedad: '', CoeficienteDeCopropiedad: '', LicenciaDeConstruccion: '', DescripcionGeneral: '',
    AreaLote: '', Forma: '', Topografia: '', Frente: '', Fondo: '', RelacionFrenteFondo: '', DecretoAcuerdo: '', UsoPrincipal: '', AlturaPermitida: '', AislamientoPosterior: '', AislamientoLateral: '', Antejardin: '', IndiceDeOcupacion: '', IndiceDeConstruccion: '', AreaValorada: '', AreaMedidaEnLaInspeccion: '', AreaRegistradaEnTitulo: '', AreaSusceptibleDeLegalizacion: '', AreaCatastral: '', AreaLicenciaDeConstruccion: '', AreaValoradaObservaciones: '', Latitud: '', Longitud: '',
    DemandaInteres: '', UsoPredominante: '', Legalidad: '', Transporte: '', SectorObservaciones: '', PerspectivasDeValorizacion: '', ViasDeAcceso: '', Andenes: '', Acueducto: '', EnergiaElectrica: '', GasNatural: '', Pavimentadas: '', Sardineles: '', Alcantarillado: '', Telefonia: '', Aire: false, AguasServidas: false, Basura: false, Inseguridad: false, Ruido: false, Alamedas: false, Alumbrado: false, Arborizacion: false, Ciclorutas: false, Paradero: false, Parques: false, ZonasVerdes: false,
    AreasVerdesNE: '', AreasVerdesDAM: '', AsistencialNE: '', AsistencialDAM: '', ComercialNE: '', ComercialDAM: '', EscolarNE: '', EscolarDAM: '', EstacionamientosNE: '', EstacionamientosDAM: '', AreasRecreativasNE: '', AreasRecreativasDAM: '', SeguridadSectorNE: '', SeguridadSectorDAM: '',
    EstadoDeLaConstruccion: '', AvanceEnConstruccion: '', EstadoDeConservacion: '', NoDePisosDelInmueble: '', NumeroDeSotanos: '', VidaUtil: '', VidaRemanente: '', YearDeConstruccion: '', Edad: '', Estructura: '', MaterialDeEstructura: '', EstructuraEstado: '', Remodelado: '', UsoActualPredominante: '', AjusteSismorresistente: '', Cubierta: '', Fachada: '', TipoDeFachadaEnMetros: '', EstructuraReforzada: '', DanosPrevios: '', MaterialDeConstruccion: '', Iluminacion: '', Ventilacion: '', IrregularidadPlanta: '', IrregularidadAltura: '', ComentariosDeLaEstructura: '',
    MurosCalidad: '', MurosEstado: '', PisosCalidad: '', PisosEstado: '', TechosCalidad: '', TechosEstado: '', CarpinteriaMetalicaCalidad: '', CarpinteriaMetalicaEstado: '', CarpinteriaEnMaderaCalidad: '', CarpinteriaEnMaderaEstado: '', CocinaCalidad: '', CocinaEstado: '', BanosCalidad: '', BanosEstado: '',
    PredioAcueducto: '', PredioEnergiaElectrica: '', PredioTelefonia: '', PredioAlcantarillado: '', PredioGasNatural: '', PredioAlcobas: '', PredioBalcon: '', PredioBanoPrivado: '', PredioCocina: '', PredioEstarHabitacion: '', PredioJardin: '', PredioSala: '', PredioZonaDeRopas: '', PredioCloset: '', PredioAlcobaDeServicio: '', PredioBanoDeServicio: '', PredioBanoSocial: '', PredioComedor: '', PredioEstudio: '', PredioPatioInterior: '', PredioTerraza: '', PredioSubdivididoFisicamente: '', PredioTotalCuposDeParqueo: '', PredioBahiaComunal: '', PredioDescubierto: '', PredioPrivado: '', PredioServidumbre: '', PredioUsoExclusivo: '', PredioCubierto: '', PredioDoble: '', PredioSencillo: '', PredioBodega: '', PredioTipoDeDeposito: '', PredioOficina: '', PredioDeposito: '', PredioLocal: '',
    DCValorAdmon: '', DCMensualidad: '', DCValorAdmonM2: '', DCVigilanciaPrivada: '', DCAscensores: '', DCOtros: '', DCAACentral: false, DCBBQ: false, DCBicicletero: false, DCBombaEyec: false, DCCalefaccion: false, DCCanchaMultiuso: false, DCCanchaSquash: false, DCCCTV: false, DCCitofonia: false, DCClubHouse: false, DCEquipoDePresion: false, DCGarajesResidentes: false, DCGarajesVisitantes: false, DCGimnasio: false, DCGolfito: false, DCGuarderia: false, DCJuegosNinos: false, DCPiscina: false, DCPlantaElectrica: false, DCPorteria: false, DCSalonComunal: false, DCSalonDeJuegos: false, DCSauna: false, DCShutBasuras: false, DCTanqueDeAgua: false, DCTeatrino: false, DCTerrazaComunal: false, DCTurco: false, DCVigilancia24Horas: false, DCZonaVerde: false,
    TiempoEsperadoDeComercializacion: '', ComportamientoOfertayDemanda: '', DSAIVI: '', ActualidadEdificadora: '', DVRDiagnostico: '', CVTTerreno: '', CVTDescripcion: '', CVTArea: 0, CVTUniadDeMedida: '', CVTValorUnitario: 0, CVTValor: 0, CVTPorcentaje: '', CVEEdificaciones: '', CVEDescripcion: '', CVEArea: 0, CVEUniadDeMedida: '', CVEValorUnitario: 0, CVEValor: 0, CVEPorcentaje: '',
    acabadosEdificacion: [], ofertasMercado: []
  };

  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    if (idEdicion) {
      setCargando(true);
      fetch(`http://localhost:3000/api/avaluos/${idEdicion}`)
        .then(res => res.json())
        .then(data => {
          ['FechaDeVisita', 'FechaDelAvalio', 'AspJFecha'].forEach(f => { if (data[f]) data[f] = data[f].substring(0, 10); });
          setFormData({ ...estadoInicial, ...data, acabadosEdificacion: Array.isArray(data.acabadosEdificacion) ? data.acabadosEdificacion : [], ofertasMercado: Array.isArray(data.ofertasMercado) ? data.ofertasMercado : [] });
          setCargando(false);
        }).catch(err => { console.error(err); setCargando(false); });
    } else { setFormData(estadoInicial); }
  }, [idEdicion]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckboxChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });

  const tablaAcabados = Array.isArray(formData.acabadosEdificacion) ? formData.acabadosEdificacion : [];
  const tablaOfertas = Array.isArray(formData.ofertasMercado) ? formData.ofertasMercado : [];

  const agregarAcabado = () => setFormData({ ...formData, acabadosEdificacion: [...tablaAcabados, { recinto: '', pisos: '', muros: '' }] });
  const handleAcabado = (i, campo, val) => { const n = [...tablaAcabados]; n[i][campo] = val; setFormData({ ...formData, acabadosEdificacion: n }); };
  const eliminarAcabado = (i) => { const n = [...tablaAcabados]; n.splice(i, 1); setFormData({ ...formData, acabadosEdificacion: n }); };

  const agregarOferta = () => setFormData({ ...formData, ofertasMercado: [...tablaOfertas, { direccion: '', edad: '', areaLote: '', areaConstr: '', valorComercial: '', fuente: '' }] });
  const handleOferta = (i, campo, val) => { const n = [...tablaOfertas]; n[i][campo] = val; setFormData({ ...formData, ofertasMercado: n }); };
  const eliminarOferta = (i) => { const n = [...tablaOfertas]; n.splice(i, 1); setFormData({ ...formData, ofertasMercado: n }); };

  const handleImageUpload = (e) => {
    const archivos = Array.from(e.target.files);
    setImagenesPreview(prev => [...prev, ...archivos.map(a => ({ archivoFisico: a, url: URL.createObjectURL(a), titulo: '' }))]);
  };
  const eliminarImagen = (i) => setImagenesPreview(prev => prev.filter((_, idx) => idx !== i));

  const confirmarGuardadoFinal = async () => {
    if (!window.confirm("¿Confirmas los datos de este avalúo?")) return;
    const paquete = new FormData();
    paquete.append('datosFormulario', JSON.stringify(formData));
    
    // Adjuntamos las imágenes específicas (En el futuro las guardaremos en la BD)
    if (fotoFachada) paquete.append('fotos', fotoFachada.archivoFisico);
    if (fotoMapa) paquete.append('fotos', fotoMapa.archivoFisico);
    
    // Adjuntamos las imágenes generales del paso 4
    imagenesPreview.forEach(img => { if (img.archivoFisico) paquete.append('fotos', img.archivoFisico); });

    try {
      const url = idEdicion ? `http://localhost:3000/api/avaluos/${idEdicion}` : 'http://localhost:3000/api/avaluos';
      const res = await fetch(url, { method: idEdicion ? 'PUT' : 'POST', body: paquete });
      if (res.ok) { alert("¡Guardado correctamente!"); setVistaActiva('dashboard'); }
    } catch (e) { alert("Error de conexión."); }
  };

  if (cargando) return (<div className="text-center p-5"><div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div><h5 className="mt-3 text-secondary fw-bold">Recuperando expediente...</h5></div>);

  return (
    <div className="card shadow-sm border-0 fade-in">
      <style>{`
        .step-container { cursor: pointer; transition: 0.3s; }
        .step-indicator { width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; background-color: #e9ecef; color: #6c757d; margin-right: 10px; }
        .step-active .step-indicator { background-color: #1d429a; color: white; box-shadow: 0 0 0 3px rgba(29, 66, 154, 0.2); }
        .step-completed .step-indicator { background-color: #198754; color: white; }
        .section-title { color: #1d429a; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
      `}</style>

      <div className="card-header bg-white py-4 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-bold" style={{ color: '#1d429a' }}>{idEdicion ? `EDITANDO EXPEDIENTE #${idEdicion}` : 'REGISTRO DE NUEVO AVALÚO'}</h5>
          <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={() => setVistaActiva('dashboard')}>✖ SALIR</button>
        </div>
        <div className="d-flex justify-content-between px-2">
          {[{ n: 1, t: "Gral & Jurídico" }, { n: 2, t: "Áreas & Entorno" }, { n: 3, t: "Inmueble & Valor" }, { n: 4, t: "Fotos Anexas" }].map(p => (
            <div key={p.n} className={`d-flex align-items-center step-container ${pasoFormulario === p.n ? 'step-active' : pasoFormulario > p.n ? 'step-completed' : ''}`} style={{ flex: 1 }} onClick={() => setPasoFormulario(p.n)}>
              <div className="step-indicator">{pasoFormulario > p.n ? '✓' : p.n}</div>
              <span className="step-title d-none d-md-block small fw-bold">{p.t}</span>
              {p.n !== 4 && <div className="mx-3" style={{ height: '2px', backgroundColor: '#e9ecef', flex: 1 }}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card-body p-4 bg-light">
        {/* ======================= PASO 1 ======================= */}
        {pasoFormulario === 1 && (
          <div className="row g-3 fade-in">
            <div className="col-12"><h6 className="section-title">■ IDENTIFICACIÓN Y TIEMPOS</h6></div>
            <Field label="Fecha Visita" name="FechaDeVisita" type="date" formData={formData} onChange={handleInputChange} />
            <Field label="Fecha Avalúo" name="FechaDelAvalio" type="date" formData={formData} onChange={handleInputChange} />
            <Field label="Tipo de Avalúo" name="TipoDeAvaluo" formData={formData} onChange={handleInputChange} />
            <Field label="Finalidad Avalúo" name="FinalidadDelAvaluo" formData={formData} onChange={handleInputChange} />
            <Field label="Objeto Avalúo" name="ObjetoDelAvaluo" formData={formData} onChange={handleInputChange} />
            <Field label="Entidad" name="Entidad" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ INFORMACIÓN DEL SOLICITANTE Y PREDIO</h6></div>
            <Field label="Solicitante" name="Solicitante" col="col-md-6" formData={formData} onChange={handleInputChange} />
            <Field label="Tipo Doc." name="TipoDeDocumento" options={[{ value: '1', label: '(RC) Registro Civil' }, { value: '2', label: '(CC) Cédula Ciudadanía' }, { value: '3', label: '(CE) Cédula Extranjería' }, { value: '5', label: '(TI) Tarjeta de Identidad' }, { value: '8', label: '(NIT) Identificación Tributaria' }]} formData={formData} onChange={handleInputChange} />
            <Field label="No. Documento" name="NumeroDocumento" formData={formData} onChange={handleInputChange} />
            <Field label="Tipo de Bien" name="TipoDeBien" formData={formData} onChange={handleInputChange} />
            <Field label="Sector" name="Sector" options={['Urbano', 'Rural']} formData={formData} onChange={handleInputChange} />
            <Field label="Vivienda Interés Social" name="ViviendaInteresSocial" options={[{ value: '1', label: 'SI' }, { value: '2', label: 'NO' }]} formData={formData} onChange={handleInputChange} />
            <Field label="Estrato" name="Estrato" formData={formData} onChange={handleInputChange} />
            <Field label="Producto" name="Producto" formData={formData} onChange={handleInputChange} />
            <Field label="Código DANE" name="CodigoDane" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ UBICACIÓN Y MATRÍCULAS</h6></div>
            <Field label="Departamento" name="Departamento" formData={formData} onChange={handleInputChange} />
            <Field label="Municipio" name="Municipio" formData={formData} onChange={handleInputChange} />
            <Field label="Barrio" name="Barrio" formData={formData} onChange={handleInputChange} />
            <Field label="Dirección" name="Direccion" col="col-md-6" formData={formData} onChange={handleInputChange} />
            
            {/* NUEVA ZONA DRAG & DROP FACHADA */}
            <DragDropZone label="Foto de Fachada" icon="📷" imagen={fotoFachada} setImagen={setFotoFachada} />

            <Field label="Matrícula Tipo 1" name="matriculainmTipo1" formData={formData} onChange={handleInputChange} />
            <Field label="Matrícula No. 1" name="matriculainmNumero1" formData={formData} onChange={handleInputChange} />
            <Field label="Matrícula Tipo 2" name="matriculainmTipo2" formData={formData} onChange={handleInputChange} />
            <Field label="Matrícula No. 2" name="matriculainmNumero2" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ ASPECTOS JURÍDICOS</h6></div>
            <Field label="Propietario" name="Propietario" col="col-md-6" formData={formData} onChange={handleInputChange} />
            <Field label="No. Escritura" name="NumeroDeEscritura" formData={formData} onChange={handleInputChange} />
            <Field label="Fecha Escritura" name="AspJFecha" type="date" formData={formData} onChange={handleInputChange} />
            <Field label="Notaría" name="NumeroDeNotaria" formData={formData} onChange={handleInputChange} />
            <Field label="Municipio Escritura" name="AspMunicipio" formData={formData} onChange={handleInputChange} />
            <Field label="Depto Escritura" name="AspDepartamento" formData={formData} onChange={handleInputChange} />
            <Field label="Chip" name="Chip" formData={formData} onChange={handleInputChange} />
            <Field label="Cédula Catastral" name="CedulaCatastral" col="col-md-6" formData={formData} onChange={handleInputChange} />
            <Field label="Tipo Propiedad" name="TipoDePropiedad" formData={formData} onChange={handleInputChange} />
            <Field label="Coef. Copropiedad" name="CoeficienteDeCopropiedad" formData={formData} onChange={handleInputChange} />
            <Field label="Lic. Construcción" name="LicenciaDeConstruccion" formData={formData} onChange={handleInputChange} />
            <Field label="Descripción General" name="DescripcionGeneral" type="textarea" col="col-12" formData={formData} onChange={handleInputChange} />
          </div>
        )}

        {/* ======================= PASO 2 ======================= */}
        {pasoFormulario === 2 && (
          <div className="row g-3 fade-in">
            <div className="col-12"><h6 className="section-title">■ ÁREAS Y NORMATIVIDAD</h6></div>
            <Field label="Área Lote (M²)" name="AreaLote" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Forma" name="Forma" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Topografía" name="Topografia" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Frente (Mts)" name="Frente" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Fondo (Mts)" name="Fondo" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Rel. Frente/Fondo" name="RelacionFrenteFondo" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Decreto/Acuerdo" name="DecretoAcuerdo" formData={formData} onChange={handleInputChange} />
            <Field label="Uso Principal" name="UsoPrincipal" formData={formData} onChange={handleInputChange} />
            <Field label="Altura Permitida" name="AlturaPermitida" formData={formData} onChange={handleInputChange} />
            <Field label="Aisl. Posterior" name="AislamientoPosterior" formData={formData} onChange={handleInputChange} />
            <Field label="Aisl. Lateral" name="AislamientoLateral" formData={formData} onChange={handleInputChange} />
            <Field label="Antejardín" name="Antejardin" formData={formData} onChange={handleInputChange} />
            <Field label="Índice Ocupación" name="IndiceDeOcupacion" formData={formData} onChange={handleInputChange} />
            <Field label="Índice Construcción" name="IndiceDeConstruccion" formData={formData} onChange={handleInputChange} />
            <Field label="Área Valorada" name="AreaValorada" formData={formData} onChange={handleInputChange} />
            <Field label="Área Medida Insp." name="AreaMedidaEnLaInspeccion" formData={formData} onChange={handleInputChange} />
            <Field label="Área Reg. Título" name="AreaRegistradaEnTitulo" formData={formData} onChange={handleInputChange} />
            <Field label="Área Legalizable" name="AreaSusceptibleDeLegalizacion" formData={formData} onChange={handleInputChange} />
            <Field label="Área Catastral" name="AreaCatastral" formData={formData} onChange={handleInputChange} />
            <Field label="Área Lic. Constr." name="AreaLicenciaDeConstruccion" formData={formData} onChange={handleInputChange} />
            <Field label="Observaciones Áreas" name="AreaValoradaObservaciones" type="textarea" col="col-md-12" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ SECTOR E INFRAESTRUCTURA</h6></div>
            <Field label="Demanda/Interés" name="DemandaInteres" formData={formData} onChange={handleInputChange} />
            <Field label="Uso Predominante" name="UsoPredominante" formData={formData} onChange={handleInputChange} />
            <Field label="Legalidad" name="Legalidad" formData={formData} onChange={handleInputChange} />
            <Field label="Transporte" name="Transporte" formData={formData} onChange={handleInputChange} />
            <Field label="Vías de Acceso" name="ViasDeAcceso" formData={formData} onChange={handleInputChange} />
            <Field label="Andenes" name="Andenes" formData={formData} onChange={handleInputChange} />
            <Field label="Acueducto" name="Acueducto" formData={formData} onChange={handleInputChange} />
            <Field label="Energía Eléctrica" name="EnergiaElectrica" formData={formData} onChange={handleInputChange} />
            <Field label="Gas Natural" name="GasNatural" formData={formData} onChange={handleInputChange} />
            <Field label="Pavimentadas" name="Pavimentadas" formData={formData} onChange={handleInputChange} />
            <Field label="Sardineles" name="Sardineles" formData={formData} onChange={handleInputChange} />
            <Field label="Alcantarillado" name="Alcantarillado" formData={formData} onChange={handleInputChange} />
            <Field label="Telefonía" name="Telefonia" formData={formData} onChange={handleInputChange} />
            
            <Field label="Latitud (GPS)" name="Latitud" formData={formData} onChange={handleInputChange} />
            <Field label="Longitud (GPS)" name="Longitud" formData={formData} onChange={handleInputChange} />

            {/* NUEVA ZONA DRAG & DROP MAPA */}
            <DragDropZone label="Captura de Mapa (GPS)" icon="🗺️" imagen={fotoMapa} setImagen={setFotoMapa} />

            <div className="col-12 mt-3 d-flex flex-wrap gap-3">
              <label className="fw-bold text-muted small w-100">Condiciones Ambientales y Sociales:</label>
              <Checkbox label="Aire" name="Aire" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Aguas Servidas" name="AguasServidas" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Basura" name="Basura" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Inseguridad" name="Inseguridad" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Ruido" name="Ruido" formData={formData} onChange={handleCheckboxChange} />
            </div>

            <div className="col-12 mt-3 d-flex flex-wrap gap-3">
              <label className="fw-bold text-muted small w-100">Amoblamiento Urbano:</label>
              <Checkbox label="Alamedas" name="Alamedas" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Alumbrado" name="Alumbrado" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Arborización" name="Arborizacion" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Ciclorutas" name="Ciclorutas" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Paradero" name="Paradero" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Parques" name="Parques" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Zonas Verdes" name="ZonasVerdes" formData={formData} onChange={handleCheckboxChange} />
            </div>

            <Field label="Observaciones Sector" name="SectorObservaciones" type="textarea" col="col-12 mt-3" formData={formData} onChange={handleInputChange} />
            <Field label="Perspectivas Valorización" name="PerspectivasDeValorizacion" type="textarea" col="col-12" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ EQUIPAMIENTO URBANO</h6></div>
            <div className="col-12">
              <table className="table table-sm table-bordered bg-white text-center">
                <thead className="table-light small"><tr><th>Equipamiento</th><th>Nivel</th><th>Distancia Aprox.</th></tr></thead>
                <tbody>
                  {['AreasVerdes', 'Asistencial', 'Comercial', 'Escolar', 'Estacionamientos', 'AreasRecreativas', 'SeguridadSector'].map(e => (
                    <tr key={e}>
                      <td className="fw-bold small text-start ps-3">{e}</td>
                      <td><input name={`${e}NE`} value={formData[`${e}NE`] || ''} onChange={handleInputChange} className="form-control form-control-sm border-0 text-center" /></td>
                      <td><input name={`${e}DAM`} value={formData[`${e}DAM`] || ''} onChange={handleInputChange} className="form-control form-control-sm border-0 text-center" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= PASO 3 ======================= */}
        {pasoFormulario === 3 && (
          <div className="row g-3 fade-in">
            <div className="col-12"><h6 className="section-title">■ EDIFICACIÓN Y ESTRUCTURA</h6></div>
            <Field label="Estado Construcción" name="EstadoDeLaConstruccion" formData={formData} onChange={handleInputChange} />
            <Field label="Avance" name="AvanceEnConstruccion" formData={formData} onChange={handleInputChange} />
            <Field label="Conservación" name="EstadoDeConservacion" formData={formData} onChange={handleInputChange} />
            <Field label="No. Pisos" name="NoDePisosDelInmueble" type="number" formData={formData} onChange={handleInputChange} />
            <Field label="No. Sótanos" name="NumeroDeSotanos" type="number" formData={formData} onChange={handleInputChange} />
            <Field label="Vida Útil" name="VidaUtil" formData={formData} onChange={handleInputChange} />
            <Field label="Vida Remanente" name="VidaRemanente" formData={formData} onChange={handleInputChange} />
            <Field label="Año Construcción" name="YearDeConstruccion" type="number" formData={formData} onChange={handleInputChange} />
            <Field label="Edad (Años)" name="Edad" type="number" formData={formData} onChange={handleInputChange} />
            <Field label="Estructura" name="Estructura" formData={formData} onChange={handleInputChange} />
            <Field label="Material" name="MaterialDeEstructura" formData={formData} onChange={handleInputChange} />
            <Field label="Estado Estructura" name="EstructuraEstado" formData={formData} onChange={handleInputChange} />
            <Field label="Remodelado" name="Remodelado" options={['SI', 'NO']} formData={formData} onChange={handleInputChange} />
            <Field label="Uso Actual" name="UsoActualPredominante" formData={formData} onChange={handleInputChange} />
            <Field label="Sismorresistente" name="AjusteSismorresistente" formData={formData} onChange={handleInputChange} />
            <Field label="Cubierta" name="Cubierta" formData={formData} onChange={handleInputChange} />
            <Field label="Fachada" name="Fachada" formData={formData} onChange={handleInputChange} />
            <Field label="Fachada Mts" name="TipoDeFachadaEnMetros" formData={formData} onChange={handleInputChange} />
            <Field label="Reforzada" name="EstructuraReforzada" formData={formData} onChange={handleInputChange} />
            <Field label="Daños Previos" name="DanosPrevios" formData={formData} onChange={handleInputChange} />
            <Field label="Material Constr." name="MaterialDeConstruccion" formData={formData} onChange={handleInputChange} />
            <Field label="Iluminación" name="Iluminacion" formData={formData} onChange={handleInputChange} />
            <Field label="Ventilación" name="Ventilacion" formData={formData} onChange={handleInputChange} />
            <Field label="Irr. Planta" name="IrregularidadPlanta" formData={formData} onChange={handleInputChange} />
            <Field label="Irr. Altura" name="IrregularidadAltura" formData={formData} onChange={handleInputChange} />
            <Field label="Comentarios Estructura" name="ComentariosDeLaEstructura" type="textarea" col="col-12" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ ACABADOS Y CALIDADES (GENERAL)</h6></div>
            {['Muros', 'Pisos', 'Techos', 'CarpinteriaMetalica', 'CarpinteriaEnMadera', 'Cocina', 'Banos'].map(item => (
              <div className="col-md-3 mb-2" key={item}>
                <label className="form-label fw-bold text-muted mb-1" style={{ fontSize: '0.75rem' }}>{item}</label>
                <div className="input-group input-group-sm">
                  <select className="form-select border-primary" name={`${item}Calidad`} value={formData[`${item}Calidad`] || ''} onChange={handleInputChange}>
                    <option value="">Calidad...</option><option value="Excelente">Excelente</option><option value="Bueno">Bueno</option><option value="Regular">Regular</option><option value="Malo">Malo</option>
                  </select>
                  <select className="form-select border-primary" name={`${item}Estado`} value={formData[`${item}Estado`] || ''} onChange={handleInputChange}>
                    <option value="">Estado...</option><option value="Excelente">Excelente</option><option value="Bueno">Bueno</option><option value="Regular">Regular</option><option value="Malo">Malo</option>
                  </select>
                </div>
              </div>
            ))}

            <div className="col-12 mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold text-muted small">Detalle por Recintos (Opcional):</label>
                <button type="button" className="btn btn-sm btn-primary" onClick={agregarAcabado}>+ Agregar Recinto</button>
              </div>
              <table className="table table-sm table-bordered bg-white">
                <thead><tr className="small text-center"><th>Recinto</th><th>Pisos</th><th>Muros</th><th></th></tr></thead>
                <tbody>
                  {tablaAcabados.map((ac, i) => (
                    <tr key={i}>
                      <td><input className="form-control form-control-sm border-0" value={ac.recinto || ''} onChange={e => handleAcabado(i, 'recinto', e.target.value)} /></td>
                      <td><input className="form-control form-control-sm border-0" value={ac.pisos || ''} onChange={e => handleAcabado(i, 'pisos', e.target.value)} /></td>
                      <td><input className="form-control form-control-sm border-0" value={ac.muros || ''} onChange={e => handleAcabado(i, 'muros', e.target.value)} /></td>
                      <td className="text-center"><button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => eliminarAcabado(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="col-12"><h6 className="section-title">■ DEPENDENCIAS Y SERVICIOS</h6></div>
            <Field label="Acueducto" name="PredioAcueducto" options={['SI', 'NO']} col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Energía" name="PredioEnergiaElectrica" options={['SI', 'NO']} col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Telefonía" name="PredioTelefonia" options={['SI', 'NO']} col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Alcantarillado" name="PredioAlcantarillado" options={['SI', 'NO']} col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Gas Natural" name="PredioGasNatural" options={['SI', 'NO']} col="col-md-2" formData={formData} onChange={handleInputChange} />
            <div className="w-100 mt-0"></div>
            <Field label="Alcobas" name="PredioAlcobas" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Baños Priv." name="PredioBanoPrivado" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Baños Soc." name="PredioBanoSocial" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Cocinas" name="PredioCocina" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Salas" name="PredioSala" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Comedores" name="PredioComedor" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Zona Ropas" name="PredioZonaDeRopas" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Estudio" name="PredioEstudio" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Balcón" name="PredioBalcon" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Terraza" name="PredioTerraza" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Jardín" name="PredioJardin" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Closets" name="PredioCloset" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />

            <div className="col-12 mt-3"><label className="fw-bold text-muted small">Garajes y Otros:</label></div>
            <Field label="Cupos Garaje" name="PredioTotalCuposDeParqueo" type="number" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Bodega" name="PredioBodega" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Depósito" name="PredioDeposito" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Oficina" name="PredioOficina" col="col-md-2" formData={formData} onChange={handleInputChange} />
            <Field label="Local" name="PredioLocal" col="col-md-2" formData={formData} onChange={handleInputChange} />

            <div className="col-12"><h6 className="section-title">■ DOTACIÓN COMUNAL</h6></div>
            <Field label="Valor Admón" name="DCValorAdmon" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <Field label="Vigilancia Priv." name="DCVigilanciaPrivada" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <Field label="Ascensores" name="DCAscensores" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <div className="col-12 mt-2 d-flex flex-wrap gap-3">
              <Checkbox label="Piscina" name="DCPiscina" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Gimnasio" name="DCGimnasio" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Salón Comunal" name="DCSalonComunal" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="BBQ" name="DCBBQ" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="CCTV" name="DCCCTV" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Zonas Verdes" name="DCZonaVerde" formData={formData} onChange={handleCheckboxChange} />
              <Checkbox label="Parqueo Visitantes" name="DCGarajesVisitantes" formData={formData} onChange={handleCheckboxChange} />
            </div>

            <div className="col-12"><h6 className="section-title">■ OFERTAS Y VALORACIÓN</h6></div>
            <div className="col-12 mb-2">
              <button type="button" className="btn btn-sm btn-primary" onClick={agregarOferta}>+ Agregar Oferta Mercado</button>
            </div>
            <div className="table-responsive col-12">
              <table className="table table-sm table-bordered bg-white text-center" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light"><tr><th>Dirección</th><th>Edad</th><th>A. Lote</th><th>A. Constr</th><th>V. Comercial</th><th></th></tr></thead>
                <tbody>
                  {tablaOfertas.map((of, i) => (
                    <tr key={i}>
                      <td><input className="form-control form-control-sm border-0" value={of.direccion || ''} onChange={(e) => handleOferta(i, 'direccion', e.target.value)} /></td>
                      <td><input type="number" className="form-control form-control-sm border-0" value={of.edad || ''} onChange={(e) => handleOferta(i, 'edad', e.target.value)} /></td>
                      <td><input type="number" className="form-control form-control-sm border-0" value={of.areaLote || ''} onChange={(e) => handleOferta(i, 'areaLote', e.target.value)} /></td>
                      <td><input type="number" className="form-control form-control-sm border-0" value={of.areaConstr || ''} onChange={(e) => handleOferta(i, 'areaConstr', e.target.value)} /></td>
                      <td><input type="number" className="form-control form-control-sm border-0 fw-bold text-success" value={of.valorComercial || ''} onChange={(e) => handleOferta(i, 'valorComercial', e.target.value)} /></td>
                      <td><button type="button" className="btn btn-sm btn-outline-danger py-0" onClick={() => eliminarOferta(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Field label="Área Terreno (m²)" name="CVTArea" type="number" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <Field label="V. Unitario Terreno" name="CVTValorUnitario" type="number" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <div className="col-md-4">
              <label className="small fw-bold text-success">Total Terreno</label>
              <input readOnly className="form-control form-control-sm bg-light fw-bold text-success" value={"$ " + (Number(formData.CVTArea || 0) * Number(formData.CVTValorUnitario || 0)).toLocaleString('es-CO')} />
            </div>

            <Field label="Área Constr. (m²)" name="CVEArea" type="number" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <Field label="V. Unitario Constr." name="CVEValorUnitario" type="number" col="col-md-4" formData={formData} onChange={handleInputChange} />
            <div className="col-md-4">
              <label className="small fw-bold text-success">Total Construcción</label>
              <input readOnly className="form-control form-control-sm bg-light fw-bold text-success" value={"$ " + (Number(formData.CVEArea || 0) * Number(formData.CVEValorUnitario || 0)).toLocaleString('es-CO')} />
            </div>

            <Field label="Diagnóstico Final" name="DVRDiagnostico" type="textarea" col="col-12 mt-3" formData={formData} onChange={handleInputChange} />
          </div>
        )}

        {/* ======================= PASO 4 ======================= */}
        {pasoFormulario === 4 && (
          <div className="row g-4 fade-in">
            <div className="col-12 text-center py-4">
              <h3 className="fw-bold" style={{ color: '#1d429a' }}>Anexos Fotográficos Adicionales</h3>
              <p className="text-muted small">Sube aquí las fotos del interior del inmueble (Baños, Cocina, Habitaciones).</p>
              <input type="file" className="d-none" id="upFotos" multiple accept=".jpg,.jpeg,.png" onChange={handleImageUpload} />
              <label htmlFor="upFotos" className="btn btn-primary px-5 rounded-pill fw-bold" style={{ cursor: 'pointer' }}>+ CARGAR FOTOS DE INTERIORES</label>
            </div>
            <div className="d-flex flex-wrap gap-3">
              {imagenesPreview.map((img, idx) => (
                <div key={idx} className="bg-white p-2 border rounded position-relative shadow-sm" style={{ width: '180px' }}>
                  <button type="button" className="position-absolute top-0 end-0 btn btn-danger btn-sm rounded-circle m-1" style={{ width: '28px', height: '28px', padding: '0' }} onClick={() => eliminarImagen(idx)}>✕</button>
                  <img src={img.url} className="w-100 rounded mb-2" style={{ height: '120px', objectFit: 'cover' }} />
                  <input className="form-control form-control-sm border-primary" placeholder="Título para el PDF" value={img.titulo} onChange={e => {
                    const n = [...imagenesPreview]; n[idx].titulo = e.target.value; setImagenesPreview(n);
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card-footer bg-white p-4 d-flex justify-content-between border-top">
        <button className="btn btn-outline-secondary fw-bold px-4" onClick={() => setPasoFormulario(pasoFormulario - 1)} disabled={pasoFormulario === 1}>◀ ANTERIOR</button>
        {pasoFormulario < 4 ? (
          <button className="btn btn-primary fw-bold px-4 shadow-sm" style={{ backgroundColor: '#1d429a' }} onClick={() => setPasoFormulario(p => p + 1)}>SIGUIENTE ▶</button>
        ) : (
          <button className="btn btn-success fw-bold px-5 shadow-sm" onClick={confirmarGuardadoFinal}>
            {idEdicion ? '💾 GUARDAR EXPEDIENTE' : '💾 GUARDAR NUEVO AVALÚO'}
          </button>
        )}
      </div>
    </div>
  )
}