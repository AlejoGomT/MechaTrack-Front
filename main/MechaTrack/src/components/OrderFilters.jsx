import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
} from "../styles/GlobalStyles";
import { Form } from "react-bootstrap";

const OrderFilters = ({ economicNumberFilter, setEconomicNumberFilter }) => {
  return (
    <FiltersContainer>
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
