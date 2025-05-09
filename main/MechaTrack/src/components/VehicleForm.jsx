import { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import {
  FormInput,
  StyledButton,
  CustomButton,
  FormSectionTitle,
  FilterSelect,
  ConditionalInputContainer,
  FormActions,
} from "../styles/GlobalStyles";
import { toast } from "react-toastify";
import {
  getBranches,
  getVehicleBrands,
  getVehicleModels,
} from "../services/orderService";

// Lista estática de ciudades de México
const cities = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Tijuana",
  "León",
  "Mérida",
  "Querétaro",
  "Cancún",
  "Veracruz",
  "Toluca",
  "Chihuahua",
  "Hermosillo",
  "Culiacán",
  "Aguascalientes",
  "Morelia",
  "Saltillo",
  "Torreón",
  "San Luis Potosí",
  "Acapulco",
];

// Implementación de distancia de Levenshtein para búsqueda difusa
const levenshteinDistance = (a, b) => {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[b.length][a.length];
};

const VehicleForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    economic_number: initialData.economic_number || "",
    branch: initialData.branch || "",
    brand: initialData.brand || "",
    model: initialData.model || "",
    year: initialData.year || "",
    mileage: initialData.mileage || "",
    vin: initialData.vin || "",
    plate: initialData.plate || "",
  });
  const [errors, setErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [isNewBranch, setIsNewBranch] = useState(false);
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [isNewModel, setIsNewModel] = useState(false);
  const [newBranchCity, setNewBranchCity] = useState("");
  const [newBrandInput, setNewBrandInput] = useState("");
  const [newModelInput, setNewModelInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, brandsData, modelsData] = await Promise.all([
          getBranches(),
          getVehicleBrands(),
          getVehicleModels(),
        ]);
        setBranches(branchesData);
        setBrands(brandsData);
        setModels(modelsData);

        // Verificar si los valores iniciales son "nuevos"
        if (initialData.branch && !branchesData.includes(initialData.branch)) {
          setIsNewBranch(true);
          setNewBranchCity(initialData.branch);
        }
        if (initialData.brand && !brandsData.includes(initialData.brand)) {
          setIsNewBrand(true);
          setNewBrandInput(initialData.brand);
        }
        if (initialData.model && !modelsData.includes(initialData.model)) {
          setIsNewModel(true);
          setNewModelInput(initialData.model);
        }
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error("[VehicleForm] Error al cargar datos:", error);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.economic_number || formData.economic_number.length > 10)
      newErrors.economic_number =
        "Número económico es requerido (máx. 10 caracteres)";
    if (!formData.branch) newErrors.branch = "Sucursal es requerida";
    if (!formData.brand) newErrors.brand = "Marca es requerida";
    if (!formData.model) newErrors.model = "Modelo es requerido";
    if (
      !formData.year ||
      isNaN(formData.year) ||
      formData.year < 1900 ||
      formData.year > 2025
    )
      newErrors.year = "Año debe ser un número entre 1900 y 2025";
    if (!formData.mileage || isNaN(formData.mileage) || formData.mileage < 0)
      newErrors.mileage = "Kilometraje debe ser un número ≥ 0";
    if (!formData.vin || formData.vin.length > 50)
      newErrors.vin = "VIN es requerido (máx. 50 caracteres)";
    if (!formData.plate || formData.plate.length > 20)
      newErrors.plate = "Placa es requerida (máx. 20 caracteres)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkSimilarity = (input, items, field) => {
    const threshold = 3; // Umbral para considerar similitud
    const similarItems = items.filter(
      (item) =>
        levenshteinDistance(input.toLowerCase(), item.toLowerCase()) <=
        threshold
    );
    if (similarItems.length > 0) {
      return `¿Estás seguro? Ya existe un ${field} similar: ${similarItems.join(
        ", "
      )}`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ajustar formData según inputs condicionales
    const finalFormData = {
      ...formData,
      branch: isNewBranch ? newBranchCity : formData.branch,
      brand: isNewBrand ? newBrandInput : formData.brand,
      model: isNewModel ? newModelInput : formData.model,
    };

    // Verificar similitudes para marca y modelo
    if (isNewBrand && newBrandInput) {
      const brandWarning = checkSimilarity(newBrandInput, brands, "marca");
      if (brandWarning) {
        toast.warn(brandWarning, {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: true,
          onClose: () => setIsSubmitting(false),
          render: ({ closeToast }) => (
            <div>
              {brandWarning}
              <div style={{ marginTop: "1rem" }}>
                <StyledButton
                  onClick={() => {
                    handleFinalSubmit(finalFormData);
                    closeToast();
                  }}
                  style={{ marginRight: "1rem" }}
                >
                  Confirmar
                </StyledButton>
                <CustomButton onClick={closeToast}>Corregir</CustomButton>
              </div>
            </div>
          ),
        });
        return;
      }
    }

    if (isNewModel && newModelInput) {
      const modelWarning = checkSimilarity(newModelInput, models, "modelo");
      if (modelWarning) {
        toast.warn(modelWarning, {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: true,
          onClose: () => setIsSubmitting(false),
          render: ({ closeToast }) => (
            <div>
              {modelWarning}
              <div style={{ marginTop: "1rem" }}>
                <StyledButton
                  onClick={() => {
                    handleFinalSubmit(finalFormData);
                    closeToast();
                  }}
                  style={{ marginRight: "1rem" }}
                >
                  Confirmar
                </StyledButton>
                <CustomButton onClick={closeToast}>Corregir</CustomButton>
              </div>
            </div>
          ),
        });
        return;
      }
    }

    await handleFinalSubmit(finalFormData);
  };

  const handleFinalSubmit = async (finalFormData) => {
    try {
      if (!validateForm()) {
        toast.error("Por favor, corrige los errores en el formulario");
        setIsSubmitting(false);
        return;
      }
      await onSubmit(finalFormData);
      toast.success(isEdit ? "Vehículo actualizado" : "Vehículo creado");
    } catch (error) {
      toast.error(error.message || "Error al procesar el vehículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (name === "branch") {
      setIsNewBranch(value === "new");
    }
    if (name === "brand") {
      setIsNewBrand(value === "new");
    }
    if (name === "model") {
      setIsNewModel(value === "new");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormSectionTitle>
        {isEdit ? "Editar Vehículo" : "Nuevo Vehículo"}
      </FormSectionTitle>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Número Económico</Form.Label>
            <FormInput
              type="text"
              name="economic_number"
              value={formData.economic_number}
              onChange={handleChange}
              disabled={isEdit}
              isInvalid={!!errors.economic_number}
            />
            <Form.Control.Feedback type="invalid">
              {errors.economic_number}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Sucursal</Form.Label>
            <FilterSelect
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              isInvalid={!!errors.branch}
            >
              <option value="">Seleccionar sucursal</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
              <option value="new">Nueva sucursal</option>
            </FilterSelect>
            {isNewBranch && (
              <ConditionalInputContainer>
                <FilterSelect
                  value={newBranchCity}
                  onChange={(e) => setNewBranchCity(e.target.value)}
                >
                  <option value="">Seleccionar ciudad</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </FilterSelect>
              </ConditionalInputContainer>
            )}
            <Form.Control.Feedback type="invalid">
              {errors.branch}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Marca</Form.Label>
            <FilterSelect
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              isInvalid={!!errors.brand}
            >
              <option value="">Seleccionar marca</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
              <option value="new">Nueva marca</option>
            </FilterSelect>
            {isNewBrand && (
              <ConditionalInputContainer>
                <FormInput
                  type="text"
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  placeholder="Ingresar nueva marca"
                />
              </ConditionalInputContainer>
            )}
            <Form.Control.Feedback type="invalid">
              {errors.brand}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Modelo</Form.Label>
            <FilterSelect
              name="model"
              value={formData.model}
              onChange={handleChange}
              isInvalid={!!errors.model}
            >
              <option value="">Seleccionar modelo</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
              <option value="new">Nuevo modelo</option>
            </FilterSelect>
            {isNewModel && (
              <ConditionalInputContainer>
                <FormInput
                  type="text"
                  value={newModelInput}
                  onChange={(e) => setNewModelInput(e.target.value)}
                  placeholder="Ingresar nuevo modelo"
                />
              </ConditionalInputContainer>
            )}
            <Form.Control.Feedback type="invalid">
              {errors.model}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Año</Form.Label>
            <FormInput
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              isInvalid={!!errors.year}
            />
            <Form.Control.Feedback type="invalid">
              {errors.year}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Kilometraje</Form.Label>
            <FormInput
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              isInvalid={!!errors.mileage}
            />
            <Form.Control.Feedback type="invalid">
              {errors.mileage}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>VIN</Form.Label>
            <FormInput
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              disabled={isEdit}
              isInvalid={!!errors.vin}
            />
            <Form.Control.Feedback type="invalid">
              {errors.vin}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Placa</Form.Label>
            <FormInput
              type="text"
              name="plate"
              value={formData.plate}
              onChange={handleChange}
              disabled={isEdit}
              isInvalid={!!errors.plate}
            />
            <Form.Control.Feedback type="invalid">
              {errors.plate}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <FormActions>
        <StyledButton type="submit" disabled={isSubmitting}>
          Guardar
        </StyledButton>
        <CustomButton onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </CustomButton>
      </FormActions>
    </Form>
  );
};

export default VehicleForm;
