require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');
const iniciarJobPublicacion = require('./jobs/publicarClases.job');

const app = express();
const PORT = process.env.PORT || 3000;

conectarDB();

app.use(cors());
app.use(express.json());

const usuariosRoutes = require('./routes/usuarios.routes');
const clasesRoutes = require('./routes/clases.routes');
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

app.use('/usuarios', usuariosRoutes);
app.use('/clases', clasesRoutes);

app.get('/', (req, res) => {
  res.send('API Alpha-Dev funcionando 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  iniciarJobPublicacion(); // arranca el cron job de los jueves
});