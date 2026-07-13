// routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

router.post('/', usuariosController.crearUsuario);           // POST   /usuarios
router.get('/', usuariosController.obtenerUsuarios);          // GET    /usuarios  (?rol=profesor)
router.get('/:id', usuariosController.obtenerUsuarioPorId);   // GET    /usuarios/:id
router.put('/:id', usuariosController.actualizarUsuario);     // PUT    /usuarios/:id
router.delete('/:id', usuariosController.eliminarUsuario);    // DELETE /usuarios/:id

module.exports = router;