import { CustomButton as StyledButton } from "../styles/GlobalStyles";

const CustomButton = ({
  children,
  onClick,
  variant = "primary",
  type = "button",
  ...props
}) => {
  return (
    <StyledButton onClick={onClick} variant={variant} type={type} {...props}>
      {children}
    </StyledButton>
  );
};

export default CustomButton;
