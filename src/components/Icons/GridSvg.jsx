import React from "react";
import { ReactComponent as GridOne } from "../../assets/grid-one.svg";

const GridSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      case "one": return <GridOne
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default GridSvg