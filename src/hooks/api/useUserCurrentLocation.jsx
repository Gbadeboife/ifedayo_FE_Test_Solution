import { GlobalContext } from "@/globalContext";
import { parseJsonSafely } from "@/utils/utils";
import { useContext } from "react";
import { useEffect, useState } from "react";

export default function useUserCurrentLocation() {
  const [loc, setLoc] = useState({});
  const { state, dispatch } = useContext(GlobalContext);

  async function fetchIpData() {
    if (state.isLocationSet) {
      setLoc(state.userLocationData || {});
      return;
    }

    const localLoc = parseJsonSafely(localStorage.getItem("location"), {});
    if (localLoc?.city || localLoc?.country) {
      setLoc(localLoc);
      return;
    }
    try {
      const res = await fetch("https://api.ipregistry.co/?key=tryout");
      const json = await res.json();

      setLoc({ city: json.location?.city, country: json.location?.country?.name, done: true, latitude: json.location?.latitude, longitude: json.location?.longitude });
      localStorage.setItem(
        "location",
        JSON.stringify({ city: json.location?.city, country: json.location?.country?.name, done: true, latitude: json.location?.latitude, longitude: json.location?.longitude }),
      );
      // store globally
      dispatch({
        type: "SET_USER_CURRENT_LOCATION",
        payload: { city: json.location?.city, country: json.location?.country?.name, done: true, latitude: json.location?.latitude, longitude: json.location?.longitude },
      });
    } catch (err) {
      setLoc({ done: true });
    }
  }

  useEffect(() => {
    fetchIpData();
  }, []);

  return loc;
}
