import React from "react";
import { ReactComponent as ChevronDown } from "../../assets/chevron-down.svg";

const CalenderSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case 'down': return <ChevronDown
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default CalenderSvg