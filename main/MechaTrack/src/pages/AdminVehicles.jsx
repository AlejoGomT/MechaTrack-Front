import { useState, useEffect } from "react";
import { Container, Form, Pagination, Modal, ListGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import VehicleForm from "../components/VehicleForm";
import VehicleDetailsModal from "../components/VehicleDetailsModal";
import CustomButton from "../components/CustomButton";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  FilterInput,
  StyledModal,
  ModalBody,
  StyledTable,
  ActionsContainer,
} from "../styles/GlobalStyles";
import {
  getVehicles,
  getVehicleModels,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getBranches,
} from "../services/orderService";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPencil, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faEye, faPencil, faTrashCan);

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Vehículos", path: "../admin/vehicles" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminVehicles = () => {
  const { user, token } = useAuth();
  const [branchFilter, setBranchFilter] = useState("");
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [vehiclesData, models, branchesData] = await Promise.all([
        getVehicles({
          branch: branchFilter,
          economicNumber: economicNumberFilter,
          model: modelFilter,
          page: pagination.page,
          limit: pagination.limit,
        }),
        getVehicleModels(),
        getBranches(),
      ]);
      setVehicles(vehiclesData.vehicles);
      setPagination({
        ...pagination,
        total: vehiclesData.total,
        totalPages: vehiclesData.totalPages,
      });
      setVehicleModels(models);
      setBranches(branchesData);
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error("[AdminVehicles] Error al cargar datos:", error);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, branchFilter, economicNumberFilter, modelFilter, pagination.page]);

  const handleCreateVehicle = async (vehicleData) => {
    try {
      const newVehicle = await createVehicle(vehicleData);
      setVehicles([...vehicles, newVehicle]); // Actualización optimista
      setShowCreateModal(false);
      toast.success("Vehículo creado");
      // Reiniciar paginación y recargar datos
      setPagination((prev) => ({ ...prev, page: 1 }));
      await fetchData(); // Recargar datos del servidor
    } catch (error) {
      toast.error(error.message || "Error al crear vehículo");
      throw error;
    }
  };

  const handleEditVehicle = async (vehicleData) => {
    setIsSubmitting(true);
    try {
      const updatedVehicle = await updateVehicle(
        selectedVehicle.economic_number,
        vehicleData
      );
      setVehicles(
        vehicles.map((v) =>
          v.economic_number === updatedVehicle.economic_number
            ? updatedVehicle
            : v
        )
      );
      setShowEditModal(false);
      setSelectedVehicle(null);
      toast.success("Vehículo actualizado");
      await fetchData(); // Recargar datos para asegurar consistencia
    } catch (error) {
      toast.error(error.message || "Error al actualizar vehículo");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (economic_number) => {
    if (window.confirm("¿Estás seguro de eliminar este vehículo?")) {
      try {
        await deleteVehicle(economic_number);
        setVehicles(
          vehicles.filter((v) => v.economic_number !== economic_number)
        );
        toast.success("Vehículo eliminado");
        await fetchData(); // Recargar datos
      } catch (error) {
        toast.error(error.message || "Error al eliminar vehículo");
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
        <DashboardHeader title="Vehículos Registrados" {...userData} />
        <Container className="mt-4 d-flex flex-column align-items-center gap-3">
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Sucursal</FilterLabel>
              <FilterSelect
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número Económico</FilterLabel>
              <FilterInput
                type="text"
                value={economicNumberFilter}
                onChange={(e) => setEconomicNumberFilter(e.target.value)}
                placeholder="Filtrar por número económico"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Modelo</FilterLabel>
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
              Nuevo Vehículo
            </CustomButton>
          </FiltersContainer>
          <ListGroup.Item className="w-100">
            <StyledTable>
              <thead>
                <tr>
                  <th>Número Económico</th>
                  <th className="col-2">Sucursal</th>
                  <th>Marca</th>
                  <th className="col-4">Modelo</th>
                  <th>Año</th>
                  <th>Kilometraje</th>
                  <th className="col-3">VIN</th>
                  <th>Placa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.economic_number}>
                    <td>{vehicle.economic_number}</td>
                    <td>{vehicle.branch}</td>
                    <td>{vehicle.brand}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.year}</td>
                    <td>{vehicle.mileage} km</td>
                    <td>{vehicle.vin}</td>
                    <td>{vehicle.plate}</td>
                    <td className="actions">
                      <ActionsContainer>
                        <CustomButton
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowDetailsModal(true);
                          }}
                          title="Ver Detalles"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </CustomButton>
                        <CustomButton
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowEditModal(true);
                          }}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </CustomButton>
                        <CustomButton
                          onClick={() =>
                            handleDeleteVehicle(vehicle.economic_number)
                          }
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
          <Modal.Title>Crear Nuevo Vehículo</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <VehicleForm
            onSubmit={handleCreateVehicle}
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
            setSelectedVehicle(null);
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Vehículo</Modal.Title>
        </Modal.Header>
        <ModalBody>
          {selectedVehicle && (
            <VehicleForm
              initialData={selectedVehicle}
              onSubmit={handleEditVehicle}
              onCancel={() => {
                if (!isSubmitting) {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                }
              }}
              isEdit
            />
          )}
        </ModalBody>
      </StyledModal>

      <VehicleDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
      />
    </>
  );
};

export default AdminVehicles;
