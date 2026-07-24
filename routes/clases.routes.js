const express = require('express');
const router = express.Router();
const c = require('../controllers/clases.controller');
const { validarJWT, esAdminOProfesor } = require('../middlewares/validar-jwt');

router.post('/', c.crearClase);                                  // Admin crea clase
router.get('/', c.obtenerClases);                                 // Listar (?rol=&programa=&profesor=&tipo=)
router.patch('/:id/cancelar', c.cancelarClase);                   // Admin cancela
router.patch('/:id/publicar', c.publicarClase);

router.post('/:id/inscribir', c.inscribirEstudiante);             // Estudiante se inscribe
router.patch('/:id/anular-inscripcion', c.anularInscripcion);     // Estudiante anula

router.patch('/:id/asistencia-inicial', validarJWT, c.registrarAsistenciaInicial);
router.patch('/:id/chequeo-intermedio', [validarJWT, esAdminOProfesor], c.registrarChequeoIntermedio);
router.patch('/:id/asistencia-final', validarJWT, c.registrarAsistenciaFinal);

module.exports = router;