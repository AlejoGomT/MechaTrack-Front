import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Row,
  Form,
  Alert,
  Carousel,
  Spinner,
} from "react-bootstrap";
import backgroundImage from "../assets/images/background.jpg";
import mechanicImage from "../assets/images/carrusel/truck-repair.jpg";
import truckImage from "../assets/images/carrusel/truck-road.jpg";
import toolsImage from "../assets/images/carrusel/tools.jpg";
import {
  LoginWrapper,
  Overlay,
  LoginCol,
  CarouselCol,
  StyledCarousel,
  CarouselItemDiv,
  OverlayText,
  FormInput,
  StyledButton,
} from "../styles/GlobalStyles";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "technician":
          navigate("/technician");
          break;
        case "secretary":
          navigate("/secretary");
          break;
        case "client":
          navigate("/client");
          break;
        default:
          setError("Tipo de usuario no reconocido");
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!id || !password) {
      setError("Por favor, ingrese ID y contraseña");
      setIsLoading(false);
      return;
    }

    // Validar formato del ID (U + 3 dígitos)
    const idRegex = /^U\d{3}$/;
    if (!idRegex.test(id)) {
      setError("El ID debe tener el formato U seguido de 3 dígitos (ej. U001)");
      setIsLoading(false);
      return;
    }

    try {
      await login(id, password);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <LoginWrapper background={backgroundImage}>
      <Overlay />
      <Container fluid className="h-100">
        <Row className="h-100 align-items-center">
          <LoginCol md={6} className="p-5">
            <h2
              className="text-center mb-4 text-white"
              style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
            >
              Inicio de Sesión
            </h2>
            {error && (
              <Alert variant="danger" id="error-alert">
                {error}
              </Alert>
            )}
            <Form
              onSubmit={handleSubmit}
              aria-describedby={error ? "error-alert" : undefined}
            >
              <Form.Group className="mb-3" controlId="id">
                <Form.Label className="text-white">ID de Usuario</Form.Label>
                <FormInput
                  type="text"
                  placeholder="Ingrese su ID (Ej. U001)"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  aria-label="ID de usuario"
                  disabled={isLoading}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="password">
                <Form.Label className="text-white">Contraseña</Form.Label>
                <FormInput
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label="Contraseña"
                  disabled={isLoading}
                />
              </Form.Group>
              <StyledButton
                type="submit"
                className="w-100 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </StyledButton>
            </Form>
          </LoginCol>

          <CarouselCol md={6}>
            <StyledCarousel interval={3000} controls={false} indicators>
              <Carousel.Item>
                <CarouselItemDiv image={mechanicImage}>
                  <OverlayText>
                    <h3
                      className="text-white text-center p-3"
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      Técnicos especializados para tu vehículo
                    </h3>
                  </OverlayText>
                </CarouselItemDiv>
              </Carousel.Item>
              <Carousel.Item>
                <CarouselItemDiv image={truckImage}>
                  <OverlayText>
                    <h3
                      className="text-white text-center p-3"
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      Mantenimiento de flotas en tiempo real
                    </h3>
                  </OverlayText>
                </CarouselItemDiv>
              </Carousel.Item>
              <Carousel.Item>
                <CarouselItemDiv image={toolsImage}>
                  <OverlayText>
                    <h3
                      className="text-white text-center p-3"
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      Innovación en cada reparación
                    </h3>
                  </OverlayText>
                </CarouselItemDiv>
              </Carousel.Item>
            </StyledCarousel>
          </CarouselCol>
        </Row>
      </Container>
    </LoginWrapper>
  );
};

export default Login;
