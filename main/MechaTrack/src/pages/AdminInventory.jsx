import { useState, useEffect } from "react";
import { Container, Table, Form, Modal } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { StyledModal, ModalBody } from "../styles/GlobalStyles";
import axios from "axios";
import { toast } from "react-toastify";

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminInventory = () => {
  const { user, token } = useAuth();
  const [codeFilter, setCodeFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({
    id: "",
    name: "",
    description: "",
    quantity: 0,
    price: 0,
  });

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await axios.get("/api/parts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setParts(response.data);
      } catch (error) {
        toast.error("Error al cargar repuestos");
        console.error("[AdminInventory] Error al cargar repuestos:", error);
      }
    };
    if (token) fetchParts();
  }, [token]);

  const filteredParts = parts.filter(
    (part) =>
      (!codeFilter ||
        part.id.toLowerCase().includes(codeFilter.toLowerCase())) &&
      (!nameFilter ||
        part.name.toLowerCase().includes(nameFilter.toLowerCase()))
  );

  const handleCreatePart = async () => {
    try {
      const response = await axios.post("/api/parts", newPart, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParts([...parts, response.data]);
      setShowModal(false);
      setNewPart({
        id: "",
        name: "",
        description: "",
        quantity: 0,
        price: 0,
      });
      toast.success("Repuesto creado");
    } catch (error) {
      toast.error("Error al crear repuesto");
      console.error("[AdminInventory] Error al crear repuesto:", error);
    }
  };

  const userData = {
    userId: user?.id,
    userName: `${user?.first_name} ${user?.last_name}`,
    activeOrdersCount: 0,
    notificationsCount: 0,
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
