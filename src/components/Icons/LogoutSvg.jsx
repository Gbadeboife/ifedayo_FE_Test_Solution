import React from "react";
import { ReactComponent as Logout } from "../../assets/logout.svg";

const LogoutSvg = ({ className = "", id, onClick, onKeyUp }) => (
  <Logout
    id={id}
    className={`${className || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default LogoutSvg