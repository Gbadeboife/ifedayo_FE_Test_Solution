import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useState } from "react";
import usePlacesService from "react-google-autocomplete/lib/usePlacesAutocompleteService";
import LocationIcon from "./icons/LocationIcon";

function truncateString(str, limit) {
  if (str.length > limit) return str.slice(0, limit) + "...";
  return str;
}

export default function CustomLocationAutoComplete({ location, setLocation, className, truncateNum, onChange, onClear, hideIcon, detailMode, ...restProps }) {
  const [predictionsOpen, setPredictionsOpen] = useState(false);
  // const [predictions, setPredictions] = useState([]);

  const { placesService, placePredictions, getPlacePredictions, isPlacePredictionsLoading } = usePlacesService({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  });

  // useEffect(() => {
  // fetch place details for the first element in placePredictions array
  //   if (placePredictions.length)
  //     placesService?.getDetails(
  //       {
  //         placeId: placePredictions[0].place_id,
  //       },
  //       (placeDetails) => setPredictions(placeDetails),
  //     );
  // }, [placePredictions]);

  return (
    <Menu
      as={"div"}
      className={`relative ${className ?? ""}`}
    >
      {!hideIcon && <LocationIcon />}

      <input
        {...restProps}
        className="border-0 focus:outline-none w-full truncate text-black"
        onChange={(evt) => {
          getPlacePredictions({ input: evt.target.value });
          setLocation(evt.target.value);
          if (onChange) {
            onChange(evt.target.value);
          }
        }}
        onFocus={() => setPredictionsOpen(true)}
        onBlur={() => setPredictionsOpen(false)}
        value={location}
      />
      {location && (
        <button
          type="button"
          onClick={() => {
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
        show={predictionsOpen}
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`${placePredictions.length > 0 ? "py-2 shadow-lg ring-1" : ""
            } z-50 absolute left-0 right-0 top-full mt-2 w-full origin-top divide-y divide-gray-100 rounded-xl bg-white ring-black ring-opacity-5 focus:outline-none`}
        >
          {!detailMode &&
            placePredictions.map((place, idx) => (
              <div
                className="px-1 py-1"
                key={idx}
              >
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      className={`${active ? "bg-gray-100 text-black" : "text-gray-800"} pill flex w-full items-center rounded-md px-2 py-2 text-sm truncate`}
                      onClick={() => {
                        setLocation(place.description);
                        if (onChange) {
                          onChange(place.description);
                        }
                      }}
                    >
                      {truncateString(place.description, truncateNum ?? 30)}
                    </button>
                  )}
                </Menu.Item>
              </div>
            ))}
          {detailMode &&
            placePredictions.map((place, idx) => (
              <div
                className="px-1 py-1"
                key={idx}
              >
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      className={`${active ? "bg-gray-100 text-black" : "text-gray-800"} pill flex w-full items-center rounded-md px-3 pr-5 py-3 text-sm truncate`}
                      onClick={() => {
                        setLocation(place.structured_formatting.main_text);
                        if (onChange) {
                          onChange(place.structured_formatting.main_text);
                        }
                      }}
                    >
                      <span className="font-semibold">
                        {place.structured_formatting.main_text.slice(
                          place.structured_formatting.main_text_matched_substrings[0].offset,
                          place.structured_formatting.main_text_matched_substrings[0].length,
                        )}
                      </span>
                      {place.structured_formatting.main_text.slice(
                        place.structured_formatting.main_text_matched_substrings[0].offset + place.structured_formatting.main_text_matched_substrings[0].length,
                      )}
                    </button>
                  )}
                </Menu.Item>
              </div>
            ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
