import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import React, { useContext, useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

export default function ConfirmDeletePage() {
  const [searchParams] = useSearchParams();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [pageText, setPageText] = useState("Deleting your account");

  async function deleteAccount() {
    globalDispatch({ type: "START_LOADING" });
    try {
      const result = await callCustomAPI("delete-account", "post", { token: searchParams.get("token") }, "");
      setPageText("Your account has been deleted");
      localStorage.clear();
    } catch (err) {
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Operation failed", message: err.message } });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  useEffect(() => {
    deleteAccount();
  }, []);

  if (!searchParams.get("token")) return <Navigate to={"/"} />;
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-32">{pageText}</h1>
    </div>
  );
}
