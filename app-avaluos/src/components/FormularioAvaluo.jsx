import { useState } from 'react'

export default function FormularioAvaluo({ setVistaActiva }) {
  const [pasoFormulario, setPasoFormulario] = useState(1);
  const totalPasos = 4;
  const [imagenesPreview, setImagenesPreview] = useState([]);

  // === CEREBRO DEL FORMULARIO ===
  const [formData, setFormData] = useState({
    // GENERAL & JURÍDICOS
    FechaDeVisita: '', FechaDelAvalio: '', TipoDeAvaluo: '', FinalidadDelAvaluo: '', ObjetoDelAvaluo: '', Entidad: '',
    Solicitante: '', TipoDeDocumento: '', NumeroDocumento: '', TipoDeBien: '', Sector: '', ViviendaInteresSocial: '',
    Estrato: '', Producto: '', Departamento: '', Municipio: '', Barrio: '', Direccion: '', CodigoDane: '',
    matriculainmTipo1: '', matriculainmNumero1: '', matriculainmTipo2: '', matriculainmNumero2: '',
    Propietario: '', NumeroDeEscritura: '', AspJFecha: '', NumeroDeNotaria: '', AspMunicipio: '', AspDepartamento: '',
    Chip: '', CedulaCatastral: '', TipoDePropiedad: '', CoeficienteDeCopropiedad: '', LicenciaDeConstruccion: '', DescripcionGeneral: '',
    
    // ÁREAS, NORMATIVIDAD Y ENTORNO
    AreaLote: '', Forma: '', Topografia: '', Frente: '', Fondo: '', RelacionFrenteFondo: '',
    DecretoAcuerdo: '', UsoPrincipal: '', AlturaPermitida: '', AislamientoPosterior: '', AislamientoLateral: '', Antejardin: '',
    IndiceDeOcupacion: '', IndiceDeConstruccion: '', AreaValorada: '', AreaMedidaEnLaInspeccion: '', AreaRegistradaEnTitulo: '',
    AreaSusceptibleDeLegalizacion: '', AreaCatastral: '', AreaLicenciaDeConstruccion: '', AreaValoradaObservaciones: '',
    Latitud: '', Longitud: '',
    DemandaInteres: '', UsoPredominante: '', Legalidad: '', Transporte: '', SectorObservaciones: '', PerspectivasDeValorizacion: '',
    ViasDeAcceso: '', Andenes: '', Acueducto: '', EnergiaElectrica: '', GasNatural: '', Pavimentadas: '', Sardineles: '', Alcantarillado: '', Telefonia: '',
    
    // EQUIPAMIENTO
    AreasVerdesNE: '', AreasVerdesDAM: '', AsistencialNE: '', AsistencialDAM: '', ComercialNE: '', ComercialDAM: '', EscolarNE: '', EscolarDAM: '',
    EstacionamientosNE: '', EstacionamientosDAM: '', AreasRecreativasNE: '', AreasRecreativasDAM: '', SeguridadSectorNE: '', SeguridadSectorDAM: '',

    // CHECKBOXES ENTORNO & AMOBLAMIENTO
    Aire: false, AguasServidas: false, Basura: false, Inseguridad: false, Ruido: false,
    Alamedas: false, Alumbrado: false, Arborizacion: false, Ciclorutas: false, Paradero: false, Parques: false, ZonasVerdes: false,

    // EDIFICACIÓN ESTRUCTURA
    EstadoDeLaConstruccion: '', AvanceEnConstruccion: '', EstadoDeConservacion: '', NoDePisosDelInmueble: '', NumeroDeSotanos: '',
    VidaUtil: '', VidaRemanente: '', YearDeConstruccion: '', Edad: '', Estructura: '', MaterialDeEstructura: '', EstructuraEstado: '',
    Remodelado: '', UsoActualPredominante: '', AjusteSismorresistente: '', Cubierta: '', Fachada: '', TipoDeFachadaEnMetros: '',
    EstructuraReforzada: '', DanosPrevios: '', MaterialDeConstruccion: '', Iluminacion: '', Ventilacion: '', IrregularidadPlanta: '', IrregularidadAltura: '', ComentariosDeLaEstructura: '',
    
    // PREDIO, DEPENDENCIAS Y GARAJES
    PredioAcueducto: '', PredioEnergiaElectrica: '', PredioTelefonia: '', PredioAlcantarillado: '', PredioGasNatural: '',
    PredioAlcobas: '', PredioBalcon: '', PredioBanoPrivado: '', PredioCocina: '', PredioEstarHabitacion: '', PredioJardin: '', PredioSala: '', PredioZonaDeRopas: '', PredioCloset: '', PredioAlcobaDeServicio: '', PredioBanoDeServicio: '', PredioBanoSocial: '', PredioComedor: '', PredioEstudio: '', PredioPatioInterior: '', PredioTerraza: '', PredioSubdivididoFisicamente: '',
    PredioTotalCuposDeParqueo: '', PredioBahiaComunal: '', PredioDescubierto: '', PredioPrivado: '', PredioServidumbre: '', PredioUsoExclusivo: '', PredioCubierto: '', PredioDoble: '', PredioSencillo: '', PredioBodega: '', PredioTipoDeDeposito: '', PredioOficina: '', PredioDeposito: '', PredioLocal: '',

    // DOTACIÓN COMUNAL
    DCValorAdmon: '', DCMensualidad: '', DCValorAdmonM2: '', DCVigilanciaPrivada: '', DCAscensores: '', DCOtros: '',
    DCAACentral: false, DCBBQ: false, DCBicicletero: false, DCBombaEyec: false, DCCalefaccion: false, DCCanchaMultiuso: false, DCCanchaSquash: false, DCCCTV: false, DCCitofonia: false, DCClubHouse: false, DCEquipoDePresion: false, DCGarajesResidentes: false, DCGarajesVisitantes: false, DCGimnasio: false, DCGolfito: false, DCGuarderia: false, DCJuegosNinos: false, DCPiscina: false, DCPlantaElectrica: false, DCPorteria: false, DCSalonComunal: false, DCSalonDeJuegos: false, DCSauna: false, DCShutBasuras: false, DCTanqueDeAgua: false, DCTeatrino: false, DCTerrazaComunal: false, DCTurco: false, DCVigilancia24Horas: false, DCZonaVerde: false,

    // OFERTA Y DEMANDA
    TiempoEsperadoDeComercializacion: '', ComportamientoOfertayDemanda: '', DSAIVI: '', ActualidadEdificadora: '',
    DVRDiagnostico: '', CVTTerreno: '', CVTDescripcion: '', CVTArea: '', CVTUniadDeMedida: '', CVTValorUnitario: '', CVTValor: '', CVTPorcentaje: '',
    CVEEdificaciones: '', CVEDescripcion: '', CVEArea: '', CVEUniadDeMedida: '', CVEValorUnitario: '', CVEValor: '', CVEPorcentaje: '',

    // TABLAS DINÁMICAS
    acabadosEdificacion: [],
    ofertasMercado: []
  });

  const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleCheckboxChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.checked }); };

  // Tablas Dinámicas
  const agregarAcabado = () => setFormData({ ...formData, acabadosEdificacion: [...formData.acabadosEdificacion, { recinto: '', pisos: '', muros: '' }] });
  const eliminarAcabado = (i) => { const n = [...formData.acabadosEdificacion]; n.splice(i, 1); setFormData({ ...formData, acabadosEdificacion: n }); };
  const handleAcabado = (i, campo, val) => { const n = [...formData.acabadosEdificacion]; n[i][campo] = val; setFormData({ ...formData, acabadosEdificacion: n }); };

  const agregarOferta = () => setFormData({ ...formData, ofertasMercado: [...formData.ofertasMercado, { direccion: '', edad: '', areaLote: '', areaConstr: '', valorConstr: '', valorComercial: '', fuente: '' }] });
  const eliminarOferta = (i) => { const n = [...formData.ofertasMercado]; n.splice(i, 1); setFormData({ ...formData, ofertasMercado: n }); };
  const handleOferta = (i, campo, val) => { const n = [...formData.ofertasMercado]; n[i][campo] = val; setFormData({ ...formData, ofertasMercado: n }); };

  // Imágenes
  const handleImageUpload = (e) => {
    const archivos = Array.from(e.target.files);
    const nuevasPreviews = archivos.map(a => ({
      archivoFisico: a, // <-- ESTO ES CLAVE PARA EL BACKEND
      url: URL.createObjectURL(a),
      nombreOriginal: a.name,
      titulo: '' 
    }));
    setImagenesPreview(prev => [...prev, ...nuevasPreviews]);
  };
  const handleTituloImagen = (i, val) => { const n = [...imagenesPreview]; n[i].titulo = val; setImagenesPreview(n); };
  const eliminarImagen = (i) => setImagenesPreview(prev => prev.filter((_, idx) => idx !== i));

  const confirmarGuardadoFinal = async () => {
    if (window.confirm("¿Estás seguro de que deseas generar y guardar este avalúo definitivo?")) {
      
      // 1. Creamos el paquete especial para enviar archivos
      const paqueteDatos = new FormData();
      
      // 2. Metemos todo el "cerebro" (texto y números) en formato JSON
      paqueteDatos.append('datosFormulario', JSON.stringify(formData));
      
      // 3. Metemos los títulos de las imágenes
      const titulosImagenes = imagenesPreview.map(img => img.titulo);
      paqueteDatos.append('titulosImagenes', JSON.stringify(titulosImagenes));

      // 4. Metemos los archivos físicos (las fotos)
      imagenesPreview.forEach((img) => {
        paqueteDatos.append('fotos', img.archivoFisico);
      });

      try {
        const respuesta = await fetch('http://localhost:3000/api/avaluos/generar-pdf', {
          method: 'POST',
          body: paqueteDatos // <-- Ya no enviamos JSON.stringify, enviamos el paquete completo
        });

        if (respuesta.ok) {
          alert("¡Avalúo guardado y PDF generado con éxito!");
          setVistaActiva('dashboard');
        } else {
          alert("Hubo un error al procesar el documento.");
        }
      } catch (error) {
        alert("Error de conexión con el servidor.");
      }
    }
  };

  const Field = ({ label, name, type = "text", col = "col-md-3", options = null }) => (
    <div className={col}>
      <label className="form-label fw-bold text-muted mb-1" style={{fontSize: '0.75rem'}}>{label}</label>
      {options ? (
        <select name={name} value={formData[name]} onChange={handleInputChange} className="form-select form-select-sm border-primary">
          <option value="">Sel...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} value={formData[name]} onChange={handleInputChange} className="form-control form-control-sm border-primary" rows="2"></textarea>
      ) : (
        <input type={type} name={name} value={formData[name]} onChange={handleInputChange} className="form-control form-control-sm border-primary" />
      )}
    </div>
  );

  const Checkbox = ({ label, name, col = "col-auto" }) => (
    <div className={col}>
      <div className="form-check form-check-inline">
        <input type="checkbox" name={name} checked={formData[name]} onChange={handleCheckboxChange} className="form-check-input border-primary" />
        <label className="form-check-label text-muted small">{label}</label>
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm border-0 fade-in">
      <style>{`
        .step-container { cursor: pointer; transition: opacity 0.2s; }
        .step-container:hover { opacity: 0.8; }
        .step-indicator { width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; background-color: #e9ecef; color: #6c757d; margin-right: 10px; font-size: 1.1rem;}
        .step-active .step-indicator { background-color: #1d429a; color: white; box-shadow: 0 0 0 3px rgba(29, 66, 154, 0.2); }
        .step-completed .step-indicator { background-color: #198754; color: white; }
        .step-title { font-weight: 600; color: #6c757d; font-size: 0.95rem; }
        .step-active .step-title { color: #1d429a; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .section-title { color: #1d429a; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; margin-bottom: 15px; margin-top: 30px; font-weight: 700; text-transform: uppercase; font-size: 0.95rem; }
        .btn-remove-img { position: absolute; top: 5px; right: 5px; background: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; cursor: pointer;}
      `}</style>

      <div className="card-header bg-white py-4 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0 fw-bold" style={{ color: '#1d429a' }}>Registro de Nuevo Avalúo</h4>
          <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={() => setVistaActiva('dashboard')}>✖ Cancelar</button>
        </div>
        <div className="d-flex justify-content-between mt-4 px-2">
          {[{ num: 1, titulo: "General y Jurídico" }, { num: 2, titulo: "Áreas y Entorno" }, { num: 3, titulo: "Inmueble y Valoración" }, { num: 4, titulo: "Registro Fotográfico" }].map((p) => (
            <div key={p.num} className={`d-flex align-items-center step-container ${pasoFormulario === p.num ? 'step-active' : pasoFormulario > p.num ? 'step-completed' : ''}`} style={{ flex: 1 }} onClick={() => setPasoFormulario(p.num)}>
              <div className="step-indicator">{pasoFormulario > p.num ? '✓' : p.num}</div>
              <span className="step-title d-none d-md-block">{p.titulo}</span>
              {p.num !== 4 && <div className="mx-3" style={{ height: '2px', backgroundColor: '#e9ecef', flex: 1 }}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card-body p-4 bg-light" style={{ minHeight: '500px' }}>
        
        {/* ======================= PASO 1 ======================= */}
        {pasoFormulario === 1 && (
          <div className="row g-3 fade-in">
            <div className="col-12"><h5 className="section-title">■ GENERAL E IDENTIFICACIÓN</h5></div>
            <Field label="Fecha de visita" name="FechaDeVisita" type="date" />
            <Field label="Fecha del avalúo" name="FechaDelAvalio" type="date" />
            <Field label="Tipo de avalúo" name="TipoDeAvaluo" />
            <Field label="Finalidad del avalúo" name="FinalidadDelAvaluo" />
            <Field label="Objeto del avalúo" name="ObjetoDelAvaluo" />
            <Field label="Entidad" name="Entidad" />
            <Field label="Solicitante" name="Solicitante" />
            <Field label="Tipo Documento" name="TipoDeDocumento" options={['CC', 'NIT', 'CE', 'TI', 'RC']} />
            <Field label="No. Documento" name="NumeroDocumento" />
            <Field label="Tipo de Bien" name="TipoDeBien" />
            <Field label="Sector" name="Sector" options={['Urbano', 'Rural']} />
            <Field label="Vivienda Interés Social" name="ViviendaInteresSocial" options={['SI', 'NO']} />
            <Field label="Estrato" name="Estrato" />
            <Field label="Producto" name="Producto" />
            <Field label="Código DANE" name="CodigoDane" />

            <div className="col-12"><h5 className="section-title">■ UBICACIÓN Y MATRÍCULAS</h5></div>
            <Field label="Departamento" name="Departamento" />
            <Field label="Municipio" name="Municipio" />
            <Field label="Barrio" name="Barrio" />
            <Field label="Dirección" name="Direccion" col="col-md-6" />
            
            <Field label="Matrícula Tipo 1" name="matriculainmTipo1" />
            <Field label="Matrícula Número 1" name="matriculainmNumero1" />
            <Field label="Matrícula Tipo 2" name="matriculainmTipo2" />
            <Field label="Matrícula Número 2" name="matriculainmNumero2" />

            <div className="col-12"><h5 className="section-title">■ ASPECTOS JURÍDICOS</h5></div>
            <Field label="Propietario" name="Propietario" />
            <Field label="No. Escritura" name="NumeroDeEscritura" />
            <Field label="Fecha Escritura" name="AspJFecha" type="date" />
            <Field label="Notaría" name="NumeroDeNotaria" />
            <Field label="Municipio Escritura" name="AspMunicipio" />
            <Field label="Depto Escritura" name="AspDepartamento" />
            <Field label="Chip" name="Chip" />
            <Field label="Cédula Catastral" name="CedulaCatastral" />
            <Field label="Tipo de Propiedad" name="TipoDePropiedad" />
            <Field label="Coeficiente Copropiedad" name="CoeficienteDeCopropiedad" />
            <Field label="Licencia de Construcción" name="LicenciaDeConstruccion" />
            <Field label="Descripción General del Inmueble" name="DescripcionGeneral" type="textarea" col="col-12" />
          </div>
        )}

        {/* ======================= PASO 2 ======================= */}
        {pasoFormulario === 2 && (
          <div className="row g-3 fade-in">
            <div className="col-12"><h5 className="section-title">■ ÁREAS Y NORMATIVIDAD</h5></div>
            <Field label="Área Lote (M²)" name="AreaLote" type="number" col="col-md-2" />
            <Field label="Forma" name="Forma" col="col-md-2" />
            <Field label="Topografía" name="Topografia" col="col-md-2" />
            <Field label="Frente (Mts)" name="Frente" type="number" col="col-md-2" />
            <Field label="Fondo (Mts)" name="Fondo" type="number" col="col-md-2" />
            <Field label="Relación Frente/Fondo" name="RelacionFrenteFondo" col="col-md-2" />
            <Field label="Decreto/Acuerdo" name="DecretoAcuerdo" />
            <Field label="Uso Principal" name="UsoPrincipal" />
            <Field label="Altura Permitida" name="AlturaPermitida" />
            <Field label="Aislamiento Posterior" name="AislamientoPosterior" />
            <Field label="Aislamiento Lateral" name="AislamientoLateral" />
            <Field label="Antejardín" name="Antejardin" />
            <Field label="Índice Ocupación" name="IndiceDeOcupacion" />
            <Field label="Índice Construcción" name="IndiceDeConstruccion" />
            <Field label="Área Valorada" name="AreaValorada" />
            <Field label="Área Medida Inspección" name="AreaMedidaEnLaInspeccion" />
            <Field label="Área Registrada Título" name="AreaRegistradaEnTitulo" />
            <Field label="Área Legalizable" name="AreaSusceptibleDeLegalizacion" />
            <Field label="Área Catastral" name="AreaCatastral" />
            <Field label="Área Licencia Constr." name="AreaLicenciaDeConstruccion" />
            <Field label="Observaciones Áreas" name="AreaValoradaObservaciones" type="textarea" col="col-md-12" />

            <div className="col-12"><h5 className="section-title">■ SECTOR E INFRAESTRUCTURA URBANA</h5></div>
            <Field label="Demanda/Interés" name="DemandaInteres" />
            <Field label="Uso Predominante" name="UsoPredominante" />
            <Field label="Legalidad" name="Legalidad" />
            <Field label="Transporte" name="Transporte" />
            <Field label="Vías de Acceso" name="ViasDeAcceso" />
            <Field label="Andenes" name="Andenes" />
            <Field label="Acueducto" name="Acueducto" />
            <Field label="Energía Eléctrica" name="EnergiaElectrica" />
            <Field label="Gas Natural" name="GasNatural" />
            <Field label="Pavimentadas" name="Pavimentadas" />
            <Field label="Sardineles" name="Sardineles" />
            <Field label="Alcantarillado" name="Alcantarillado" />
            <Field label="Telefonía" name="Telefonia" />
            
            <div className="col-12 mt-3"><label className="fw-bold text-muted small">Condiciones del Sector:</label></div>
            <Checkbox label="Aire" name="Aire" />
            <Checkbox label="Aguas Servidas" name="AguasServidas" />
            <Checkbox label="Basura" name="Basura" />
            <Checkbox label="Inseguridad" name="Inseguridad" />
            <Checkbox label="Ruido" name="Ruido" />
            <Field label="Observaciones Sector" name="SectorObservaciones" type="textarea" col="col-12 mt-2" />

            <div className="col-12 mt-4"><label className="fw-bold text-muted small">Amoblamiento Urbano:</label></div>
            <Checkbox label="Alamedas" name="Alamedas" />
            <Checkbox label="Alumbrado" name="Alumbrado" />
            <Checkbox label="Arborización" name="Arborizacion" />
            <Checkbox label="Ciclorutas" name="Ciclorutas" />
            <Checkbox label="Paradero" name="Paradero" />
            <Checkbox label="Parques" name="Parques" />
            <Checkbox label="Zonas Verdes" name="ZonasVerdes" />

            <Field label="Perspectivas Valorización" name="PerspectivasDeValorizacion" type="textarea" col="col-12 mt-2" />
            
            <div className="col-12"><h5 className="section-title">■ EQUIPAMIENTO</h5></div>
            <div className="col-12">
              <table className="table table-sm table-bordered bg-white">
                <thead className="table-light text-center small"><tr><th>Equipamiento</th><th>Nivel de Equipamiento</th><th>Distancia Aprox.</th></tr></thead>
                <tbody>
                  <tr><td className="fw-bold small">Áreas Verdes</td><td><input name="AreasVerdesNE" value={formData.AreasVerdesNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="AreasVerdesDAM" value={formData.AreasVerdesDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                  <tr><td className="fw-bold small">Asistencial</td><td><input name="AsistencialNE" value={formData.AsistencialNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="AsistencialDAM" value={formData.AsistencialDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                  <tr><td className="fw-bold small">Comercial</td><td><input name="ComercialNE" value={formData.ComercialNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="ComercialDAM" value={formData.ComercialDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                  <tr><td className="fw-bold small">Escolar</td><td><input name="EscolarNE" value={formData.EscolarNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="EscolarDAM" value={formData.EscolarDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                  
                  {/* --- LAS 3 FILAS FALTANTES QUE AGREGASTE --- */}
                  <tr><td className="fw-bold small">Estacionamientos</td><td><input name="EstacionamientosNE" value={formData.EstacionamientosNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="EstacionamientosDAM" value={formData.EstacionamientosDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                  <tr><td className="fw-bold small">Áreas Recreativas</td><td><input name="AreasRecreativasNE" value={formData.AreasRecreativasNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="AreasRecreativasDAM" value={formData.AreasRecreativasDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                  <tr><td className="fw-bold small">Seguridad del sector</td><td><input name="SeguridadSectorNE" value={formData.SeguridadSectorNE} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td><td><input name="SeguridadSectorDAM" value={formData.SeguridadSectorDAM} onChange={handleInputChange} className="form-control form-control-sm border-0"/></td></tr>
                </tbody>
              </table>
            </div>

            <div className="col-12"><h5 className="section-title">■ COORDENADAS (GPS)</h5></div>
            <Field label="Latitud" name="Latitud" />
            <Field label="Longitud" name="Longitud" />
          </div>
        )}

        {/* ======================= PASO 3 ======================= */}
        {pasoFormulario === 3 && (
          <div className="row g-3 fade-in">
            <div className="col-12"><h5 className="section-title">■ EDIFICACIÓN ESTRUCTURA</h5></div>
            <Field label="Estado Construcción" name="EstadoDeLaConstruccion" />
            <Field label="Avance Construcción" name="AvanceEnConstruccion" />
            <Field label="Estado Conservación" name="EstadoDeConservacion" />
            <Field label="No. Pisos" name="NoDePisosDelInmueble" type="number" />
            <Field label="No. Sótanos" name="NumeroDeSotanos" type="number" />
            <Field label="Vida Útil" name="VidaUtil" />
            <Field label="Vida Remanente" name="VidaRemanente" />
            <Field label="Año Construcción" name="YearDeConstruccion" type="number" />
            <Field label="Edad (Años)" name="Edad" type="number" />
            <Field label="Estructura" name="Estructura" />
            <Field label="Material Estructura" name="MaterialDeEstructura" />
            <Field label="Estado Estructura" name="EstructuraEstado" />
            <Field label="Remodelado" name="Remodelado" options={['SI', 'NO']} />
            <Field label="Uso Actual" name="UsoActualPredominante" />
            <Field label="Ajuste Sismorresistente" name="AjusteSismorresistente" />
            <Field label="Cubierta" name="Cubierta" />
            <Field label="Fachada" name="Fachada" />
            <Field label="Tipo Fachada Mts" name="TipoDeFachadaEnMetros" />
            <Field label="Estructura Reforzada" name="EstructuraReforzada" />
            <Field label="Daños Previos" name="DanosPrevios" />
            <Field label="Material Construcción" name="MaterialDeConstruccion" />
            <Field label="Iluminación" name="Iluminacion" />
            <Field label="Ventilación" name="Ventilacion" />
            <Field label="Irregularidad Planta" name="IrregularidadPlanta" />
            <Field label="Irregularidad Altura" name="IrregularidadAltura" />
            <Field label="Comentarios Estructura" name="ComentariosDeLaEstructura" type="textarea" col="col-12" />

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2 mt-4">
                <h5 className="section-title mb-0 border-0">■ EDIFICACIÓN ACABADOS</h5>
                <button type="button" className="btn btn-sm btn-primary fw-bold" onClick={agregarAcabado}>+ Añadir Acabado</button>
              </div>
              <table className="table table-sm table-bordered bg-white text-center align-middle">
                <thead className="table-light small"><tr><th>Recinto</th><th>Acabados Pisos</th><th>Acabados Muros</th><th></th></tr></thead>
                <tbody>
                  {formData.acabadosEdificacion.map((ac, index) => (
                    <tr key={index}>
                      <td><input className="form-control form-control-sm border-0" value={ac.recinto} onChange={(e) => handleAcabado(index, 'recinto', e.target.value)} /></td>
                      <td><input className="form-control form-control-sm border-0" value={ac.pisos} onChange={(e) => handleAcabado(index, 'pisos', e.target.value)} /></td>
                      <td><input className="form-control form-control-sm border-0" value={ac.muros} onChange={(e) => handleAcabado(index, 'muros', e.target.value)} /></td>
                      <td><button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => eliminarAcabado(index)}>✕</button></td>
                    </tr>
                  ))}
                  {formData.acabadosEdificacion.length === 0 && <tr><td colSpan="4" className="text-muted small py-3">Presione "+ Añadir Acabado" para agregar recintos.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="col-12"><h5 className="section-title">■ DEPENDENCIAS Y SERVICIOS DEL PREDIO</h5></div>
            <Field label="Acueducto" name="PredioAcueducto" col="col-md-2" />
            <Field label="Energía" name="PredioEnergiaElectrica" col="col-md-2" />
            <Field label="Telefonía" name="PredioTelefonia" col="col-md-2" />
            <Field label="Alcantarillado" name="PredioAlcantarillado" col="col-md-2" />
            <Field label="Gas Natural" name="PredioGasNatural" col="col-md-2" />
            
            <div className="w-100 mt-2"></div>
            <Field label="Alcobas" name="PredioAlcobas" type="number" col="col-md-2" />
            <Field label="Baños Priv." name="PredioBanoPrivado" type="number" col="col-md-2" />
            <Field label="Baños Soc." name="PredioBanoSocial" type="number" col="col-md-2" />
            <Field label="Cocinas" name="PredioCocina" type="number" col="col-md-2" />
            <Field label="Salas" name="PredioSala" type="number" col="col-md-2" />
            <Field label="Comedores" name="PredioComedor" type="number" col="col-md-2" />
            <Field label="Zona Ropas" name="PredioZonaDeRopas" type="number" col="col-md-2" />
            <Field label="Estudio" name="PredioEstudio" type="number" col="col-md-2" />
            <Field label="Balcón" name="PredioBalcon" type="number" col="col-md-2" />
            <Field label="Terraza" name="PredioTerraza" type="number" col="col-md-2" />
            <Field label="Jardín" name="PredioJardin" type="number" col="col-md-2" />
            <Field label="Closets" name="PredioCloset" type="number" col="col-md-2" />

            <div className="col-12 mt-3"><label className="fw-bold text-muted small">Garajes y Otros:</label></div>
            <Field label="Cupos Garaje" name="PredioTotalCuposDeParqueo" type="number" col="col-md-2" />
            <Field label="Bahía Comunal" name="PredioBahiaComunal" col="col-md-2" />
            <Field label="Uso Exclusivo" name="PredioUsoExclusivo" col="col-md-2" />
            <Field label="Bodega" name="PredioBodega" col="col-md-2" />
            <Field label="Depósito" name="PredioDeposito" col="col-md-2" />
            <Field label="Local" name="PredioLocal" col="col-md-2" />

            <div className="col-12"><h5 className="section-title">■ DOTACIÓN COMUNAL</h5></div>
            <Field label="Valor Admón" name="DCValorAdmon" />
            <Field label="Mensualidad" name="DCMensualidad" />
            <Field label="Admón m²" name="DCValorAdmonM2" />
            <Field label="Vigilancia Priv." name="DCVigilanciaPrivada" />
            
            <div className="col-12 mt-2 d-flex flex-wrap gap-2">
              <Checkbox label="A.A. Central" name="DCAACentral" /><Checkbox label="BBQ" name="DCBBQ" /><Checkbox label="Bicicletero" name="DCBicicletero" />
              <Checkbox label="Gimnasio" name="DCGimnasio" /><Checkbox label="Piscina" name="DCPiscina" /><Checkbox label="Zonas Verdes" name="DCZonaVerde" />
              <Checkbox label="CCTV" name="DCCCTV" /><Checkbox label="Vigilancia 24H" name="DCVigilancia24Horas" /><Checkbox label="Salón Comunal" name="DCSalonComunal" />
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2 mt-5">
                <h5 className="section-title mb-0 border-0">■ OFERTAS (MERCADO)</h5>
                <button type="button" className="btn btn-sm btn-primary fw-bold" onClick={agregarOferta}>+ Agregar Oferta</button>
              </div>
              <div className="table-responsive rounded border shadow-sm">
                <table className="table table-sm table-hover mb-0 bg-white align-middle text-center" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light"><tr><th>Dirección</th><th>Edad</th><th>A. Lote</th><th>A. Constr</th><th>V. Constr</th><th>V. Comercial</th><th>Fuente</th><th></th></tr></thead>
                  <tbody>
                    {formData.ofertasMercado.map((of, i) => (
                      <tr key={i}>
                        <td><input className="form-control form-control-sm border-0" value={of.direccion} onChange={(e) => handleOferta(i, 'direccion', e.target.value)} /></td>
                        <td><input type="number" className="form-control form-control-sm border-0" value={of.edad} onChange={(e) => handleOferta(i, 'edad', e.target.value)} /></td>
                        <td><input type="number" className="form-control form-control-sm border-0" value={of.areaLote} onChange={(e) => handleOferta(i, 'areaLote', e.target.value)} /></td>
                        <td><input type="number" className="form-control form-control-sm border-0" value={of.areaConstr} onChange={(e) => handleOferta(i, 'areaConstr', e.target.value)} /></td>
                        <td><input type="number" className="form-control form-control-sm border-0" value={of.valorConstr} onChange={(e) => handleOferta(i, 'valorConstr', e.target.value)} /></td>
                        <td><input type="number" className="form-control form-control-sm border-0 text-success fw-bold" value={of.valorComercial} onChange={(e) => handleOferta(i, 'valorComercial', e.target.value)} /></td>
                        <td><input className="form-control form-control-sm border-0" value={of.fuente} onChange={(e) => handleOferta(i, 'fuente', e.target.value)} /></td>
                        <td><button type="button" className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => eliminarOferta(i)}>✕</button></td>
                      </tr>
                    ))}
                    {formData.ofertasMercado.length === 0 && <tr><td colSpan="8" className="py-3 text-muted">Aún no hay ofertas de mercado para comparar.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-12"><h5 className="section-title">■ CUADROS DE VALORACIÓN DEL SUJETO</h5></div>
            <Field label="Área Terreno (M²)" name="CVTArea" type="number" col="col-md-4" />
            <Field label="V. Unitario Terreno" name="CVTValorUnitario" type="number" col="col-md-4" />
            <div className="col-md-4"><label className="form-label fw-bold text-success small">Valor Total Terreno</label><input type="text" readOnly className="form-control form-control-sm bg-light text-success fw-bold" value={(formData.CVTArea * formData.CVTValorUnitario).toLocaleString('es-CO')} /></div>
            
            <Field label="Área Construcción (M²)" name="CVEArea" type="number" col="col-md-4" />
            <Field label="V. Unitario Construcción" name="CVEValorUnitario" type="number" col="col-md-4" />
            <div className="col-md-4"><label className="form-label fw-bold text-success small">Valor Total Edificación</label><input type="text" readOnly className="form-control form-control-sm bg-light text-success fw-bold" value={(formData.CVEArea * formData.CVEValorUnitario).toLocaleString('es-CO')} /></div>
            
            <Field label="Diagnóstico de Valoración" name="DVRDiagnostico" type="textarea" col="col-12 mt-3" />
          </div>
        )}

        {/* ======================= PASO 4 ======================= */}
        {pasoFormulario === 4 && (
          <div className="row g-4 fade-in">
            <div className="col-12 text-center"><h3 className="fw-bold" style={{ color: '#1d429a' }}>Registro Fotográfico</h3></div>
            <div className="col-12 mt-2">
              <div className="card border-dashed p-5 text-center shadow-sm" style={{ border: '2px dashed #1d429a', backgroundColor: '#f8f9fa' }}>
                <h1 className="text-muted mb-3" style={{ fontSize: '3rem' }}>📸</h1>
                <input type="file" className="d-none" id="uploadFotos" multiple accept="image/*" onChange={handleImageUpload} />
                <label htmlFor="uploadFotos" className="btn btn-primary px-5 fw-bold rounded-pill" style={{ cursor: 'pointer' }}>+ Buscar Imágenes</label>
              </div>
            </div>
            {imagenesPreview.length > 0 && (
              <div className="col-12 mt-4">
                <div className="d-flex flex-wrap gap-3 mt-3">
                  {imagenesPreview.map((img, index) => (
                    <div key={index} className="d-flex flex-column bg-white p-2 border rounded shadow-sm" style={{ width: '200px' }}>
                      <div className="position-relative mb-2 w-100"><img src={img.url} className="w-100 rounded border" style={{ height: '140px', objectFit: 'cover' }} /><button className="btn-remove-img" onClick={() => eliminarImagen(index)}>✕</button></div>
                      <input type="text" className="form-control form-control-sm border-primary" placeholder="Título para PDF" value={img.titulo} onChange={(e) => handleTituloImagen(index, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === BOTONES DEL WIZARD === */}
      <div className="card-footer bg-white p-4 d-flex justify-content-between border-top">
        <button className="btn btn-outline-secondary fw-bold px-4" onClick={() => setPasoFormulario(pasoFormulario - 1)} disabled={pasoFormulario === 1}>◀ Anterior</button>
        {pasoFormulario < totalPasos ? (
          <button className="btn btn-primary fw-bold px-4 shadow-sm" style={{ backgroundColor: '#1d429a' }} onClick={() => setPasoFormulario(pasoFormulario + 1)}>Siguiente ▶</button>
        ) : (
          <button className="btn btn-success fw-bold px-5 shadow-sm" onClick={confirmarGuardadoFinal}>💾 Guardar Avalúo Completo</button>
        )}
      </div>
    </div>
  )
}