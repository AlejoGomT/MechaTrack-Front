import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Form, Alert, Carousel } from 'react-bootstrap';
import backgroundImage from '../assets/images/background.jpg';
import mechanicImage from '../assets/images/carrusel/truck-repair.jpg';
import truckImage from '../assets/images/carrusel/truck-road.jpg';
import toolsImage from '../assets/images/carrusel/tools.jpg';
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
} from '../styles/GlobalStyles';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirigir cuando el usuario cambie (después de un login exitoso)
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'technician':
          navigate('/technician');
          break;
        case 'secretary':
          navigate('/secretary');
          break;
        case 'client':
          navigate('/client');
          break;
        default:
          setError('Tipo de usuario no reconocido');
      }
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validar que los campos no estén vacíos
    if (!username || !password) {
      setError('Por favor, ingrese usuario y contraseña');
      return;
    }

    // Intentar login
    const success = login(username, password);
    if (!success) {
      setError('Usuario o contraseña incorrectos');
    }
    // La redirección se manejará en el useEffect
  };

  return (
    <LoginWrapper background={backgroundImage}>
      <Overlay />
      <Container fluid className="h-100">
        <Row className="h-100 align-items-center">
          <LoginCol md={6} className="p-5">
            <h2 className="text-center mb-4 text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
              Inicio de Sesión
            </h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="text-white">Usuario</Form.Label>
                <FormInput
                  type="text"
                  placeholder="Ingrese su nombre"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
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
                />
              </Form.Group>
              <StyledButton type="submit" className="w-100 mt-4">
                Ingresar
              </StyledButton>
            </Form>
          </LoginCol>

          <CarouselCol md={6}>
            <StyledCarousel interval={3000} controls={false} indicators>
              <Carousel.Item>
                <CarouselItemDiv image={mechanicImage}>
                  <OverlayText>
                    <h3 className="text-white text-center p-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                      Técnicos especializados para tu vehículo
                    </h3>
                  </OverlayText>
                </CarouselItemDiv>
              </Carousel.Item>

              <Carousel.Item>
                <CarouselItemDiv image={truckImage}>
                  <OverlayText>
                    <h3 className="text-white text-center p-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                      Mantenimiento de flotas en tiempo real
                    </h3>
                  </OverlayText>
                </CarouselItemDiv>
              </Carousel.Item>

              <Carousel.Item>
                <CarouselItemDiv image={toolsImage}>
                  <OverlayText>
                    <h3 className="text-white text-center p-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
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