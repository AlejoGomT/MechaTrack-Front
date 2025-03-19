import { Card } from 'react-bootstrap';
import { StatCard as StyledStatCard } from '../styles/GlobalStyles';
import CustomButton from './CustomButton';

const StatCard = ({ title, content, buttonText, onClick }) => {
  return (
    <StyledStatCard>
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text>{content}</Card.Text>
        <CustomButton onClick={onClick} className="btn-view">{buttonText}</CustomButton>
      </Card.Body>
    </StyledStatCard>
  );
};

export default StatCard;