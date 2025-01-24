import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { IMAGE_STATUS } from "@/utils/constants";
import { useContext, useState } from "react";
import { useEffect } from "react";

const ctrl = new AbortController();

export default function usePropertySpaceImages(property_space_id, allowUnApproved, setFetching) {
  const [spaceImages, setSpaceImages] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchPropertySpaceImages() {
    setFetching(true)
    const where = [`property_spaces_id = ${property_space_id} AND ${allowUnApproved ? `is_approved = ${IMAGE_STATUS.APPROVED}` : `is_approved = ${IMAGE_STATUS.IN_REVIEW}`} AND ergo_property_spaces_images.deleted_at IS NULL`];
    try {
      const sdk = new MkdSDK();
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/property-space-images/PAGINATE", { page: 1, limit: 7, where }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setSpaceImages(result.list);
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
    setFetching(false)
  }

  useEffect(() => {
    if (isNaN(property_space_id)) return;
    fetchPropertySpaceImages();
  }, [property_space_id]);

  return spaceImages;
}
