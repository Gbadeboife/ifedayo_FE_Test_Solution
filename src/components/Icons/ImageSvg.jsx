import React from "react";
import { ReactComponent as ImageThree } from "../../assets/image-three.svg";

const ImageSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      case "three": return <ImageThree
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default ImageSvg