import React from "react";
import { ReactComponent as Minus } from "../../assets/minus.svg";

const MinusSvg = ({ className = "", id, onClick, onKeyUp }) => (
  <Minus
    id={id}
    className={`${className || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default MinusSvg