import React from "react";
import { ReactComponent as MailOne } from "../../assets/mail-one.svg";

const SettingsSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      default : return <MailOne
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default SettingsSvg