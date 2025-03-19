import { OrderCard as StyledOrderCard } from '../styles/GlobalStyles';
import CustomButton from './CustomButton';
import { Card } from 'react-bootstrap';

const OrderCard = ({ title, content, buttonText, onClick }) => {
  return (
    <StyledOrderCard>
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text>{content}</Card.Text>
        <CustomButton onClick={onClick}>{buttonText}</CustomButton>
      </Card.Body>
    </StyledOrderCard>
  );
};

export default OrderCard;