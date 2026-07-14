const jwt = require('jsonwebtoken');

const validarJWT = (req, res, next) => {
  // Leer el token del header 'x-token'
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({ message: 'No hay token en la petición' });
  }

  try {
    const { uid, rol, nombre } = jwt.verify(token, 'TU_FIRMA_SECRETA_SUPER_SEGURA');

    // Inyectamos los datos del usuario en la 'req' para que los controladores los usen
    req.uid = uid;
    req.rol = rol;
    req.nombre = nombre;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token no válido' });
  }
};

// Middleware opcional para restringir por roles específicos
const esAdminOProfesor = (req, res, next) => {
  if (req.rol !== 'administrador' && req.rol !== 'profesor') {
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

module.exports = { validarJWT, esAdminOProfesor };