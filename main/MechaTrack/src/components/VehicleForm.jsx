import { useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import {
  FormInput,
  StyledButton,
  CustomButton,
  FormSectionTitle,
} from "../styles/GlobalStyles";
import { toast } from "react-toastify";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }
    try {
      await onSubmit(formData);
      toast.success(isEdit ? "Vehículo actualizado" : "Vehículo creado");
    } catch (error) {
      toast.error(error.message || "Error al procesar el vehículo");
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
            <FormInput
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              isInvalid={!!errors.branch}
            />
            <Form.Control.Feedback type="invalid">
              {errors.branch}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Marca</Form.Label>
            <FormInput
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              isInvalid={!!errors.brand}
            />
            <Form.Control.Feedback type="invalid">
              {errors.brand}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Modelo</Form.Label>
            <FormInput
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              isInvalid={!!errors.model}
            />
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
      <div className="d-flex justify-content-center gap-3 mt-4">
        <StyledButton type="submit">Guardar</StyledButton>
        <CustomButton onClick={onCancel}>Cancelar</CustomButton>
      </div>
    </Form>
  );
};

export default VehicleForm;
