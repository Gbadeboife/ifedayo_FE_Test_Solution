import React from "react";
import { ReactComponent as Calender } from "../../assets/calender.svg";

const CalenderSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        default: return <Calender
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default CalenderSvg