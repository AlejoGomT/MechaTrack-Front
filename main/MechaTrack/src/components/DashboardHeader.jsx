import { useNavigate } from 'react-router-dom';
import { DashboardHeader as StyledHeader } from '../styles/GlobalStyles';

const DashboardHeader = ({ title, userId = '123', userName = 'Tec. Carlos', activeOrdersCount = 5, notificationsCount = 3 }) => {
  const navigate = useNavigate();

  const handleOrdersClick = (event) => {
    event.preventDefault();
    navigate('/technician/history');
  };

  const handleNotificationsClick = (event) => {
    event.preventDefault();
    navigate('/technician/notifications');
  };

  return (
    <StyledHeader>
      <h2>{title}</h2>
      <div className="user-info">
        Id: {userId} <span style={{marginRight: '50px'}}></span> 
        {userName}
      </div>
      <div className="links">
        <a href="/history" onClick={handleOrdersClick}>
          Órdenes ({activeOrdersCount})
        </a>
        <a href="#" onClick={handleNotificationsClick} className="bell">
          Notificaciones ({notificationsCount})
        </a>
      </div>
    </StyledHeader>
  );
};

export default DashboardHeader;