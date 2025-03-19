import { CustomButton as StyledButton } from '../styles/GlobalStyles';

const CustomButton = ({ children, onClick, variant = 'primary' }) => {
  return <StyledButton onClick={onClick} variant={variant}>{children}</StyledButton>;
};

export default CustomButton;