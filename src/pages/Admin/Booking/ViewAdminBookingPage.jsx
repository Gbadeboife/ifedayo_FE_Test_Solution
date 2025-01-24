import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GlobalContext } from "@/globalContext";
import ViewAdminPageLayout from "@/layouts/ViewAdminPageLayout";
import { AuthContext, tokenExpireError } from "@/authContext";
import moment from "moment";

const ViewAdminBookingPage = () => {
  const [bookingInfo, setBookingInfo] = useState({});
  const [addons, setAddons] = useState([]);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { dispatch } = React.useContext(AuthContext);
  const params = useParams();
  const navigate = useNavigate();

  const selectStatus = [{ value: "Pending" }, { value: "Upcoming" }, { value: "Ongoing" }, { value: "Complete", color: "#0D9895" }, { value: "Declined" }, { value: "Cancelled" }];

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "booking",
      },
    });

    const removeDuplicates = (bookingAddons) => {
      let removed = [];
      const idExists = (id) => {
        return removed.some((duplicate) => duplicate.id === id);
      };
      bookingAddons.forEach((addon) => {
        if (idExists(addon.id)) {
          let index = removed.findIndex((add) => add.id === addon.id);
          removed[index].count += removed[index].count;
        } else {
          removed.push({ ...addon, count: 1 });
        }
      });
      return removed;
    };

    (async function () {
      try {
        let sdk = new MkdSDK();
        const result = await sdk.callRawAPI(
          "/v2/api/custom/ergo/booking/details",
          {
            where: [`ergo_booking.id=${Number(params?.id)}`],
          },
          "POST",
        );

        if (!result.error && result.list) {
          setBookingInfo(result.list);
          // console.log("list", result.list);
          setAddons(removeDuplicates(result.list.add_ons));
        }
      } catch (error) {
        console.log("ERROR", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);

  return (
    <ViewAdminPageLayout
      title={"Booking Details"}
      backTo={"booking"}
      showDelete={false}
    >
      <div className="py-2 flex lg:flex-row flex-col lg:justify-between">
        <div className="w-full lg:w-1/2 lg:max-w-[413px] mb-8 lg:mb-0">
          <div className="flex mb-1 px-5">
            <p className="w-[15rem] font-bold text-base">Booking #{params?.id}</p>
          </div>
          <div className="flex py-1">
            <p className="w-[9rem] px-5 text-right mr-10">Host</p>
            <p className="flex-1">
              {bookingInfo.host_first_name}, {bookingInfo.host_last_name}
            </p>
          </div>
          <div className="flex py-1">
            <p className="w-[9rem] px-5 text-right mr-10">Guest</p>
            <p className="flex-1">
              {bookingInfo.customer_first_name}{" "}{bookingInfo.customer_last_name}
            </p>
          </div>
          <div className="flex py-1">
            <p className="w-[9rem] px-5 text-right mr-10">Property</p>
            <p className="flex-1 normal-case">{bookingInfo.property_name}</p>
          </div>
          <div className="flex py-1">
            <p className="w-[9rem] px-5 text-right mr-10">Space Name</p>
            <p className="flex-1 normal-case">{bookingInfo.space_category}</p>
          </div>
          <div className="flex py-1">
            <p className="w-[9rem] px-5 text-right mr-10">From</p>
            <p className="flex-1 normal-case">{moment(bookingInfo.booking_start_time).format("MM/DD/YY hh:mm a")}</p>
          </div>
          <div className="flex py-1">
            <p className="w-[9rem] px-5 text-right mr-10">Till</p>
            <p className="flex-1 normal-case">{moment(bookingInfo.booking_end_time).format("MM/DD/YY hh:mm a")}</p>
          </div>
          <div className="flex py-1">
            <Link
              to={`/admin/booking_addons?booking_id=${bookingInfo?.id}`}
              target={`_blank`}
              className="w-[9rem] px-5 text-right font-semibold underline"
            >
              View Addons
            </Link>
            <div className="flex-1"></div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex-end ">
          <div className="flex justify-between py-2">
            <div></div>
            <p>
              Status:{" "}
              <span className={`${bookingInfo?.status ? `text-[${selectStatus[bookingInfo?.status]?.color}]` : ""} py-1 text-sm px-4 bg-[#F9FAF8]`}>{selectStatus[bookingInfo?.status]?.value}</span>
            </p>
          </div>
          <div className="border rounded w-full px-8 py-7">
            <div className="mb-5">
              <p className="w-[15rem] font-bold text-xl mb-2">Charges</p>
              <p>Payment method: {bookingInfo?.payment_method?.replaceAll("_", " ")}</p>
            </div>
            <div className="flex py-2 justify-between w-full">
              <p className="">Rate</p>
              <p className="normal-case">&#36;{bookingInfo?.hourly_rate ? bookingInfo.hourly_rate : 0}/h</p>
            </div>
            <div className="flex py-2 justify-between w-full">
              <p className="">Price</p>
              <p className="normal-case">&#36;{bookingInfo?.hourly_rate ? bookingInfo.hourly_rate * (bookingInfo.duration / 3600) : 0}</p>
            </div>
            {addons.map((addon) => (
              <div className="flex py-2 justify-between w-full">
                <p className="normal-case">
                  {addon.name} (x{addon.count})
                </p>
                <p className="normal-case">&#36;{addon.cost * addon.count}</p>
              </div>
            ))}
            <div className="flex py-2 justify-between w-full">
              <p className="">Tax</p>
              <p className="normal-case">&#36;{bookingInfo?.tax ? bookingInfo.tax : 0}</p>
            </div>
            <div className="flex justify-between w-full bg-[#F2F4F7] px-2 py-3">
              <p className="font-bold text-xl">Total</p>
              <p className="normal-case font-bold text-xl">&#36;{bookingInfo?.total ? bookingInfo.total : 0}</p>
            </div>
          </div>
        </div>
      </div>
    </ViewAdminPageLayout>
  );
};

export default ViewAdminBookingPage;
