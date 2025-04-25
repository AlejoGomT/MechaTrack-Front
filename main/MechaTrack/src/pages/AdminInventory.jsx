import { useState } from "react";
import { Container, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { mockParts, mockClientOrders } from "../data/mock";
import { StyledModal, ModalBody } from "../styles/GlobalStyles";

const adminMenu = [
  { label: "Inicio", path: "/admin" },
  { label: "Órdenes de Servicio", path: "/admin/orders" },
  { label: "Inventario", path: "/admin/inventory" },
  { label: "Gestión de Usuarios", path: "/admin/users" },
  { label: "Notificaciones", path: "/admin/notifications" },
  { label: "Informes", path: "/admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminInventory = () => {
  const { user } = useAuth();
  const [codeFilter, setCodeFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPart, setNewPart] = useState({
    id: "",
    name: "",
    description: "",
    quantity: 0,
    price: 0,
    image: "",
  });

  const activeOrdersCount = mockClientOrders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = mockClientOrders.filter(
    (o) => o.notifications?.length > 0
  ).length;

  const filteredParts = mockParts.filter(
    (part) =>
      (!codeFilter ||
        part.id.toLowerCase().includes(codeFilter.toLowerCase())) &&
      (!nameFilter ||
        part.name.toLowerCase().includes(nameFilter.toLowerCase()))
  );

  const handleCreatePart = () => {
    mockParts.push({ ...newPart, compatibleModels: [] });
    setShowModal(false);
    setNewPart({
      id: "",
      name: "",
      description: "",
      quantity: 0,
      price: 0,
      image: "",
    });
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
        <DashboardHeader title="Inventario" {...userData} />
        <Container className="mt-4">
          <div className="d-flex justify-content-between mb-3">
            <div className="d-flex gap-3">
              <Form.Group>
                <Form.Label>Código</Form.Label>
                <Form.Control
                  type="text"
                  value={codeFilter}
                  onChange={(e) => setCodeFilter(e.target.value)}
                  placeholder="Filtrar por código"
                  style={{ width: "200px" }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Filtrar por nombre"
                  style={{ width: "200px" }}
                />
              </Form.Group>
            </div>
            <CustomButton onClick={() => setShowModal(true)}>
              Agregar Repuesto
            </CustomButton>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Imagen</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => (
                <tr key={part.id}>
                  <td>{part.id}</td>
                  <td>{part.name}</td>
                  <td>{part.quantity}</td>
                  <td>${part.price}</td>
                  <td>{part.image || "Sin imagen"}</td>
                  <td>
                    <CustomButton>Ver Detalles</CustomButton>{" "}
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
          <Modal.Title>Crear Nuevo Repuesto</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Código</Form.Label>
              <Form.Control
                type="text"
                value={newPart.id}
                onChange={(e) => setNewPart({ ...newPart, id: e.target.value })}
                placeholder="Ej: P005"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={newPart.name}
                onChange={(e) =>
                  setNewPart({ ...newPart, name: e.target.value })
                }
                placeholder="Ej: Filtro de Aire"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                value={newPart.description}
                onChange={(e) =>
                  setNewPart({ ...newPart, description: e.target.value })
                }
                placeholder="Descripción del repuesto"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cantidad</Form.Label>
              <Form.Control
                type="number"
                value={newPart.quantity}
                onChange={(e) =>
                  setNewPart({ ...newPart, quantity: Number(e.target.value) })
                }
                placeholder="Cantidad disponible"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                value={newPart.price}
                onChange={(e) =>
                  setNewPart({ ...newPart, price: Number(e.target.value) })
                }
                placeholder="Precio en $"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Imagen</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) =>
                  setNewPart({
                    ...newPart,
                    image: e.target.files[0]?.name || "",
                  })
                }
              />
            </Form.Group>
          </Form>
        </ModalBody>
        <Modal.Footer>
          <CustomButton onClick={handleCreatePart}>Crear</CustomButton>
          <CustomButton onClick={() => setShowModal(false)}>
            Cancelar
          </CustomButton>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default AdminInventory;
