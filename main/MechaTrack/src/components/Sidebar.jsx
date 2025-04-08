import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importar useAuth para acceder a logout
import { Sidebar as StyledSidebar, SidebarTitle, SidebarNav } from '../styles/GlobalStyles';

const Sidebar = ({ menuItems, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth(); // Obtener el método logout del contexto

  const handleNavigation = (path) => {
    if (path === '/') {
      // Si el path es "/", cerrar sesión y redirigir a la página de login
      logout();
      navigate('/', { replace: true }); // Usar replace para evitar acumulación en el historial
    } else {
      navigate(path);
    }
  };

  return (
    <StyledSidebar>
      <SidebarTitle>{title}</SidebarTitle>
      <SidebarNav className="flex-column">
        {menuItems.map((item, index) => (
          <Nav.Link
            as={Link}
            to={item.path}
            key={index}
            onClick={(e) => {
              e.preventDefault(); // Prevenir la navegación por defecto de Link
              handleNavigation(item.path); // Manejar la navegación manualmente
            }}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Nav.Link>
        ))}
      </SidebarNav>
    </StyledSidebar>
  );
};

export default Sidebar;