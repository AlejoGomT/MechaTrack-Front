import { useState, useEffect } from "react";
import { Container, Modal, Pagination, ListGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import UserForm from "../components/UserForm";
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
  TableWrapper,
} from "../styles/GlobalStyles";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

library.add(faPencil, faTrashCan);

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

const AdminUsers = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const params = {
        name: nameFilter,
        role: roleFilter,
        page: pagination.page,
        limit: pagination.limit,
        excludeAdmin: false,
      };
      console.log("Parámetros enviados desde AdminUsers.jsx:", params);
      const usersData = await getUsers(params);
      setUsers(usersData.users);
      setPagination({
        ...pagination,
        total: usersData.total,
        totalPages: usersData.totalPages,
      });
    } catch (error) {
      toast.error("Error al cargar usuarios");
      console.error("[AdminUsers] Error al cargar datos:", error);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, nameFilter, roleFilter, pagination.page]);

  const handleCreateUser = async (userData) => {
    try {
      const newUser = await createUser(userData);
      setUsers([...users, newUser]);
      setShowCreateModal(false);
      toast.success("Usuario creado");
      setPagination((prev) => ({ ...prev, page: 1 }));
      await fetchData();
    } catch (error) {
      toast.error(error.message || "Error al crear usuario");
      throw error;
    }
  };

  const handleEditUser = async (userData) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await updateUser(selectedUser.id, userData);
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success("Usuario actualizado");
      await fetchData();
    } catch (error) {
      toast.error(error.message || "Error al actualizar usuario");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await deleteUser(userId);
        setUsers(users.filter((u) => u.id !== userId));
        toast.success("Usuario eliminado");
        await fetchData();
      } catch (error) {
        toast.error(error.message || "Error al eliminar usuario");
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
        <DashboardHeader title="Gestión de Usuarios" {...userData} />
        <Container className="mt-4 d-flex flex-column align-items-center gap-3">
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Nombre</FilterLabel>
              <FilterInput
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filtrar por nombre"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Rol</FilterLabel>
              <FilterSelect
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="admin">Admin</option>
                <option value="technician">Técnico</option>
                <option value="secretary">Secretario</option>
                <option value="client">Cliente</option>
              </FilterSelect>
            </FilterGroup>
            <CustomButton onClick={() => setShowCreateModal(true)}>
              Nuevo Usuario
            </CustomButton>
          </FiltersContainer>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.first_name}</td>
                    <td>{user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td className="actions">
                      <ActionsContainer>
                        <CustomButton
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </CustomButton>
                        {user.role !== "admin" && (
                          <CustomButton
                            onClick={() => handleDeleteUser(user.id)}
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </CustomButton>
                        )}
                      </ActionsContainer>
                    </td>
                  </tr>
                ))}
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

      <StyledModal
        variant="createParts"
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <UserForm
            onSubmit={handleCreateUser}
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
            setSelectedUser(null);
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <ModalBody>
          {selectedUser && (
            <UserForm
              initialData={selectedUser}
              onSubmit={handleEditUser}
              onCancel={() => {
                if (!isSubmitting) {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }
              }}
              isEdit
            />
          )}
        </ModalBody>
      </StyledModal>
    </>
  );
};

export default AdminUsers;
