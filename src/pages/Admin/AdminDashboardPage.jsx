import React, { useEffect } from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import { useState } from "react";
import { BOOKING_STATUS } from "@/utils/constants";
import MkdSDK from "@/utils/MkdSDK";
import TreeSDK from "@/utils/TreeSDK";

const AdminDashboardPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [totalUsers, setTotalUsers] = useState([]);
  const [totalBookings, setTotalBookings] = useState([]);
  const sdk = new MkdSDK();
  const treeSdk = new TreeSDK();

  async function fetchUsers() {
    try {
      const result = await treeSdk.getList("user", { filter: ["deleted_at,is"], join: [] });
      if (Array.isArray(result.list)) {
        setTotalUsers(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function fetchBookings() {
    sdk.setTable("booking");
    try {
      const result = await sdk.callRestAPI({}, "GETALL");
      if (Array.isArray(result.list)) {
        setTotalBookings(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "dashboard",
      },
    });

    (async () => {
      await fetchUsers();
      await fetchBookings();
    })();
  }, []);

  const hostCount = totalUsers.reduce((acc, curr) => acc + (curr.role == "host" ? 1 : 0), 0);
  const customerCount = totalUsers.reduce((acc, curr) => acc + (curr.role == "customer" ? 1 : 0), 0);

  const ongoingBookingCount = totalBookings.reduce((acc, curr) => acc + (curr.status == BOOKING_STATUS.ONGOING ? 1 : 0), 0);
  const upcomingBookingCount = totalUsers.reduce((acc, curr) => acc + (curr.status == BOOKING_STATUS.UPCOMING ? 1 : 0), 0);

  return (
    <>
      <div className="p-5">
        <h2 className="mb-12 text-3xl font-medium">Stats</h2>
        <h4 className="mb-4 text-xl font-medium">Users</h4>
        <div className="mb-12 flex max-w-full flex-wrap gap-16">
          <div className="w-80 border-2 border-black p-5 py-8">
            <h5 className="mb-8">Hosts</h5>
            <h1 className="text-4xl font-semibold">
              <span>{hostCount}</span>
            </h1>
          </div>
          <div className="w-80 border-2 border-black p-5 py-8">
            <h5 className="mb-8">Customers</h5>
            <h1 className="text-4xl font-semibold">
              <span>{customerCount}</span>
            </h1>
          </div>
        </div>
        <h4 className="mb-4 text-xl font-medium">Bookings</h4>
        <div className="mb-12 flex max-w-full flex-wrap gap-16">
          <div className="w-80 border-2 border-black p-5 py-8">
            <h5 className="mb-8">Active Bookings</h5>
            <h1 className="text-4xl font-semibold">
              <span>{ongoingBookingCount}</span>
            </h1>
          </div>
          <div className="w-80 border-2 border-black p-5 py-8">
            <h5 className="mb-8">Upcoming Bookings</h5>
            <h1 className="text-4xl font-semibold">
              <span>{upcomingBookingCount}</span>
            </h1>
          </div>
          <div className="w-80 border-2 border-black p-5 py-8">
            <h5 className="mb-8">Total Bookings</h5>
            <h1 className="text-4xl font-semibold">
              <span>{totalBookings.length}</span>
            </h1>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
