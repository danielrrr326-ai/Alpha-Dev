// helpers/asistencia.helper.js

// Combina la fecha de la clase + hora string "07:00" en un objeto Date real
// (evita el corrimiento de día por zona horaria)
const combinarFechaHora = (fecha, horaString) => {
  const f = new Date(fecha);
  const anio = f.getUTCFullYear();
  const mes = f.getUTCMonth();
  const dia = f.getUTCDate();
  const [horas, minutos] = horaString.split(':').map(Number);

  return new Date(anio, mes, dia, horas, minutos, 0, 0);
};

// Ventana del registro inicial: 5 min antes hasta 20 min después del inicio
const ventanaRegistroInicial = (clase) => {
  const inicio = combinarFechaHora(clase.fecha, clase.horaInicio);
  const apertura = new Date(inicio.getTime() - 5 * 60000);
  const cierre = new Date(inicio.getTime() + 20 * 60000);
  return { apertura, cierre };
};

const calcularEstadoFinal = (asistencia) => {
  const { registroInicial, chequeoIntermedio, registroFinal } = asistencia;

  if (registroInicial.presente === null) {
    asistencia.estadoFinal = 'pendiente';
    return asistencia;
  }

  let estado = registroInicial.presente ? 'verde' : 'rojo';

  if (chequeoIntermedio.aplica && chequeoIntermedio.presente === false) {
    estado = 'rojo';
  }

  if (estado === 'verde' && registroFinal.presente === false) {
    estado = 'amarillo';
  }

  asistencia.estadoFinal = estado;
  return asistencia;
};

module.exports = { combinarFechaHora, ventanaRegistroInicial, calcularEstadoFinal };