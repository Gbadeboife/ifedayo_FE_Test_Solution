import React from "react";
import { ReactComponent as HomeThree } from "../../assets/home-three.svg";
import { ReactComponent as HomeLine } from "../../assets/home-line.svg";

const HomeSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case "three": return <HomeThree
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
        case "line": return <HomeLine
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default HomeSvg