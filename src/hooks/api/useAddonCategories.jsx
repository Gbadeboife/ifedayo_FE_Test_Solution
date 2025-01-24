import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext, useEffect, useState } from "react";

const ctrl = new AbortController();
export default function useAddonCategories(space_id, is_others) {
  const [addons, setAddons] = useState([]);
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchAddons() {
    let sdk = new MkdSDK();
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/add_on/PAGINATE",
        { page: 1, limit: 1000, where: ["deleted_at IS NULL", `${is_others ? space_id && `space_id != ${space_id}` : space_id ? `space_id = ${space_id}` : "1"} OR ${`creator_id = ${Number(localStorage.getItem("user"))}`}`] },
        "POST",
        ctrl.signal,
      );
      if (!result.error) {
        setAddons(result.list);
      }
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
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
    fetchAddons();
  }, [space_id]);

  return addons;
}
