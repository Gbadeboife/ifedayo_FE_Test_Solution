import React from "react";
import { ReactComponent as Pencil } from "../../assets/pencil.svg";

const PencilSvg = ({ className = "", id, onClick, onKeyUp }) => (
  <Pencil
    id={id}
    className={`${className || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default PencilSvg