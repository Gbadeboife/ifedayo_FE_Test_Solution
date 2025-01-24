import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { useEffect, useState } from "react";
import { useContext } from "react";
const ctrl = new AbortController();

export default function usePropertySpaceReviews(property_space_id) {
  const [reviews, setReviews] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { state: authState } = useContext(AuthContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchReviews() {
    const where = [`ergo_review.property_spaces_id = ${property_space_id} AND ergo_review.status = 1 AND ergo_review.given_by = 'customer'`];
    try {
      const sdk = new MkdSDK();
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/review-hashtag/PAGINATE", { page: 1, limit: 1000, where, user: authState.role }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setReviews(result.list);
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
    fetchReviews();
  }, [property_space_id]);

  return reviews;
}
