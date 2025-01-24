import React from "react";
import { ReactComponent as SettingsTwo } from "../../assets/settings-two.svg";

const SettingsSvg = ({ className = "", id, onClick, onKeyUp, variant }) => {

  switch (variant) {
      case "two": return <SettingsTwo
          id={id}
          className={`${className || ""}`}
          onClick={onClick}
          onKeyUp={onKeyUp}
      />
  }
}

export default SettingsSvg