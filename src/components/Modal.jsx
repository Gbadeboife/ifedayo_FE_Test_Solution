import React from "react";
import { GlobalContext, showToast } from "@/globalContext";
import { AuthContext } from "../authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import moment from "moment";

let sdk = new MkdSDK();

export default function Modal({ showModal, modalShowTitle, modalShowMessage, type, modalBtnText, itemId, itemId2, table1, table2, backTo }) {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { dispatch } = React.useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <>
      {showModal ? (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
            <div className="relative my-6 mx-auto w-auto max-w-3xl md:min-w-[35rem]">
              {/*content*/}
              <div className="relative flex w-full flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between rounded-t border-solid border-slate-200 px-5 pt-6">
                  <h3 className="text-xl font-semibold">{modalShowTitle}</h3>
                  <button
                    className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black outline-none focus:outline-none"
                    onClick={() =>
                      globalDispatch({
                        type: "SHOWMODAL",
                        payload: {
                          showModal: false,
                          modalShowMessage: "",
                          modalBtnText: "",
                        },
                      })
                    }
                  >
                    <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">×</span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative flex-auto px-6 py-2">
                  <p className="text-lg my-2 normal-case leading-relaxed text-slate-500">{modalShowMessage}</p>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end rounded-b border-solid border-slate-200 px-6 pb-6">
                  <button
                    className="background-transparent mr-1 mb-1  rounded border border-[##98A2B3] px-6 py-2 text-sm font-bold text-[#667085] outline-none focus:outline-none"
                    type="button"
                    onClick={() => {
                      globalDispatch({
                        type: "SHOWMODAL",
                        payload: {
                          showModal: false,
                          modalShowMessage: "",
                          modalBtnText: "",
                        },
                      });

                      if (type === "Delete") {
                        return;
                      }

                      globalDispatch({
                        type: "SHOWMODAL",
                        payload: {
                          showModal: false,
                          modalShowMessage: "You are about to log out.",
                        },
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="ml-5 mb-1 rounded border border-[##98A2B3] !bg-gradient-to-r from-primary to-primary-dark px-6 py-2 text-sm font-medium text-white outline-none focus:outline-none"
                    type="button"
                    onClick={async () => {
                      globalDispatch({
                        type: "SHOWMODAL",
                        payload: {
                          showModal: false,
                          modalShowMessage: "",
                          modalBtnText: "",
                          itemId: "",
                          itemId2: "",
                          table1: "",
                          table2: "",
                        },
                      });

                      // if (type === "Delete") {
                      //   try {
                      //     if (table1 == "user") {
                      //       sdk.setTable("device");
                      //       await sdk.callRestAPI({ user_id: itemId }, "DELETEALL");
                      //       sdk.setTable("notification");
                      //       await sdk.callRestAPI({ user_id: itemId }, "DELETEALL");
                      //     }
                      //     sdk.setTable(table1);
                      //     await sdk.callRestAPI(
                      //       {
                      //         id: itemId,
                      //       },
                      //       "DELETE",
                      //     );
                      //     if (table1 == "property_spaces_images") {
                      //       sdk.setTable("photo");
                      //       await sdk.callRestAPI({ id: itemId2 }, "DELETE");
                      //     }
                      //     showToast(globalDispatch, "Successful");
                      //     if (table2) {
                      //       sdk.setTable(table2);
                      //       await sdk.callRestAPI(
                      //         {
                      //           user_id: itemId,
                      //         },
                      //         "DELETEALL",
                      //       );
                      //     }
                      //     globalDispatch({
                      //       type: "DELETED",
                      //       payload: {
                      //         deleted: true,
                      //       },
                      //     });
                      //     if (backTo) {
                      //       navigate(backTo);
                      //     }
                      //   } catch (error) {
                      //     showToast(globalDispatch, error.message, 4000, "ERROR");
                      //   }
                      //   return;
                      // }

                      if (type == "Delete") {
                        try {
                          // sdk.setTable(table1);
                          // await sdk.callRestAPI({ id: itemId, deleted_at: moment().format("yyyy-MM-DD HH:mm:ss") }, "PUT");
                          await sdk.callRawAPI("/v2/api/custom/ergo/soft-delete", { id: itemId, entity: table1, type: "delete" }, "POST");
                          showToast(globalDispatch, "Successful");
                          globalDispatch({
                            type: "DELETED",
                            payload: {
                              deleted: true,
                            },
                          });
                          if (backTo) {
                            navigate(backTo);
                          }
                        } catch (err) {
                          showToast(globalDispatch, err.message, 4000, "ERROR");
                        }
                        return;
                      }
                      if (type == "BaasDelete") {
                        try {
                          sdk.setTable(table1);
                          await sdk.callRestAPI({ id: itemId, deleted_at: moment().format("yyyy-MM-DD HH:mm:ss") }, "PUT");
                          // await sdk.callRawAPI("/v2/api/custom/ergo/property-space-images", { id: itemId, entity: table1, type: "delete" }, "POST");
                          showToast(globalDispatch, "Successful");
                          globalDispatch({
                            type: "DELETED",
                            payload: {
                              deleted: true,
                            },
                          });
                          if (backTo) {
                            navigate(backTo);
                          }
                        } catch (err) {
                          showToast(globalDispatch, err.message, 4000, "ERROR");
                        }
                        return;
                      }
                      if (type === "Edit") {
                        globalDispatch({
                          type: "SAVE_CHANGES",
                          payload: {
                            saveChanges: true,
                          },
                        });
                        return;
                      }

                      dispatch({
                        type: "LOGOUT",
                      });

                      navigate("/admin/login");
                    }}
                  >
                    {modalBtnText}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
        </>
      ) : null}
    </>
  );
}
