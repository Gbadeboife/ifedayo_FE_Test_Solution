import React from "react";
import { ReactComponent as FileCheckThree } from "../../assets/file-check-three.svg";
import { ReactComponent as FilePlusThree } from "../../assets/file-plus-three.svg";
import { ReactComponent as FileQuestionThree } from "../../assets/file-question-three.svg";
import { ReactComponent as FileSearchOne } from "../../assets/file-search-one.svg";


const BuildingSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case "check-three": return <FileCheckThree
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
        case "plus-three": return <FilePlusThree
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
        case "question-three": return <FileQuestionThree
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
        case "search-one": return <FileSearchOne
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default BuildingSvg