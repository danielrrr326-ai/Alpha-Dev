// controllers/clases.controller.js
const Clase = require('../models/Clase.model');
const Usuario = require('../models/Usuario.model');
const { ventanaRegistroInicial, calcularEstadoFinal } = require('../helpers/asistencia.helper');

// --- ADMIN: crear clase ---
const crearClase = async (req, res) => {
  try {
    const { nombre, tipo, programasAplicables, profesor, fecha, horaInicio, horaFin, cupoMaximo } = req.body;

    const profesorDoc = await Usuario.findOne({ _id: profesor, rol: 'profesor' });
    if (!profesorDoc) {
      return res.status(404).json({ mensaje: 'Profesor no encontrado' });
    }

    const nuevaClase = new Clase({
      nombre, tipo, programasAplicables, profesor, fecha, horaInicio, horaFin, cupoMaximo
    });
    const claseGuardada = await nuevaClase.save();

    profesorDoc.horasOcupadas.push({
      clase: claseGuardada._id,
      fecha: claseGuardada.fecha,
      horaInicio: claseGuardada.horaInicio,
      horaFin: claseGuardada.horaFin
    });
    await profesorDoc.save();

    res.status(201).json(claseGuardada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear clase', error: error.message });
  }
};

// --- Listar clases (filtra por visibilidad según el rol) ---
const obtenerClases = async (req, res) => {
  try {
    const filtro = {};

    if (req.query.rol !== 'administrador') {
      filtro.estadoPublicacion = 'publicada';
    }
    if (req.query.programa) filtro.programasAplicables = req.query.programa;
    if (req.query.profesor) filtro.profesor = req.query.profesor;
    if (req.query.tipo) filtro.tipo = req.query.tipo;

    const clases = await Clase.find(filtro)
      .populate('profesor', 'nombres apellidos cedula')
      .populate('estudiantesInscritos.estudiante', 'nombres apellidos cedula')
      .sort({ fecha: 1 });

    res.json(clases);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clases', error: error.message });
  }
};

// --- ADMIN: cancelar clase ---
const cancelarClase = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    clase.estadoPublicacion = 'cancelada';
    clase.motivoCancelacion = req.body.motivo || 'Sin especificar';
    await clase.save();

    await Usuario.findByIdAndUpdate(clase.profesor, {
      $pull: { horasOcupadas: { clase: clase._id } }
    });

    res.json({ mensaje: 'Clase cancelada correctamente', clase });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar clase', error: error.message });
  }
};

// --- ADMIN: publicar clase manualmente ---
const publicarClase = async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    clase.estadoPublicacion = 'publicada';
    await clase.save();

    res.json({ mensaje: 'Clase publicada correctamente', clase });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al publicar clase', error: error.message });
  }
};

// --- ESTUDIANTE: inscribirse a una clase ---
const inscribirEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.body;
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    if (clase.estadoPublicacion !== 'publicada') {
      return res.status(400).json({ mensaje: 'Esta clase todavía no está disponible para inscripción' });
    }

    const estudiante = await Usuario.findOne({ _id: estudianteId, rol: 'estudiante' });
    if (!estudiante) return res.status(404).json({ mensaje: 'Estudiante no encontrado' });

    if (!clase.programasAplicables.includes(estudiante.programaInscrito)) {
      return res.status(400).json({ mensaje: 'Esta clase no corresponde al programa del estudiante' });
    }

    const yaInscrito = clase.estudiantesInscritos.find(
      e => e.estudiante.toString() === estudianteId && e.estadoInscripcion === 'inscrito'
    );
    if (yaInscrito) return res.status(400).json({ mensaje: 'El estudiante ya está inscrito' });

    // Validación de cupo (solo si la clase tiene límite)
    if (clase.cupoMaximo) {
      const inscritosActivos = clase.estudiantesInscritos.filter(
        e => e.estadoInscripcion === 'inscrito'
      ).length;

      if (inscritosActivos >= clase.cupoMaximo) {
        return res.status(400).json({ mensaje: 'Cupo lleno' });
      }
    }

    // Un solo push, sin repetir 'estudiante' dentro de asistencia
    clase.estudiantesInscritos.push({ estudiante: estudianteId });
    await clase.save();

    res.status(201).json(clase);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al inscribir estudiante', error: error.message });
  }
};

