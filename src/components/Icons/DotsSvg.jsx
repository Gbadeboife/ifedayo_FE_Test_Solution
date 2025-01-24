import React from "react";
import { ReactComponent as Dots } from "../../assets/dots.svg";

const DotsSvg = ({ className = "", id, onClick, onKeyUp }) => (
  <Dots
    id={id}
    className={`${className || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default DotsSvg