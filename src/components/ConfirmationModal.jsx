import { GlobalContext } from "@/globalContext";
import React from "react";
import { useContext } from "react";
import GreenCheckIcon from "./frontend/icons/GreenCheckIcon";

export default function ConfirmationModal() {
  const { state, dispatch } = useContext(GlobalContext);

  if (!state.confirmation) return null;

  return (
    <div className={"popup-container z-100 flex items-center justify-center normal-case"}>
      <div
        className={`${state.confirmation ? "pop-in" : "pop-out"} w-[510px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-3xl font-semibold">
          <GreenCheckIcon />
          {state.confirmationHeading}
        </h2>
        <p className="mb-4 text-sm text-gray-500">{state.confirmationMsg}</p>
        <button
          type="button"
          className="login-btn-gradient mt-4 w-full rounded py-2 tracking-wide text-white  outline-none focus:outline-none"
          onClick={() => {
            if (state.confirmationCloseFn) {
              state.confirmationCloseFn();
            }
            dispatch({ type: "CLOSE_CONFIRMATION" });
          }}
        >
          {state.confirmationBtn}
        </button>
      </div>
    </div>
  );
}
