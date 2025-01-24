import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { useEffect, useState } from "react";

const ctrl = new AbortController();
export default function usePropertySpaceAmenities(property_space_id, editAmenities) {
  const [amenities, setAmenities] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchPropertySpaceAmenities() {
    const sdk = new MkdSDK();
    const where = [`ergo_property_spaces.id = ${property_space_id}`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/property-spaces-amenitites/PAGINATE", { page: 1, limit: 1000, where }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setAmenities(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
    }
  }

  useEffect(() => {
    if (isNaN(property_space_id)) return;
    fetchPropertySpaceAmenities();
  }, [property_space_id, editAmenities]);

  return amenities;
}
