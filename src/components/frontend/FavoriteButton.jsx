import { AuthContext } from "@/authContext";
import HeartIcon from "@/components/frontend/icons/HeartIcon";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import React, { useContext, useState } from "react";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import { Tooltip } from "react-tooltip";

function FavoriteButton({ space_id, user_property_spaces_id, reRender, withLoader, className, buttonClassName, stroke, favColor }) {
  const [unfavorite, setUnfavorite] = useState(false);
  const showUnfavorite = useDelayUnmount(unfavorite, 100);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { state: authState } = useContext(AuthContext);
  const sdk = new MkdSDK();
  async function favorite() {
    if (withLoader) {
      globalDispatch({ type: "START_LOADING" });
    }
    sdk.setTable("user_property_spaces");
    try {
      await sdk.callRestAPI({ property_spaces_id: space_id, user_id: authState.user }, "POST");
      if (reRender) {
        reRender(new Date());
      }
      globalDispatch({ type: "STOP_LOADING" });
    } catch (err) {
      globalDispatch({ type: "STOP_LOADING" });
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function unFavorite() {
    if (withLoader) {
      globalDispatch({ type: "START_LOADING" });
    }
    sdk.setTable("user_property_spaces");
    try {
      await sdk.callRestAPI({ id: user_property_spaces_id }, "DELETE");
      if (reRender) {
        reRender(new Date());
      }
      globalDispatch({ type: "STOP_LOADING" });
      setUnfavorite(false);
    } catch (err) {
      globalDispatch({ type: "STOP_LOADING" });
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation Failed",
          message: err.message,
        },
      });
    }
  }

  async function toggleFavorite() {
    if (user_property_spaces_id) {
      setUnfavorite(true);
    } else {
      favorite();
    }
  }

  return (
    <div className={className ?? "flex flex-grow justify-end pt-2"}>
      <button
        className={buttonClassName ?? "pointer-auto flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#13131366] text-end"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite();
        }}
        id="favorite-button"
      >
        <HeartIcon
          isFav={user_property_spaces_id !== null && user_property_spaces_id !== 0}
          stroke={stroke}
          favColor={favColor}
        />
      </button>
      {showUnfavorite && (
        <div
          className="popup-container flex items-center justify-center normal-case"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUnfavorite(false);
            {
              showUnfavorite && (
                <div
                  className="popup-container flex items-center justify-center normal-case"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUnfavorite(false);
                  }}
                >
                  <div
                    className={`${unfavorite ? "pop-in" : "pop-out"} w-[400px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-[18px] flex items-center justify-between">
                      <h3 className="text-2xl font-semibold">Are you sure?</h3>
                      <button
                        className="rounded-full border p-1 px-3 text-2xl font-normal duration-300 hover:bg-gray-200"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUnfavorite(false);
                        }}
                      >
                        &#x2715;
                      </button>
                    </div>
                    <p>Are you sure you want to remove this space from your favorites?</p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className="mt-4 flex-grow rounded border-2 border-[#98A2B3] py-2 tracking-wide outline-none focus:outline-none"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUnfavorite(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="login-btn-gradient mt-4 flex-grow rounded py-2 tracking-wide text-white  outline-none focus:outline-none"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          unFavorite();
                        }}
                      >
                        Yes, remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          }}
        >
          <div
            className={`${unfavorite ? "pop-in" : "pop-out"} w-[400px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Are you sure?</h3>
              <button
                className="rounded-full border p-1 px-3 text-2xl font-normal duration-300 hover:bg-gray-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUnfavorite(false);
                }}
              >
                &#x2715;
              </button>
            </div>
            <p>Are you sure you want to remove this space from your favorites?</p>
            <div className="flex gap-4">
              <button
                type="button"
                className="mt-4 flex-grow rounded border-2 border-[#98A2B3] py-2 tracking-wide outline-none focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUnfavorite(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="login-btn-gradient mt-4 flex-grow rounded py-2 tracking-wide text-white  outline-none focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  unFavorite();
                }}
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}
      {/* <Tooltip
        anchorId="favorite-button"
        place="right"
        content={user_property_spaces_id ? "Remove from favorites" : "Add to favorites"}
        noArrow
      /> */}
    </div>
  );
}

export default FavoriteButton;
