import { useState } from "react";
import { Switch } from "@headlessui/react";

export default function SwitchBulkMode({ enabled, setEnabled }) {
  return (
    <div className="py-1">
      <Switch
        checked={enabled}
        onChange={setEnabled}
        className={`${enabled ? "!bg-gradient-to-r from-primary-dark to-primary-dark" : "bg-gray-300"}
          relative inline-flex h-[28px] w-[55px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`${enabled ? "translate-x-7" : "translate-x-0"}
            pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  );
}
