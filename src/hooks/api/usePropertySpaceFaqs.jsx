import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
const ctrl = new AbortController();

export default function usePropertySpaceFaqs(property_space_id) {
  const [faqs, setFaqs] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchPropertySpaceFaqs() {
    try {
      const sdk = new MkdSDK();
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property_space_faq/PAGINATE",
        { page: 1, limit: 10, where: [`property_space_id = ${property_space_id} AND ergo_property_space_faq.deleted_at IS NULL`] },
        "POST",
        ctrl.signal,
      );
      if (Array.isArray(result.list)) {
        setFaqs(result.list);
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
    if (isNaN(property_space_id)) return;
    fetchPropertySpaceFaqs();
  }, [property_space_id]);
  return faqs;
}
