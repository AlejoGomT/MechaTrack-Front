import { useState } from "react";
import { Form, Col } from "react-bootstrap";
import CustomButton from "./CustomButton";
import { FormActions } from "../styles/GlobalStyles";

const UserForm = ({ initialData = {}, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    first_name: initialData.first_name || "",
    last_name: initialData.last_name || "",
    email: initialData.email || "",
    password: initialData.password || "",
    role: initialData.role || "technician",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group as={Col} className="mb-3">
        <Form.Label>ID</Form.Label>
        <Form.Control
          type="text"
          value={initialData.id || "Generado automáticamente"}
          disabled
        />
      </Form.Group>
      <Form.Group as={Col} className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="Nombre"
          required
        />
      </Form.Group>
      <Form.Group as={Col} className="mb-3">
        <Form.Label>Apellido</Form.Label>
        <Form.Control
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Apellido"
          required
        />
      </Form.Group>
      <Form.Group as={Col} className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
      </Form.Group>
      <Form.Group as={Col} className="mb-3">
        <Form.Label>Contraseña</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
          required={!isEdit}
        />
      </Form.Group>
      <Form.Group as={Col} className="mb-3">
        <Form.Label>Rol</Form.Label>
        <Form.Select
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={formData.role === "admin"}
        >
          <option value="technician">Técnico</option>
          <option value="secretary">Secretario</option>
          <option value="client">Cliente</option>
          <option value="admin">Admin</option>
        </Form.Select>
      </Form.Group>
      <FormActions>
        <CustomButton type="submit">
          {isEdit ? "Guardar" : "Crear"}
        </CustomButton>
        <CustomButton onClick={onCancel}>Cancelar</CustomButton>
      </FormActions>
    </Form>
  );
};

export default UserForm;
