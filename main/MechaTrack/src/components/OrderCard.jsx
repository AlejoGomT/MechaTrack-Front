import { Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faCircle } from "@fortawesome/free-solid-svg-icons";
import {
  OrderCard as StyledOrderCard,
  OrderCardHeader,
  OrderCardContent,
  OrderCardActions,
  StatusIcon,
} from "../styles/GlobalStyles";
import CustomButton from "./CustomButton";

const OrderCard = ({
  id,
  title,
  content,
  status,
  onViewClick,
  onEditClick,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "En Proceso":
        return "#dc3545"; // Rojo
      case "Finalizado":
        return "#28a745"; // Verde
      default:
        return "#6c757d"; // Gris
    }
  };

  return (
    <StyledOrderCard>
      <Card.Body>
        <OrderCardHeader>
          <Card.Title>{title}</Card.Title>
          <StatusIcon color={getStatusColor(status)}>
            <FontAwesomeIcon icon={faCircle} />
          </StatusIcon>
        </OrderCardHeader>
        <OrderCardContent>{content}</OrderCardContent>
        <OrderCardActions>
          <CustomButton onClick={() => onViewClick(id)}>
            <FontAwesomeIcon icon={faEye} style={{ marginRight: "5px" }} />
            Ver Detalles
          </CustomButton>
          {status === "En Proceso" && (
            <CustomButton onClick={() => onEditClick(id)} variant="secondary">
              <FontAwesomeIcon icon={faEdit} style={{ marginRight: "5px" }} />
              Finalizar Orden
            </CustomButton>
          )}
        </OrderCardActions>
      </Card.Body>
    </StyledOrderCard>
  );
};

export default OrderCard;
