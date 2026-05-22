const prisma = require('../config/database');
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

const createPaymentPreference = async (cuota, jugador) => {
  const preference = {
    items: [{
      title: `Cuota ${getMonthName(cuota.mes)} ${cuota.anio}`,
      description: `Pago de cuota mensual - Jugador: ${jugador.nombre}`,
      unit_price: parseFloat(cuota.monto),
      quantity: 1
    }],
    payer: {
      email: jugador.email || 'jugador@email.com',
      name: jugador.nombre
    },
    external_reference: cuota.id,
    notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL || 'http://localhost:3000/api/pagos/webhook',
    back_urls: {
      success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagos/success`,
      failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagos/failure`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagos/pending`
    },
    auto_return: 'all'
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
    },
    body: JSON.stringify(preference)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error de Mercado Pago: ${error.message || 'Error desconocido'}`);
  }

  return response.json();
};

const getPaymentStatus = async (paymentId) => {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al obtener estado del pago');
  }

  return response.json();
};

const processWebhook = async (data) => {
  const { type, data: webhookData } = data;

  if (type === 'payment') {
    const paymentId = webhookData.id;
    const payment = await getPaymentStatus(paymentId);

    if (payment.status === 'approved') {
      const cuotaId = payment.external_reference;
      const monto = payment.transaction_amount;

      await prisma.pago.create({
        data: {
          cuotaId,
          monto,
          metodoPago: 'MERCADO_PAGO',
          observacion: `Pago ID: ${paymentId}`
        }
      });

      const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } });
      if (cuota) {
        const tienePagos = await prisma.pago.count({ where: { cuotaId } });
        if (tienePagos > 0) {
          await prisma.cuota.update({
            where: { id: cuotaId },
            data: { vencida: false }
          });
        }
      }

      return { success: true, message: 'Pago aprobado' };
    }
  }

  return { success: false, message: 'Webhook procesado' };
};

function getMonthName(month) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || '';
}

module.exports = { createPaymentPreference, getPaymentStatus, processWebhook };