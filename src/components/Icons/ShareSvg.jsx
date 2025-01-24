import React from "react";
import { ReactComponent as ShareOne } from "../../assets/share-one.svg";

const ShareSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {
  switch (variant) {
    case "one": return <ShareOne
      id={id}
      className={`${className || ""}`}
      onClick={onClick}
      onKeyUp={onKeyUp}
    />
  }
}

export default ShareSvg