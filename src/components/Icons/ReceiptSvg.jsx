import React from "react";
import { ReactComponent as BookingReceipt } from "../../assets/booking-receipt.svg";

const ReceiptSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      case "booking": return <BookingReceipt
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default ReceiptSvg