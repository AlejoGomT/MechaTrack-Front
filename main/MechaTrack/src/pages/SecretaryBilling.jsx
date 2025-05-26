import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { useAuth } from "../context/AuthContext";
import {
  getOrders,
  updateOrderNumbers,
  updateOrderStatus,
} from "../services/orderService";
import { editInvoice, deleteInvoice } from "../services/invoicesService";
import { toast } from "react-toastify";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
  StyledTable,
  TableWrapper,
  InvoiceDisplay,
  DeleteIcon,
  InvoiceNumber,
} from "../styles/GlobalStyles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";

const ActionButton = styled(CustomButton)`
  padding: 6px 12px;
  font-size: 0.9rem;
`;

const secretaryMenu = [
  { label: "Inicio", path: "/secretary" },
  { label: "Facturación", path: "/secretary/billing" },
  { label: "Historial de Facturaciones", path: "/secretary/history" },
  { label: "Notificaciones", path: "/secretary/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const SecretaryBilling = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    orderNumber: "",
    status: "Pendiente de Facturación",
    economicNumber: "",
    branch: "",
  });
  const [invoiceNumbers, setInvoiceNumbers] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await getOrders({
          status: filters.status || undefined,
          orderNumber: filters.orderNumber || undefined,
          economicNumber: filters.economicNumber || undefined,
          branch: filters.branch || undefined,
        });
        console.log("[SecretaryBilling] Respuesta de getOrders:", ordersData);
        setOrders(ordersData.orders || []);

        const uniqueBranches = [
          ...new Set(
            (ordersData.orders || [])
              .map((order) => order.branch)
              .filter((branch) => branch)
          ),
        ];
        setBranches(uniqueBranches);

        const initialInvoiceNumbers = {};
        (ordersData.orders || []).forEach((order) => {
          initialInvoiceNumbers[order.id] = order.invoice?.invoice_number || "";
        });
        setInvoiceNumbers(initialInvoiceNumbers);
      } catch (error) {
        console.error("[SecretaryBilling] Error al cargar órdenes:", error);
        toast.error("Error al cargar órdenes");
        setOrders([]);
        setBranches([]);
      }
    };
    if (token) fetchOrders();
  }, [token, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInvoiceNumberChange = (orderId, value) => {
    setInvoiceNumbers((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const handleSaveInvoiceNumber = async (orderId) => {
    setLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const invoiceNumber = invoiceNumbers[orderId];
      if (!invoiceNumber) {
        toast.error("Por favor ingrese un número de factura");
        return;
      }
      await updateOrderNumbers(orderId, { invoice_number: invoiceNumber });
      await updateOrderStatus(orderId, "Facturado");
      toast.success(`Factura registrada para orden #${orderId}`);
      refreshOrders();
    } catch (error) {
      console.error("[SecretaryBilling] Error al registrar factura:", error);
      toast.error(error.message || "Error al registrar factura");
    } finally {
      setLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleEditInvoice = async (orderId) => {
    setLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const invoiceNumber = invoiceNumbers[orderId];
      if (!invoiceNumber) {
        toast.error("Por favor ingrese un número de factura");
        return;
      }
      await editInvoice(orderId, {
        invoice_number: invoiceNumber,
        issued_by: user.id,
      });
      toast.success(`Factura actualizada para orden #${orderId}`);
      refreshOrders();
    } catch (error) {
      console.error("[SecretaryBilling] Error al editar factura:", error);
      toast.error(error.message || "Error al editar factura");
    } finally {
      setLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteInvoice = async (orderId) => {
    setLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await deleteInvoice(orderId);
      await updateOrderStatus(orderId, "Pendiente de Facturación");
      toast.success(`Factura eliminada para orden #${orderId}`);
      refreshOrders();
    } catch (error) {
      console.error("[SecretaryBilling] Error al eliminar factura:", error);
      toast.error(error.message || "Error al eliminar factura");
    } finally {
      setLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const refreshOrders = async () => {
    try {
      const ordersData = await getOrders({
        status: filters.status || undefined,
        orderNumber: filters.orderNumber || undefined,
        economicNumber: filters.economicNumber || undefined,
        branch: filters.branch || undefined,
      });
      setOrders(ordersData.orders || []);
      const uniqueBranches = [
        ...new Set(
          (ordersData.orders || [])
            .map((order) => order.branch)
            .filter((branch) => branch)
        ),
      ];
      setBranches(uniqueBranches);
      const updatedInvoiceNumbers = {};
      (ordersData.orders || []).forEach((order) => {
        updatedInvoiceNumbers[order.id] = order.invoice?.invoice_number || "";
      });
      setInvoiceNumbers(updatedInvoiceNumbers);
    } catch (error) {
      console.error("[SecretaryBilling] Error al recargar órdenes:", error);
      toast.error("Error al recargar órdenes");
    }
  };

  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader
          title="Facturación"
          subtitle="Listado de órdenes listas para facturación"
        />
        <Container className="mt-4">
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Número de Orden</FilterLabel>
              <FilterInput
                type="text"
                name="orderNumber"
                value={filters.orderNumber}
                onChange={handleFilterChange}
                placeholder="Ej: 123"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Estado</FilterLabel>
              <FilterSelect
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="Pendiente de Facturación">
                  Pendiente de Facturación
                </option>
                <option value="Facturado">Facturado</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número Económico</FilterLabel>
              <FilterInput
                type="text"
                name="economicNumber"
                value={filters.economicNumber}
                onChange={handleFilterChange}
                placeholder="Ej: ABC123"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Sucursal</FilterLabel>
              <FilterSelect
                name="branch"
                value={filters.branch}
                onChange={handleFilterChange}
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
          </FiltersContainer>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Número de Orden</th>
                  <th>Número Económico</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th>Número de Factura</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.vehicle_economic_number}</td>
                      <td>{order.branch || "-"}</td>
                      <td>{order.status}</td>
                      <td>
                        {order.status === "Facturado" ? (
                          <InvoiceDisplay>
                            <DeleteIcon
                              onClick={() => handleDeleteInvoice(order.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </DeleteIcon>
                            <InvoiceNumber>
                              {invoiceNumbers[order.id]}
                            </InvoiceNumber>
                          </InvoiceDisplay>
                        ) : (
                          <FilterInput
                            type="text"
                            value={invoiceNumbers[order.id] || ""}
                            onChange={(e) =>
                              handleInvoiceNumberChange(
                                order.id,
                                e.target.value
                              )
                            }
                            placeholder="Ej: FAC-12345"
                            disabled={loading[order.id]}
                          />
                        )}
                      </td>
                      <td>
                        {order.status === "Facturado" ? (
                          <ActionButton
                            onClick={() => handleEditInvoice(order.id)}
                            disabled={
                              !invoiceNumbers[order.id] || loading[order.id]
                            }
                            loading={loading[order.id]}
                            variant="warning"
                          >
                            <FontAwesomeIcon icon={faPen} /> Editar
                          </ActionButton>
                        ) : (
                          <CustomButton
                            onClick={() => handleSaveInvoiceNumber(order.id)}
                            disabled={
                              !invoiceNumbers[order.id] || loading[order.id]
                            }
                            loading={loading[order.id]}
                          >
                            {loading[order.id]
                              ? "Registrando..."
                              : "Registrar Factura"}
                          </CustomButton>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No hay órdenes que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </Container>
      </div>
    </>
  );
};

export default SecretaryBilling;
