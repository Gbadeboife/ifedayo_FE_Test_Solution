import React from "react";
import { ReactComponent as Logo } from "../../assets/logo.svg";

const LogoSvg = ({ className = "",fill, id, onClick, onKeyUp }) => (
  <Logo
    id={id}
    className={`${className || ""} ${fill || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default LogoSvg