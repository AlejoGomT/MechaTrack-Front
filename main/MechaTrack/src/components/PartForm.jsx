import { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { getVehicleModels } from "../services/vehicleService";
import { API_URL } from "../services/apiConfig";
import {
  CustomButton,
  FormSection,
  ModelTag,
  AllModelsTag,
  ModelTagContainer,
  ImageContainer,
  FilterLabel,
} from "../styles/GlobalStyles";

const PartForm = ({ initialData = {}, onSubmit, onCancel }) => {
  console.log("[PartForm] initialData:", initialData);

  const [formData, setFormData] = useState({
    id: initialData.id || "",
    name: initialData.name || "",
    description: initialData.description || "",
    quantity: initialData.quantity || 0,
    price: initialData.price || 0,
    image: null,
    compatible_models: initialData.compatible_models || [],
    all_models: initialData.compatible_models === null,
  });
  const [vehicleModels, setVehicleModels] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await getVehicleModels();
        setVehicleModels(models);
      } catch (error) {
        toast.error("Error al cargar modelos de vehículos");
      }
    };
    fetchModels();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.id || formData.id.length < 3) {
      newErrors.id =
        "El código es requerido y debe tener al menos 3 caracteres";
    }
    if (!formData.name || formData.name.length < 3) {
      newErrors.name =
        "El nombre es requerido y debe tener al menos 3 caracteres";
    }
    if (formData.price < 0) {
      newErrors.price = "El precio no puede ser negativo";
    }
    if (formData.quantity < 0) {
      newErrors.quantity = "La cantidad no puede ser negativa";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    try {
      const isEditMode = !!initialData.id;
      const dataToSubmit = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        image: formData.image,
        compatible_models: formData.all_models
          ? null
          : formData.compatible_models,
      };
      await onSubmit(dataToSubmit);
      toast.success(`Repuesto ${isEditMode ? "actualizado" : "creado"}`);
    } catch (error) {
      console.error("[PartForm] Error en handleSubmit:", error);
      toast.error(
        error.message ||
          `Error al ${initialData.id ? "actualizar" : "crear"} repuesto`
      );
    }
  };

  const handleModelChange = (model) => {
    setFormData((prev) => {
      const newModels = prev.compatible_models.includes(model)
        ? prev.compatible_models.filter((m) => m !== model)
        : [...prev.compatible_models, model];
      return {
        ...prev,
        compatible_models: newModels,
        all_models: false,
      };
    });
  };

  const handleAllModelsToggle = () => {
    setFormData((prev) => ({
      ...prev,
      all_models: !prev.all_models,
      compatible_models: prev.all_models ? prev.compatible_models : [],
    }));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormSection>
        <Row>
          <Col md={6}>
            <FilterLabel variant="createPart">Código</FilterLabel>
            <Form.Control
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="Ej: PART-001"
              isInvalid={!!errors.id}
              disabled={!!initialData.id}
            />
            <Form.Control.Feedback type="invalid">
              {errors.id}
            </Form.Control.Feedback>
          </Col>
          <Col md={6}>
            <FilterLabel variant="createPart">Nombre</FilterLabel>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Filtro de Aire"
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Col>
        </Row>
      </FormSection>

      <FormSection>
        <FilterLabel variant="createPart">Descripción</FilterLabel>
        <Form.Control
          as="textarea"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Descripción del repuesto"
          rows={4}
        />
      </FormSection>

      <FormSection>
        <Row>
          <Col md={6}>
            <FilterLabel variant="createPart">Cantidad</FilterLabel>
            <Form.Control
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: Number(e.target.value) })
              }
              placeholder="Cantidad disponible"
              isInvalid={!!errors.quantity}
            />
            <Form.Control.Feedback type="invalid">
              {errors.quantity}
            </Form.Control.Feedback>
          </Col>
          <Col md={6}>
            <FilterLabel variant="createPart">Precio</FilterLabel>
            <Form.Control
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              placeholder="Precio en $"
              isInvalid={!!errors.price}
            />
            <Form.Control.Feedback type="invalid">
              {errors.price}
            </Form.Control.Feedback>
          </Col>
        </Row>
      </FormSection>

      <FormSection className="d-flex justify-content-center align-items-center">
        <FilterLabel variant="createPart">Imagen</FilterLabel>
        <Form.Control
          className="w-50 me-4 ms-2"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={(e) =>
            setFormData({ ...formData, image: e.target.files[0] })
          }
        />
        {(initialData.image || formData.image) && (
          <div className="mt-2">
            <ImageContainer>
              <img
                src={
                  formData.image
                    ? URL.createObjectURL(formData.image)
                    : `${API_URL}${initialData.image}`
                }
                alt="Repuesto"
                onError={(e) => {
                  e.target.src = "/placeholder.png";
                }}
              />
            </ImageContainer>
          </div>
        )}
      </FormSection>

      <FormSection>
        <FilterLabel variant="createPart">Modelos Compatibles</FilterLabel>
        <ModelTagContainer>
          <AllModelsTag
            active={formData.all_models}
            onClick={handleAllModelsToggle}
          >
            Todos los modelos
          </AllModelsTag>
          {!formData.all_models &&
            vehicleModels.map((model) => (
              <ModelTag
                key={model}
                active={formData.compatible_models.includes(model)}
                onClick={() => handleModelChange(model)}
              >
                {model}
              </ModelTag>
            ))}
        </ModelTagContainer>
      </FormSection>

      <FormSection>
        <div className="d-flex justify-content-end gap-2">
          <CustomButton type="submit">
            {initialData.id ? "Actualizar" : "Crear"}
          </CustomButton>
          <CustomButton onClick={onCancel}>Cancelar</CustomButton>
        </div>
      </FormSection>
    </Form>
  );
};

export default PartForm;
