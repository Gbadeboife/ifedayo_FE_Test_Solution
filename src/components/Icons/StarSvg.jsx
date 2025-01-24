import React from "react";
import { ReactComponent as Star } from "../../assets/star.svg";

const StarSvg = ({ className = "", id, onClick, onKeyUp }) => (
  <Star
    id={id}
    className={`${className || ""}`}
    onClick={onClick}
    onKeyUp={onKeyUp}
  />
);

export default StarSvg;
