import { useState, useEffect } from "react";
import { Container, Pagination } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getInvoices } from "../services/invoicesService";
import { toast } from "react-toastify";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  StyledTable,
  TableWrapper,
} from "../styles/GlobalStyles";

const secretaryMenu = [
  { label: "Inicio", path: "/secretary" },
  { label: "Facturación", path: "/secretary/billing" },
  { label: "Historial de Facturaciones", path: "/secretary/history" },
  { label: "Notificaciones", path: "/secretary/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const SecretaryHistory = () => {
  const { user, token } = useAuth();
  const { setUpdateInvoiceCallback, isConnected } = useSocket();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    orderNumber: "",
    invoiceNumber: "",
    deliveryNoteNumber: "",
    issuedBy: "",
    issuedAt: "",
    total: "",
  });

  const fetchInvoices = async () => {
    try {
      const data = await getInvoices({
        ...filters,
        page: pagination.currentPage,
        limit: 10,
      });
      setInvoices(data.invoices || []);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        total: data.total,
      });
    } catch (error) {
      console.error("[SecretaryHistory] Error al cargar facturas:", error);
      toast.error("Error al cargar facturas");
      setInvoices([]);
    }
  };

  useEffect(() => {
    if (token) fetchInvoices();

    // Registrar callback para eventos de facturas
    setUpdateInvoiceCallback((eventType, payload) => {
      console.log(`[SecretaryHistory] ${eventType} recibido:`, payload);
      if (eventType === "created") {
        if (pagination.currentPage === 1) {
          fetchInvoices();
        } else {
          toast.info("Nueva factura creada");
        }
      } else if (eventType === "updated") {
        fetchInvoices();
      } else if (eventType === "deleted") {
        setInvoices((prev) =>
          prev.filter((invoice) => invoice.id !== payload.id)
        );
        toast.info(`Factura #${payload.id} eliminada`);
      }
    });

    return () => {
      setUpdateInvoiceCallback(null); // Limpiar callback al desmontar
    };
  }, [token, filters, pagination.currentPage, setUpdateInvoiceCallback]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleDownload = (invoiceId) => {
    toast.info(`Descarga para factura ${invoiceId} no implementada aún`);
  };

  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader
          title="Historial de Facturaciones"
          subtitle="Órdenes completadas con factura y pedido de albarán"
        />
        <Container className="mt-4">
          {!isConnected && (
            <div className="alert alert-warning">
              Conexión en tiempo real perdida. Algunas actualizaciones podrían
              no reflejarse.
            </div>
          )}
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Número de Orden</FilterLabel>
              <FilterInput
                type="text"
                name="orderNumber"
                value={filters.orderNumber}
                onChange={handleFilterChange}
                placeholder="Ej: OS-1023"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número de Factura</FilterLabel>
              <FilterInput
                type="text"
                name="invoiceNumber"
                value={filters.invoiceNumber}
                onChange={handleFilterChange}
                placeholder="Ej: FAC-78945"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número de Albarán</FilterLabel>
              <FilterInput
                type="text"
                name="deliveryNoteNumber"
                value={filters.deliveryNoteNumber}
                onChange={handleFilterChange}
                placeholder="Ej: PA-45678"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Emisor</FilterLabel>
              <FilterInput
                type="text"
                name="issuedBy"
                value={filters.issuedBy}
                onChange={handleFilterChange}
                placeholder="Ej: Juan Pérez"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Fecha de Facturación</FilterLabel>
              <FilterInput
                type="date"
                name="issuedAt"
                value={filters.issuedAt}
                onChange={handleFilterChange}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Total</FilterLabel>
              <FilterInput
                type="number"
                name="total"
                value={filters.total}
                onChange={handleFilterChange}
                placeholder="Ej: 1500.00"
                step="0.01"
              />
            </FilterGroup>
          </FiltersContainer>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Número de Orden</th>
                  <th>Número de Factura</th>
                  <th>Número de Albarán</th>
                  <th>Emisor</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.order_id}</td>
                      <td>{invoice.invoice_number || "-"}</td>
                      <td>{invoice.delivery_note_number || "-"}</td>
                      <td>{invoice.issued_by_name}</td>
                      <td>
                        {new Date(invoice.issued_at).toLocaleDateString(
                          "es-MX"
                        )}
                      </td>
                      <td>${invoice.total.toFixed(2)}</td>
                      <td>
                        <CustomButton
                          onClick={() => handleDownload(invoice.id)}
                        >
                          Descargar
                        </CustomButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No hay facturas que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
          {pagination.totalPages > 1 && (
            <Pagination className="justify-content-center mt-3">
              <Pagination.Prev
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              />
              {[...Array(pagination.totalPages).keys()].map((page) => (
                <Pagination.Item
                  key={page + 1}
                  active={page + 1 === pagination.currentPage}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              />
            </Pagination>
          )}
        </Container>
      </div>
    </>
  );
};

export default SecretaryHistory;