// --- ESTUDIANTE: anular inscripción ---
const anularInscripcion = async (req, res) => {
  try {
    const { estudianteId } = req.body;
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    const inscripcion = clase.estudiantesInscritos.find(
      e => e.estudiante.toString() === estudianteId && e.estadoInscripcion === 'inscrito'
    );
    if (!inscripcion) return res.status(404).json({ mensaje: 'Inscripción activa no encontrada' });

    inscripcion.estadoInscripcion = 'anulado';
    await clase.save();

    res.json({ mensaje: 'Inscripción anulada', clase });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al anular inscripción', error: error.message });
  }
};

// --- PROFESOR: registro inicial de asistencia ---
const registrarAsistenciaInicial = async (req, res) => {
  try {
    const { estudianteId, presente } = req.body;
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    const { apertura, cierre } = ventanaRegistroInicial(clase);
    const ahora = new Date();

    if (ahora < apertura) {
      return res.status(400).json({ mensaje: 'Todavía no se ha abierto el registro de asistencia' });
    }
    if (ahora > cierre) {
      return res.status(400).json({ mensaje: 'La ventana de registro inicial ya cerró' });
    }

    const inscripcion = clase.estudiantesInscritos.find(
      e => e.estudiante.toString() === estudianteId && e.estadoInscripcion === 'inscrito'
    );
    if (!inscripcion) return res.status(404).json({ mensaje: 'Estudiante no inscrito o activo en esta clase' });

    inscripcion.asistencia.registroInicial = { presente, hora: ahora };
    calcularEstadoFinal(inscripcion.asistencia);

    await clase.save();
    res.json({ mensaje: 'Asistencia inicial registrada', asistencia: inscripcion.asistencia });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar asistencia', error: error.message });
  }
};

// --- PROFESOR: chequeo intermedio ---
const registrarChequeoIntermedio = async (req, res) => {
  try {
    const { estudianteId, presente } = req.body;
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    const inscripcion = clase.estudiantesInscritos.find(
      e => e.estudiante.toString() === estudianteId && e.estadoInscripcion === 'inscrito'
    );
    if (!inscripcion) return res.status(404).json({ mensaje: 'Estudiante no inscrito o activo en esta clase' });

    inscripcion.asistencia.chequeoIntermedio = { aplica: true, presente, hora: new Date() };
    calcularEstadoFinal(inscripcion.asistencia);

    await clase.save();
    res.json({ mensaje: 'Chequeo intermedio registrado', asistencia: inscripcion.asistencia });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en chequeo intermedio', error: error.message });
  }
};

// --- PROFESOR: registro final ---
const registrarAsistenciaFinal = async (req, res) => {
  try {
    const { estudianteId, presente } = req.body;
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });

    const inscripcion = clase.estudiantesInscritos.find(
      e => e.estudiante.toString() === estudianteId && e.estadoInscripcion === 'inscrito'
    );
    if (!inscripcion) return res.status(404).json({ mensaje: 'Estudiante no inscrito o activo en esta clase' });

    inscripcion.asistencia.registroFinal = { presente, hora: new Date() };
    calcularEstadoFinal(inscripcion.asistencia);

    await clase.save();
    res.json({ mensaje: 'Asistencia final registrada', asistencia: inscripcion.asistencia });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar asistencia final', error: error.message });
  }
};

module.exports = {
  crearClase,
  obtenerClases,
  cancelarClase,
  publicarClase,
  inscribirEstudiante,
  anularInscripcion,
  registrarAsistenciaInicial,
  registrarChequeoIntermedio,
  registrarAsistenciaFinal
};