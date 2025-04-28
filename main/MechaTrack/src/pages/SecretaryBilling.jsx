import { useState, useEffect } from "react";
import { Container, Table, Form, Button } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { useAuth } from "../context/AuthContext";
import {
  getOrders,
  updateOrderNumbers,
  updateOrderStatus,
} from "../services/orderService";
import { toast } from "react-toastify";

const secretaryMenu = [
  { label: "Inicio", path: "/secretary" },
  { label: "Facturación", path: "/secretary/billing" },
  { label: "Historial de Facturaciones", path: "/secretary/history" },
  { label: "Cerrar Sesión", path: "/" },
];

const SecretaryBilling = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceNumbers, setInvoiceNumbers] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await getOrders({
          status: "Pendiente de Facturación",
        });
        setOrders(ordersData);
        // Inicializar invoiceNumbers con valores actuales
        const initialInvoiceNumbers = {};
        ordersData.forEach((order) => {
          initialInvoiceNumbers[order.id] = order.invoice?.invoice_number || "";
        });
        setInvoiceNumbers(initialInvoiceNumbers);
      } catch (error) {
        toast.error("Error al cargar órdenes");
        console.error("[SecretaryBilling] Error al cargar órdenes:", error);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInvoiceNumberChange = (orderId, value) => {
    setInvoiceNumbers((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const handleSaveInvoiceNumber = async (orderId) => {
    try {
      const invoiceNumber = invoiceNumbers[orderId];
      if (!invoiceNumber) {
        toast.error("Por favor ingrese un número de factura");
        return;
      }
      // Guardar invoice_number
      await updateOrderNumbers(orderId, { invoiceNumber });
      // Cambiar estado a Facturado
      await updateOrderStatus(orderId, "Facturado");
      toast.success(`Factura registrada para orden #${orderId}`);
      // Actualizar lista de órdenes
      const updatedOrders = await getOrders({
        status: "Pendiente de Facturación",
      });
      setOrders(updatedOrders);
      // Actualizar invoiceNumbers
      const updatedInvoiceNumbers = {};
      updatedOrders.forEach((order) => {
        updatedInvoiceNumbers[order.id] = order.invoice?.invoice_number || "";
      });
      setInvoiceNumbers(updatedInvoiceNumbers);
    } catch (error) {
      toast.error(error.message || "Error al registrar factura");
      console.error("[SecretaryBilling] Error al registrar factura:", error);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader
          title="Facturación"
          subtitle="Listado de órdenes listas para facturación"
        />
        <Container className="mt-4">
          <div className="d-flex justify-content-between mb-3">
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Buscar Orden:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Número de Orden o Sucursal"
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "200px" }}
              />
            </Form.Group>
          </div>
          <Table striped bordered hover className="factura-table">
            <thead>
              <tr>
                <th>Número de Orden</th>
                <th>Número Económico</th>
                <th>Sucursal</th>
                <th>Número de Factura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.vehicle_economic_number}</td>
                    <td>{order.branch || "-"}</td>
                    <td>
                      <Form.Control
                        type="text"
                        value={invoiceNumbers[order.id] || ""}
                        onChange={(e) =>
                          handleInvoiceNumberChange(order.id, e.target.value)
                        }
                        placeholder="Ej: FAC-12345"
                      />
                    </td>
                    <td>
                      <CustomButton
                        onClick={() => handleSaveInvoiceNumber(order.id)}
                        disabled={!invoiceNumbers[order.id]}
                      >
                        Registrar Factura
                      </CustomButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No hay órdenes pendientes de facturación
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Container>
      </div>
    </>
  );
};

export default SecretaryBilling;
