const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // para poder recibir JSON en el body
app.use(require('cors')()); // si vas a conectarlo con Angular, necesitas CORS

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Hola mundo');
});

// Levantar el servidor en el puerto 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});