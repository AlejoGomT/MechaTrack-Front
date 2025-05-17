const messages = [
  {
    id: '001',
    orderNumber: 'Orden #001',
    subject: 'Actualización de envío',
    content: [
      { text: 'Tu pedido ha sido enviado y llegará en 2 días.', sender: 'system', timestamp: '2023-05-15T10:30:00' },
      { text: '¿Pueden darme el número de guía?', sender: 'user', timestamp: '2023-05-15T11:15:00' }
    ],
    isNew: true,
    lastUpdate: '2023-05-15T11:15:00'
  },
  {
    id: '002',
    orderNumber: 'Orden #002',
    subject: 'Confirmación de pago',
    content: [
      { text: 'Hemos recibido tu pago correctamente.', sender: 'system', timestamp: '2023-05-14T15:45:00' }
    ],
    isNew: true,
    lastUpdate: '2023-05-14T15:45:00'
  }
];

export default messages;