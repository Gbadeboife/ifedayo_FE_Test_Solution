import React from "react";
import { ReactComponent as Plus } from "../../assets/plus.svg";

const PlusSvg = ({ className = "", id, onClick, onKeyUp }) => (
  <Plus
    id={id}
    className={`${className || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default PlusSvg