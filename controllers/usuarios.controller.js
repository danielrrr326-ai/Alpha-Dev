// controllers/usuarios.controller.js
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario.model');

// Crear usuario (lo usa el Admin para crear estudiantes, profesores u otros admins)
const crearUsuario = async (req, res) => {
  try {
    const {
      nombres, apellidos, anioNacimiento, cedula, registroRun,
      email, password, rol, programaInscrito, estadoPago, certificados
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombres,
      apellidos,
      anioNacimiento,
      cedula,
      registroRun,
      email,
      password: passwordEncriptada,
      rol,
      programaInscrito: rol === 'estudiante' ? programaInscrito : null,
      estadoPago: rol === 'estudiante' ? estadoPago : null,
      certificados: rol === 'profesor' ? certificados : []
    });

    const usuarioGuardado = await nuevoUsuario.save();

    const { password: _, ...usuarioSinPassword } = usuarioGuardado.toObject();
    res.status(201).json(usuarioSinPassword);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'Cédula, RUN o email ya existen' });
    }
    res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
  }
};

// Listar usuarios (filtros opcionales: rol, oculto)
const obtenerUsuarios = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.rol) filtro.rol = req.query.rol;

    // Trata "sin el campo oculto" igual que "oculto: false"
    // (necesario para usuarios creados antes de que existiera este campo)
    if (req.query.oculto === 'true') {
      filtro.oculto = true;
    } else if (req.query.oculto === 'false') {
      filtro.oculto = { $ne: true };
    }

    const usuarios = await Usuario.find(filtro).select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener un usuario por id
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar usuario', error: error.message });
  }
};

// Actualizar usuario (datos, estado de pago, ocultar/restaurar, o resetear contraseña)
const actualizarUsuario = async (req, res) => {
  try {
    const datosActualizados = { ...req.body };

    if (datosActualizados.password) {
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(datosActualizados.password, salt);
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, datosActualizados, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
};