// Mock de usuarios para login
const mockUsers = [
  {
    id: "U001",
    name: "Ana",
    userType: "Admin",
    password: "admin123",
  },
  {
    id: "U002",
    name: "Carlos",
    userType: "Tecnico",
    password: "tecnico456",
  },
  {
    id: "U003",
    name: "Maria",
    userType: "Secretaria",
    password: "secre789",
  },
  {
    id: "U004",
    name: "Juan",
    userType: "Cliente",
    password: "cliente101",
  },
  {
    id: "U005",
    name: "Luis",
    userType: "Admin",
    password: "admin2023",
  },
];

// Mock de órdenes de clientes
const mockClientOrders = [
  {
    orderNumber: "001",
    economicNumber: "3429",
    status: "En Proceso",
    entryDate: "2025-03-10",
    technicianId: "U002",
    history: [
      { order: "001", description: "Cambio de Aceite", date: "2025-03-01" },
      { order: "002", description: "Cambio de Frenos", date: "2025-03-05" },
    ],
    notifications: true, // Simula una notificación sobre repuestos
  },
  {
    orderNumber: "002",
    economicNumber: "4184",
    status: "Finalizado",
    entryDate: "2025-03-09",
    technicianId: "U002",
    history: [
      { order: "001", description: "Revisión de Motor", date: "2025-02-28" },
      { order: "002", description: "Alineación", date: "2025-03-03" },
    ],
    notifications: false, // Sin notificaciones
  },
  {
    orderNumber: "003",
    economicNumber: "3945",
    status: "En Proceso",
    entryDate: "2025-03-15",
    technicianId: null,
    history: [
      { order: "001", description: "Mantenimiento General", date: "2025-03-10" },
    ],
    notifications: false, // Sin notificaciones
  },
];

const mockVehicles = [
  {
    Económico: "3429",
    Marca: "ISUZU",
    Modelo: "ELF 500 E5",
    Año: 2023,
    Kilometraje: 162316,
    Taller: "923",
    activeOrder: "001",
    history: [
      { orderNumber: "001", description: "Cambio de Aceite", date: "2025-03-01", status: "En Proceso" },
      { orderNumber: "002", description: "Cambio de Frenos", date: "2025-03-05", status: "Finalizado" },
    ],
  },
  {
    Económico: "4184",
    Marca: "HINO",
    Modelo: "816 SEMI LONG E5",
    Año: 2023,
    Kilometraje: 9291,
    Taller: "4221",
    activeOrder: null,
    history: [
      { orderNumber: "001", description: "Revisión de Motor", date: "2025-02-28", status: "Finalizado" },
      { orderNumber: "002", description: "Alineación", date: "2025-03-03", status: "Finalizado" },
    ],
  },
  {
    Económico: "3945",
    Marca: "ISUZU",
    Modelo: "ELF 300 E5",
    Año: 2022,
    Kilometraje: 49291,
    Taller: "754",
    activeOrder: "003",
    history: [
      { orderNumber: "001", description: "Mantenimiento General", date: "2025-03-10", status: "Finalizado" },
      { orderNumber: "003", description: "Revisión de Suspensión", date: "2025-03-15", status: "En Proceso" },
    ],
  },

  { Económico: "4221", Marca: "HINO", Modelo: "818 SEMI LONG E5", Año: 2023, Kilometraje: 8124, Taller: "4152", activeOrder: null, history: [] },
  { Económico: "4152", Marca: "HINO", Modelo: "818 SEMI LONG E5", Año: 2023, Kilometraje: 7523, Taller: "10108", activeOrder: null, history: [] },
  { Económico: "4155", Marca: "HINO", Modelo: "818 SEMI LONG E5", Año: 2023, Kilometraje: 12018, Taller: "12453", activeOrder: null, history: [] },
  { Económico: "4154", Marca: "HINO", Modelo: "818 SEMI LONG E5", Año: 2023, Kilometraje: 12543, Taller: "3438", activeOrder: null, history: [] },
  { Económico: "3438", Marca: "ISUZU", Modelo: "ELF 500 E5", Año: 2020, Kilometraje: 252626, Taller: "3410", activeOrder: null, history: [] },
  { Económico: "3410", Marca: "ISUZU", Modelo: "FORWARD 800K E5", Año: 2020, Kilometraje: 295781, Taller: "3867", activeOrder: null, history: [] },
  { Económico: "3414", Marca: "ISUZU", Modelo: "ELF 300 E5", Año: 2020, Kilometraje: 101748, Taller: "2987", activeOrder: null, history: [] },
  { Económico: "3867", Marca: "HINO", Modelo: "616 SEMI LONG E5", Año: 2022, Kilometraje: 35145, Taller: "2782", activeOrder: null, history: [] },
  { Económico: "2987", Marca: "HINO", Modelo: "1018 SEMI LONG", Año: 2017, Kilometraje: 32392, Taller: "3415", activeOrder: null, history: [] },
  { Económico: "2782", Marca: "ISUZU", Modelo: "ELF 300 E5", Año: 2016, Kilometraje: 134343, Taller: "3415", activeOrder: null, history: [] },
  { Económico: "3415", Marca: "ISUZU", Modelo: "FORWARD 800K E5", Año: 2020, Kilometraje: 8024, Taller: "3184", activeOrder: null, history: [] },
  { Económico: "3184", Marca: "ISUZU", Modelo: "ELF 300 E5", Año: 2020, Kilometraje: 22185, Taller: "3411", activeOrder: null, history: [] },
  { Económico: "3411", Marca: "HINO", Modelo: "616 SEMI LONG", Año: 2014, Kilometraje: 11002, Taller: "3860", activeOrder: null, history: [] },
  { Económico: "3860", Marca: "HINO", Modelo: "616 LONG HIBRIDO E5", Año: 2022, Kilometraje: 55761, Taller: "3865", activeOrder: null, history: [] },
  { Económico: "3865", Marca: "ISUZU", Modelo: "ELF 300 E5", Año: 2020, Kilometraje: 10642, Taller: "3360", activeOrder: null, history: [] },
  { Económico: "3360", Marca: "HINO", Modelo: "1016 E5", Año: 2022, Kilometraje: 89503, Taller: "21230", activeOrder: null, history: [] },
  { Económico: "3860", Marca: "ISUZU", Modelo: "ELF 500 E5", Año: 2022, Kilometraje: 211230, Taller: "", activeOrder: null, history: [] },
];

export { mockUsers, mockClientOrders, mockVehicles };