import { Combobox, Transition } from "@headlessui/react";
import React, { Fragment, useContext, useState } from "react";
import usePlacesService from "react-google-autocomplete/lib/usePlacesAutocompleteService";
import { useController } from "react-hook-form";
import LocationIcon from "./frontend/icons/LocationIcon";
import { GlobalContext } from "@/globalContext";

export default function CustomStaticLocationAutoCompleteV2({ type, control, name, setValue, onClear, className, containerClassName, hideIcons, suggestionType, ...restProps }) {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [location, setLocation] = useState(globalState.location || "");

  const { placePredictions, getPlacePredictions, isPlacePredictionsLoading } = usePlacesService({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    options: { types: suggestionType ?? ["(region)"] },
    debounce: 200,
  });

  return (
    <Combobox
      as={"div"}
      className={`relative w-full normal-case z-100 ${containerClassName ?? ""}`}
      value={location}
    >
      {/*!hideIcons && <LocationIcon />*/}

      <Combobox.Input
        {...restProps}
        autoComplete="off"
        className={`w-full truncate text-black ${className ?? ""}`}
        value={location}
        onChange={(evt) => {
          setLocation(evt.target.value);
          getPlacePredictions({ input: evt.target.value });
        }}
      />
      {!hideIcons && location && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            setLocation("");
            if (onClear) {
              onClear();
            }
          }}
        >
          &#x2715;
        </button>
      )}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        {isPlacePredictionsLoading ? (
          <div className="absolute left-0 right-0 z-50 flex justify-center w-full py-8 mt-2 origin-top bg-white border top-full rounded-xl">
            <svg
              style={{ margin: "auto", background: "none", display: "block", shapeRendering: "auto" }}
              width="36px"
              height="36px"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid"
            >
              <path
                fill="none"
                stroke="#d0d5dd"
                strokeWidth="10"
                strokeDasharray="42.76482137044271 42.76482137044271"
                d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
                strokeLinecap="round"
                style={{ transform: "scale(1)", transformOrigin: "50px 50px" }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  repeatCount="indefinite"
                  dur="1.6666666666666667s"
                  keyTimes="0;1"
                  values="0;256.58892822265625"
                ></animate>
              </path>
            </svg>
          </div>
        ) : (
          <Combobox.Options
            className={`${placePredictions.length > 0 ? "py-2 shadow-lg ring-1" : ""
              } absolute left-0 right-0 top-full z-50 mt-2 w-full origin-top cursor-pointer divide-y divide-gray-100 rounded-xl bg-white ring-black ring-opacity-5 focus:outline-none`}
          >
            {placePredictions.map((place, idx) => (
              <Combobox.Option
                className="flex items-center w-full px-3 py-3 pr-5 text-sm truncate rounded-pill ui-active:bg-gray-100 ui-active:text-black ui-not-active:text-gray-800"
                key={idx}
                value={place.structured_formatting.main_text}
                onClick={() => {
                  const selectedValue = place?.structured_formatting.main_text + ', ' + place.structured_formatting?.secondary_text;
                  setValue(selectedValue);
                  setLocation(selectedValue);
                }}
              >
                <span>{`${place.structured_formatting.main_text} ${place.structured_formatting?.secondary_text ? "," : ""} ${place.structured_formatting?.secondary_text ? place.structured_formatting?.secondary_text : ""}`}</span>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </Transition>
    </Combobox>
  );
}
