import { CustomButton as StyledButton } from "../styles/GlobalStyles";
import React from "react";

const CustomButton = React.forwardRef(
  (
    { children, onClick, variant = "primary", type = "button", ...props },
    ref
  ) => {
    return (
      <StyledButton
        ref={ref}
        onClick={onClick}
        variant={variant}
        type={type}
        {...props}
      >
        {children}
      </StyledButton>
    );
  }
);

export default CustomButton;
