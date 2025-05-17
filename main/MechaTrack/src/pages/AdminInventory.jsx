import { useState, useEffect } from "react";
import { Container, Form, Pagination, Modal, ListGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import PartForm from "../components/PartForm";
import PartDetailsModal from "../components/PartDetailsModal";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  StyledModal,
  ModalBody,
  StyledTable,
  ActionsContainer,
} from "../styles/GlobalStyles";
import { API_URL } from "../services/apiConfig";
import { getVehicleModels } from "../services/vehicleService";
import {
  getParts,
  createPart,
  updatePart,
  deletePart,
} from "../services/partService";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPencil, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faEye, faPencil, faTrashCan);

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

const AdminInventory = () => {
  const { user, token } = useAuth();
  const [codeFilter, setCodeFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [parts, setParts] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partsData, models] = await Promise.all([
          getParts(modelFilter, pagination.page, pagination.limit),
          getVehicleModels(),
        ]);
        setParts(partsData.parts);
        setPagination({
          ...pagination,
          total: partsData.total,
          totalPages: partsData.totalPages,
        });
        setVehicleModels(models);
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error("[AdminInventory] Error al cargar datos:", error);
      }
    };
    if (token) fetchData();
  }, [token, pagination.page, modelFilter]);

  const filteredParts = parts.filter(
    (part) =>
      (!codeFilter ||
        part.id.toLowerCase().includes(codeFilter.toLowerCase())) &&
      (!nameFilter ||
        part.name.toLowerCase().includes(nameFilter.toLowerCase())) &&
      (!modelFilter ||
        (part.compatible_models &&
          part.compatible_models.includes(modelFilter)))
  );

  const handleCreatePart = async (partData) => {
    try {
      const newPart = await createPart(partData);
      setParts([...parts, newPart]);
      setShowCreateModal(false);
    } catch (error) {
      throw error;
    }
  };

  const handleEditPart = async (partData) => {
    console.log(
      "[AdminInventory] handleEditPart - selectedPart:",
      selectedPart
    );
    setIsSubmitting(true);
    try {
      const updatedPart = await updatePart(selectedPart.id, partData);
      setParts(parts.map((p) => (p.id === updatedPart.id ? updatedPart : p)));
      setShowEditModal(false);
      setSelectedPart(null);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePart = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este repuesto?")) {
      try {
        await deletePart(id);
        setParts(parts.filter((p) => p.id !== id));
        toast.success("Repuesto eliminado");
      } catch (error) {
        toast.error(error.message || "Error al eliminar repuesto");
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
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
        <Container className="mt-4 d-flex flex-column align-items-center gap-3">
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Código</FilterLabel>
              <Form.Control
                type="text"
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                placeholder="Filtrar por código"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Nombre</FilterLabel>
              <Form.Control
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filtrar por nombre"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Modelo Compatible</FilterLabel>
              <FilterSelect
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {vehicleModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <CustomButton onClick={() => setShowCreateModal(true)}>
              Agregar Repuesto
            </CustomButton>
          </FiltersContainer>
          <ListGroup.Item className="w-100">
            <StyledTable>
              <thead>
                <tr>
                  <th>Imagen</th>
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
                    <td className="text-center">
                      {part.image ? (
                        <img
                          src={`${API_URL}${part.image}`}
                          alt={part.name}
                          style={{ maxWidth: "50px", maxHeight: "50px" }}
                          onError={(e) => {
                            e.target.src = "/placeholder.png";
                          }}
                        />
                      ) : (
                        "Sin imagen"
                      )}
                    </td>
                    <td>{part.id}</td>
                    <td>{part.name}</td>
                    <td>{part.quantity}</td>
                    <td>${part.price}</td>
                    <td>
                      <ActionsContainer>
                        <CustomButton
                          onClick={() => {
                            setSelectedPart(part);
                            setShowDetailsModal(true);
                          }}
                          title="Ver Detalles"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </CustomButton>
                        <CustomButton
                          onClick={() => {
                            setSelectedPart(part);
                            setShowEditModal(true);
                          }}
                          title="Actualizar"
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </CustomButton>
                        <CustomButton
                          onClick={() => handleDeletePart(part.id)}
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </CustomButton>
                      </ActionsContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </ListGroup.Item>
          <Pagination>
            <Pagination.Prev
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            />
            {[...Array(pagination.totalPages).keys()].map((i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === pagination.page}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            />
          </Pagination>
        </Container>
      </div>

      <StyledModal
        variant="createParts"
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Repuesto</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <PartForm
            onSubmit={handleCreatePart}
            onCancel={() => setShowCreateModal(false)}
          />
        </ModalBody>
      </StyledModal>

      <StyledModal
        variant="createParts"
        show={showEditModal}
        onHide={() => {
          if (!isSubmitting) {
            setShowEditModal(false);
            setSelectedPart(null);
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Repuesto</Modal.Title>
        </Modal.Header>
        <ModalBody>
          {selectedPart && (
            <PartForm
              initialData={selectedPart}
              onSubmit={handleEditPart}
              onCancel={() => {
                if (!isSubmitting) {
                  setShowEditModal(false);
                  setSelectedPart(null);
                }
              }}
            />
          )}
        </ModalBody>
      </StyledModal>

      <PartDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedPart(null);
        }}
        part={selectedPart}
      />
    </>
  );
};

export default AdminInventory;
