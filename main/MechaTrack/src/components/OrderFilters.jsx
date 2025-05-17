import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
} from "../styles/GlobalStyles";
import { Form } from "react-bootstrap";

const OrderFilters = ({
  economicNumberFilter,
  setEconomicNumberFilter,
  statusFilter,
  setStatusFilter,
  orderNumberFilter,
  setOrderNumberFilter,
}) => {
  return (
    <FiltersContainer>
      <FilterGroup>
        <FilterLabel>Filtrar por Estado:</FilterLabel>
        <Form.Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Pendiente">Pendiente</option>
        </Form.Select>
      </FilterGroup>
      <FilterGroup>
        <FilterLabel>Filtrar por N° de Orden:</FilterLabel>
        <FilterInput
          type="text"
          value={orderNumberFilter}
          onChange={(e) => setOrderNumberFilter(e.target.value)}
          placeholder="Buscar por número de orden"
        />
      </FilterGroup>
      <FilterGroup>
        <FilterLabel>Filtrar por N° Económico:</FilterLabel>
        <FilterInput
          type="text"
          value={economicNumberFilter}
          onChange={(e) => setEconomicNumberFilter(e.target.value)}
          placeholder="Buscar por número económico"
        />
      </FilterGroup>
    </FiltersContainer>
  );
};

export default OrderFilters;
