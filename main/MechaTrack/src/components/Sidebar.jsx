import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar as StyledSidebar, SidebarTitle, SidebarNav } from '../styles/GlobalStyles'; // Renombramos Sidebar a StyledSidebar

const Sidebar = ({ menuItems, title }) => {
  const location = useLocation();

  return (
    <StyledSidebar> {/* Usamos el componente estilizado renombrado */}
      <SidebarTitle>{title}</SidebarTitle>
      <SidebarNav className="flex-column">
        {menuItems.map((item, index) => (
          <Nav.Link
            as={Link}
            to={item.path}
            key={index}
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