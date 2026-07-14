const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario.model');

const login = async (req, res) => {
  const { cedula, password } = req.body;

  try {
    // 1. Buscar usuario por cédula
    const usuario = await Usuario.findOne({ cedula });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. Validar contraseña comparando contra el hash guardado
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 3. Generar el JWT incluyendo ID, Rol y Nombre
    const token = jwt.sign(
      {
        uid: usuario._id,
        rol: usuario.rol,
        nombre: `${usuario.nombres} ${usuario.apellidos}`
      },
      'TU_FIRMA_SECRETA_SUPER_SEGURA',
      { expiresIn: '4h' }
    );

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario._id,
        nombres: usuario.nombres,
        rol: usuario.rol
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login };