import React from "react";
import { ReactComponent as ArrowNarrowLeft } from "../../assets/arrow-narrow-left.svg";
import { ReactComponent as ArrowNarrowRight } from "../../assets/arrow-narrow-right.svg";


const ArrowSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case "narrow-right": return <ArrowNarrowRight
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
        case "narrow-left": return <ArrowNarrowLeft
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default ArrowSvg