import React from "react";
import { ReactComponent as TrashTwo } from "../../assets/trash-two.svg";

const TrashSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      case "two": return <TrashTwo
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default TrashSvg