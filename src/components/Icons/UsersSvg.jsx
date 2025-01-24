import React from "react";
import { ReactComponent as UsersOne } from "../../assets/users-one.svg";

const Users = ({ className = "", id, onClick, onKeyUp, variant }) => {

    switch (variant) {
        case "one": return <UsersOne
            id={id}
            className={`${className || ""}`}
            onClick={onClick}
            onKeyUp={onKeyUp}
        />
    }
}

export default Users