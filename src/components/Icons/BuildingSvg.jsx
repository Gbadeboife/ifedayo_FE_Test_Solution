import React from "react";
import { ReactComponent as BuildingOne } from "../../assets/building-one.svg";

const BuildingSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case "one": return <BuildingOne
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default BuildingSvg