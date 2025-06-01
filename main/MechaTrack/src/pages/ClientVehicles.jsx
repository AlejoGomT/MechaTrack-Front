import { useState, useEffect } from "react";
import { Container, Form, Pagination, Modal } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import VehicleDetailsModal from "../components/VehicleDetailsModal";
import CustomButton from "../components/CustomButton";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  FilterInput,
  StyledTable,
  ActionsContainer,
  TableWrapper,
} from "../styles/GlobalStyles";
import {
  getVehicles,
  getVehicleModels,
  getBranches,
} from "../services/vehicleService";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faEye);

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas de Economico", path: "/client/query" },
  { label: "Consultas de Vehículo", path: "/client/vehicles" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientVehicles = () => {
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
      console.error("[ClientVehicles] Error al cargar datos:", error);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, branchFilter, economicNumberFilter, modelFilter, pagination.page]);

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
      <Sidebar menuItems={clientMenu} title="Consulta de Cliente" />
      <div className="content" style={{ marginLeft: "250px", padding: "20px" }}>
        <DashboardHeader
          title="Vehículos Registrados"
          subtitle="Consulta los vehículos registrados"
          {...userData}
        />
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
          </FiltersContainer>
          <TableWrapper>
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
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
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
                        </ActionsContainer>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No hay vehículos disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
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

export default ClientVehicles;
