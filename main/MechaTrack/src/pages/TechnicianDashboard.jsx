import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import OrderCard from '../components/OrderCard';
import CustomButton from '../components/CustomButton';
import StatCard from '../components/StatCard';
import {
  MainContainer,
  Content,
  ContentBtn,
  MobileToggleButton,
  StyledModal,
  ModalBody,
  TableWrapper,
  StyledTable,
  StyledTableModal,
} from '../styles/GlobalStyles';
import { Container, Modal } from 'react-bootstrap';
import { mockUsers, mockClientOrders } from '../data/mock';

// Datos del menú base
const baseTechnicianMenu = [
  { label: 'Inicio', path: '/technician' },
  { label: 'Crear Orden de Servicio', path: '/technician/create-order' },
  { label: 'Historial de Órdenes', path: '/technician/history' },
  { label: 'Notificaciones', path: '/technician/notifications' },
  { label: 'Cerrar Sesión', path: '/' },
];

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const authenticatedUserId = 'U002';
  const authenticatedUser = mockUsers.find(user => user.id === authenticatedUserId);
  const technicianOrders = mockClientOrders.filter(order => order.technicianId === authenticatedUserId);

  const activeOrdersCount = technicianOrders.length;
  const pendingOrdersCount = technicianOrders.filter(order => order.status === 'En Proceso').length;
  const completedOrdersCount = technicianOrders.filter(order => order.status === 'Finalizado').length;
  const notificationsCount = technicianOrders.filter(order => order.notifications).length;

  const orders = technicianOrders.map(order => ({
    id: order.orderNumber,
    title: `Orden #${order.orderNumber}`,
    content: `Vehículo ${order.economicNumber} - ${order.status} (Ingreso: ${order.entryDate})`,
    buttonText: 'Ver Orden',
    onClick: () => alert(`Ver Orden #${order.orderNumber}`),
  }));

  const stats = [
    {
      title: 'Órdenes Pendientes',
      content: pendingOrdersCount.toString(),
      buttonText: 'Ver Detalles',
      onClick: () => {
        setModalType('pending');
        setShowModal(true);
      },
    },
    {
      title: 'Órdenes Finalizadas',
      content: completedOrdersCount.toString(),
      buttonText: 'Ver Detalles',
      onClick: () => {
        setModalType('completed');
        setShowModal(true);
      },
    },
  ];

  const userData = {
    userId: authenticatedUser.id,
    userName: authenticatedUser.name,
    activeOrdersCount,
    notificationsCount,
  };

  const technicianMenu = selectedOrderId
    ? baseTechnicianMenu.map(item =>
        item.path === '/technician/create-order'
          ? { ...item, label: 'Orden Actual' }
          : item
      )
    : baseTechnicianMenu;

  const handleLogout = () => {
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
  };

  const handleEditOrder = (orderId) => {
    setSelectedOrderId(orderId);
    navigate(`/technician/create-order?orderId=${orderId}`);
  };

  const modalOrders = technicianOrders.filter(order =>
    modalType === 'pending' ? order.status === 'En Proceso' : order.status === 'Finalizado'
  );

  return (
    <MainContainer fluid>
      <Sidebar menuItems={technicianMenu} title="Menú" className={isSidebarOpen ? 'open' : ''} />
      <Content>
        <MobileToggleButton onClick={toggleSidebar}>
          {isSidebarOpen ? 'Cerrar' : 'Menú'}
        </MobileToggleButton>
        <DashboardHeader
          title="Panel de Técnico"
          userId={userData.userId}
          userName={userData.userName}
          activeOrdersCount={userData.activeOrdersCount}
          notificationsCount={userData.notificationsCount}
        />
        <Container fluid>
          <ContentBtn>
            <h3>Estadísticas</h3>
          </ContentBtn>
          <div style={{ display: 'flex', gap: '4%', marginBottom: '20px' }}>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
          <ContentBtn>
            <h3>Órdenes de Servicio</h3>
            <CustomButton>Nueva Orden</CustomButton>
          </ContentBtn>
          {orders.map(order => (
            <OrderCard key={order.id} {...order} />
          ))}
        </Container>

        {/* Modal estilizado con Emotion */}
        <StyledModal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{modalType === 'pending' ? 'Órdenes Pendientes' : 'Órdenes Finalizadas'}</Modal.Title>
          </Modal.Header>
          <ModalBody>
            {modalOrders.length > 0 ? (
              <TableWrapper>
                <StyledTableModal striped bordered hover>
                  <thead>
                    <tr>
                      <th>Núm. Económico</th>
                      <th>Orden</th>
                      <th>Fecha Ingreso</th>
                      <th>Diagnóstico</th>
                      <th>Notificación</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalOrders.map(order => (
                      <tr key={order.orderNumber}>
                        <td>{order.economicNumber}</td>
                        <td>{order.orderNumber}</td>
                        <td>{order.entryDate}</td>
                        <td title={order.history[order.history.length - 1]?.description || 'Sin diagnóstico'}>
                          {order.history[order.history.length - 1]?.description || 'Sin diagnóstico'}
                        </td>
                        <td>{order.status === 'En Proceso' && order.notifications ? '🔔' : '-'}</td>
                        <td>
                          {order.status === 'En Proceso' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditOrder(order.orderNumber)}
                            >
                              Editar
                            </Button>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTableModal>
              </TableWrapper>
            ) : (
              <p>No hay órdenes {modalType === 'pending' ? 'pendientes' : 'finalizadas'}.</p>
            )}
          </ModalBody>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>
      </Content>
    </MainContainer>
  );
};

export default TechnicianDashboard;