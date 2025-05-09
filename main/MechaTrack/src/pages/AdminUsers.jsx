import { useState } from "react";
import { Container, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { mockUsers, mockClientOrders } from "../data/mock";
import { StyledModal, ModalBody } from "../styles/GlobalStyles";

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

const AdminUsers = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    password: "",
    role: "technician",
  });

  const activeOrdersCount = mockClientOrders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = mockClientOrders.filter(
    (o) => o.notifications?.length > 0
  ).length;
  const filteredUsers = mockUsers.filter((user) => user.role !== "admin");

  const handleCreateUser = () => {
    mockUsers.push(newUser);
    setShowModal(false);
    setNewUser({ id: "", name: "", password: "", role: "technician" });
  };

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
        <DashboardHeader title="Gestión de Usuarios" {...userData} />
        <Container className="mt-4">
          <div className="d-flex justify-content-end mb-3">
            <CustomButton onClick={() => setShowModal(true)}>
              Crear Usuario
            </CustomButton>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>
                    <CustomButton>Actualizar</CustomButton>{" "}
                    <CustomButton>Eliminar</CustomButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Container>
      </div>

      <StyledModal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>ID</Form.Label>
              <Form.Control
                type="text"
                value={newUser.id}
                onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                placeholder="Ej: U005"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Nombre del usuario"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="Contraseña"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="technician">Técnico</option>
                <option value="secretary">Secretario</option>
                <option value="client">Cliente</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </ModalBody>
        <Modal.Footer>
          <CustomButton onClick={handleCreateUser}>Crear</CustomButton>
          <CustomButton onClick={() => setShowModal(false)}>
            Cancelar
          </CustomButton>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default AdminUsers;
