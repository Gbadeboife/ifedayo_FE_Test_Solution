import React from "react";
import { ReactComponent as BankNoteOne } from "../../assets/bank-note-one.svg";

const BankNoteSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      case "one": return <BankNoteOne
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default BankNoteSvg