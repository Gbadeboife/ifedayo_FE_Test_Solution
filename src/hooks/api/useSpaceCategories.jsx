import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext, useEffect, useState } from "react";

export default function useSpaceCategories() {
  const [categories, setCategories] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  async function fetchCategories() {
    const sdk = new MkdSDK();
    const ctrl = new AbortController();
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/spaces/PAGINATE", { page: 1, limit: 1000, where: ["deleted_at IS NULL"] }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setCategories(result.list);
        globalDispatch({ type: "SET_SPACE_CATEGORIES", payload: result.list });
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
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return categories;
}
