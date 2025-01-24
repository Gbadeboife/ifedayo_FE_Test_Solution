import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";

const ctrl = new AbortController();
export default function usePropertyAddons(property_id, editAddons) {
  const [addons, setAddons] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchPropertyAddons() {
    const sdk = new MkdSDK();
    const where = [`ergo_property.id = ${property_id} AND ergo_property_add_on.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/property-addons/PAGINATE", { page: 1, limit: 10000, where }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setAddons(result.list);
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
    if (property_id) {
      fetchPropertyAddons();
    }
  }, [property_id, editAddons]);

  return addons;
}
