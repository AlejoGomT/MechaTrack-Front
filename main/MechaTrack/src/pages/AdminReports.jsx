import { useState } from "react";
import { Container, Table, Form } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { mockClientOrders, mockVehicles } from "../data/mock";

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Vehiculos", path: "../admin/vehicles" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminReports = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const branches = [...new Set(mockVehicles.map((v) => v.Sucursal))];
  const activeOrdersCount = mockClientOrders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = mockClientOrders.filter(
    (o) => o.notifications?.length > 0
  ).length;

  const filteredOrders = mockClientOrders.filter((order) => {
    const vehicle = mockVehicles.find(
      (v) => v.Económico === order.vehicleEconomicNumber
    );
    const orderDate = new Date(order.createdAt);
    return (
      (!startDate || orderDate >= new Date(startDate)) &&
      (!endDate || orderDate <= new Date(endDate)) &&
      (!branchFilter || vehicle?.Sucursal === branchFilter)
    );
  });

  const reports = branches
    .map((branch) => {
      const branchOrders = filteredOrders.filter((order) => {
        const vehicle = mockVehicles.find(
          (v) => v.Económico === order.vehicleEconomicNumber
        );
        return vehicle?.Sucursal === branch;
      });
      return {
        branch,
        active: branchOrders.filter((o) => o.status === "En Proceso").length,
        completed: branchOrders.filter((o) => o.status === "Finalizado").length,
        partsUsed: branchOrders.reduce(
          (acc, o) => acc + (o.parts?.length || 0),
          0
        ),
      };
    })
    .filter((r) => r.active > 0 || r.completed > 0);

  const userData = {
    userId: user?.id,
    userName: user?.name,
    activeOrdersCount,
    notificationsCount,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Generación de Informes" {...userData} />
        <Container className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-3">
              <Form.Group>
                <Form.Label>Fecha Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: "200px" }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Fecha Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: "200px" }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Sucursal</Form.Label>
                <Form.Select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{ width: "200px" }}
                >
                  <option value="">Todas</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <CustomButton>Generar Informe</CustomButton>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Órdenes Activas</th>
                <th>Órdenes Finalizadas</th>
                <th>Repuestos Utilizados</th>
                <th>Descargar</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index}>
                  <td>{report.branch}</td>
                  <td>{report.active}</td>
                  <td>{report.completed}</td>
                  <td>{report.partsUsed}</td>
                  <td>
                    <CustomButton>PDF</CustomButton>{" "}
                    <CustomButton>Excel</CustomButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Container>
      </div>
    </>
  );
};

export default AdminReports;
