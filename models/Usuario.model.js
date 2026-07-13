// models/Usuario.model.js
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  // --- Datos comunes a los 3 roles ---
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  anioNacimiento: { type: Number, required: true },
  cedula: { type: String, required: true, unique: true },
  registroRun: { type: String, required: true, unique: true },

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // se guarda encriptada

  rol: {
    type: String,
    enum: ['administrador', 'profesor', 'estudiante'],
    required: true
  },

  huellaId: { type: String, default: null }, // se activa más adelante

  // --- Solo aplica si rol = 'estudiante' ---
  programaInscrito: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'C1', 'C2', 'C3', 'PPL', 'CPL', 'ATPL'],
    default: null
  },
  estadoPago: {
    type: String,
    enum: ['paz_y_salvo', 'debe'],
    default: null
  },

  // --- Solo aplica si rol = 'profesor' ---
  certificados: {
    type: [String], // ej: ['A1', 'A2', 'PPL']
    default: []
  },

  // --- Solo aplica si rol = 'profesor' (se llena automático) ---
  horasOcupadas: [
    {
      clase: { type: mongoose.Schema.Types.ObjectId, ref: 'Clase' },
      fecha: Date,
      horaInicio: String,
      horaFin: String
    }
  ]
}, { timestamps: true }); // agrega createdAt y updatedAt automático

module.exports = mongoose.model('Usuario', usuarioSchema);