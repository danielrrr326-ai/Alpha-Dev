// jobs/publicarClases.job.js
const cron = require('node-cron');
const Clase = require('../models/Clase.model');

const iniciarJobPublicacion = () => {
  // Se ejecuta todos los jueves a las 5:30 pm, hora Colombia
  cron.schedule('30 17 * * 4', async () => {
    try {
      const resultado = await Clase.updateMany(
        { estadoPublicacion: 'pendiente' },
        { estadoPublicacion: 'publicada' }
      );
      console.log(`📢 ${resultado.modifiedCount} clase(s) publicadas automáticamente`);
    } catch (error) {
      console.error('❌ Error publicando clases automáticamente:', error.message);
    }
  }, {
    timezone: 'America/Bogota'
  });

  console.log('🕒 Job de publicación de clases (jueves 5:30 pm) programado');
};

module.exports = iniciarJobPublicacion;