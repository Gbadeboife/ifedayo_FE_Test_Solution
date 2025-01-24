import React from "react";
import { ReactComponent as UserSquare } from "../../assets/user-square.svg";
import { ReactComponent as UserCircle } from "../../assets/user-circle.svg";

const UserSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case "square": return <UserSquare
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
        case "circle": return <UserCircle
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default UserSvg