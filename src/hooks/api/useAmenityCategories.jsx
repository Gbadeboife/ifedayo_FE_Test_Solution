import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext, useEffect, useState } from "react";

const ctrl = new AbortController();
export default function useAmenityCategories(space_id, is_others) {
  const [amenities, setAmenities] = useState([]);
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchAmenities() {
    let sdk = new MkdSDK();
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/amenity/PAGINATE",
        { page: 1, limit: 1000, where: ["deleted_at IS NULL", `${is_others ? space_id && `space_id != ${space_id}` : space_id ? `space_id = ${space_id}` : "1"} OR ${`creator_id = ${Number(localStorage.getItem("user"))}`}`] },
        "POST",
        ctrl.signal,
      );

      if (!result.error) {
        setAmenities(result.list);
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
    fetchAmenities();
  }, [space_id]);
  return amenities;
}
