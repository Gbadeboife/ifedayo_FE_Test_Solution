import { parseJsonSafely } from "@/utils/utils";
import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import TreeSDK from "@/utils/TreeSDK";
import { v4 as uuidv4 } from 'uuid';
import MkdSDK from "@/utils/MkdSDK";

const OauthRedirect = () => {
  const { dispatch: authDispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();

  const treeSdk = new TreeSDK();
  const sdk = new MkdSDK();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = parseJsonSafely(urlParams.get("data"), {});
    if (data?.error) {
      showToast(globalDispatch, data?.message, 3000, "error")
      navigate("/login");
    } else {
      authDispatch({ type: "LOGIN", payload: data });
      localStorage.setItem("first_login", data.user_id);
      localStorage.setItem("token", data.token ?? data.access_token);
      //register db
      if (!localStorage.getItem("device-uid") || localStorage.getItem("device-uid") !== undefined) {
        sdk.setUUId();
      }
      navigate("/");
    }
  }, []);

  return <h1 className="mt-96 text-7xl"></h1>;
};

export default OauthRedirect;
