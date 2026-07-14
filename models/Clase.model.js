// models/Clase.model.js
const mongoose = require('mongoose');

const asistenciaSchema = new mongoose.Schema({
  // Se abre 5 min antes, cierra 20 min después del inicio
  registroInicial: {
    presente: { type: Boolean, default: null },
    hora: { type: Date, default: null }
  },

  // A mitad de clase, solo unos pocos estudiantes (aleatorio)
  chequeoIntermedio: {
    aplica: { type: Boolean, default: false },
    presente: { type: Boolean, default: null },
    hora: { type: Date, default: null }
  },

  // Al final de la clase, todos pasan de nuevo
  registroFinal: {
    presente: { type: Boolean, default: null },
    hora: { type: Date, default: null }
  },

  // Calculado automáticamente: 'pendiente' | 'verde' | 'rojo' | 'amarillo'
  estadoFinal: {
    type: String,
    enum: ['pendiente', 'verde', 'rojo', 'amarillo'],
    default: 'pendiente'
  }
}, { _id: false });

const claseSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ['teorica', 'practica'], required: true },

  programasAplicables: {
    type: [String],
    enum: ['A1', 'A2', 'B1', 'C1', 'C2', 'C3', 'PPL', 'CPL', 'ATPL'],
    required: true,
    validate: v => v.length > 0
  },

  profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  fecha: { type: Date, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },

  cupoMaximo: { type: Number, default: null },

  estadoPublicacion: {
    type: String,
    enum: ['pendiente', 'publicada', 'cancelada'],
    default: 'pendiente'
  },
  motivoCancelacion: { type: String, default: null },

  estudiantesInscritos: [
    {
      estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
      estadoInscripcion: {
        type: String,
        enum: ['inscrito', 'anulado'],
        default: 'inscrito'
      },
      asistencia: { type: asistenciaSchema, default: () => ({}) }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Clase', claseSchema);