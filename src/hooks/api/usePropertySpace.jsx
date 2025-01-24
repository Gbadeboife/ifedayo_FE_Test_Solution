import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";

const sdk = new MkdSDK();
const ctrl = new AbortController();

export default function usePropertySpace(property_space_id, reRender) {
  const [propertySpace, setPropertySpace] = useState({});
  const [notFound, setNotFound] = useState(null);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchPropertySpace() {
    const user_id = localStorage.getItem("user");
    const where = [`ergo_property_spaces.id = ${property_space_id} AND ergo_property_spaces.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/popular/PAGINATE", { page: 1, limit: 1, user_id: Number(user_id), where, all: true }, "POST", ctrl.signal);
      if (Array.isArray(result.list) && result.list.length > 0) {
        setPropertySpace(result.list[0]);
      } else {
        // space not found
        setNotFound(true);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  useEffect(() => {
    if (isNaN(Number(property_space_id))) return;
    fetchPropertySpace();
  }, [property_space_id]);

  useEffect(() => {
    if (!reRender) return;
    fetchPropertySpace();
  }, [reRender]);

  return { propertySpace, notFound };
}
