import React from "react";
import { GlobalContext, showToast } from "@/globalContext";
import { AuthContext } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";

let sdk = new MkdSDK();

export default function RestoreModal({ modalOpen, closeModal, onSuccess, data }) {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { dispatch } = React.useContext(AuthContext);

  async function restoreRecord() {
    try {
      sdk.setTable(data.entity_type);
      await sdk.callRestAPI({ id: data.id, deleted_at: null }, "PUT");
      showToast(globalDispatch, "Restored successfully");
      onSuccess();
      closeModal();
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 5000, "ERROR");
    }
  }

  return (
    <>
      {modalOpen ? (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
            <div className="relative my-6 mx-auto w-auto max-w-3xl md:min-w-[35rem]">
              <div className="relative flex w-full flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none">
                <div className="flex items-start justify-between rounded-t border-solid border-slate-200 px-5 pt-6">
                  <h3 className="text-xl font-semibold">Are you sure?</h3>
                  <button
                    className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none text-black outline-none focus:outline-none"
                    onClick={closeModal}
                  >
                    <span className="block h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">×</span>
                  </button>
                </div>
                <div className="relative flex-auto px-6 py-2">
                  <p className="text-lg my-2 normal-case leading-relaxed text-slate-500">Are you sure you want to restore this record?</p>
                </div>
                <div className="flex items-center justify-end rounded-b border-solid border-slate-200 px-6 pb-6">
                  <button
                    className="background-transparent mr-1 mb-1  rounded border border-[##98A2B3] px-6 py-2 text-sm font-bold text-[#667085] outline-none focus:outline-none"
                    type="button"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="ml-5 mb-1 rounded border border-[##98A2B3] !bg-gradient-to-r from-primary to-primary-dark px-6 py-2 text-sm font-medium text-white outline-none focus:outline-none"
                    type="button"
                    onClick={restoreRecord}
                  >
                    Restore
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
