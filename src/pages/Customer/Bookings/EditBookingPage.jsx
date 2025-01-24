import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import DateTimeIcon from "@/components/frontend/icons/DateTimeIcon";
import Icon from "@/components/Icons";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { formatAMPM, fullMonthsMapping, getDuration } from "@/utils/date-time-utils";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import FavoriteButton from "@/components/frontend/FavoriteButton";
import useSchedulingData from "@/hooks/api/useSchedulingData";
import Counter from "@/components/frontend/Counter";
import DateTimePicker from "@/components/frontend/DateTimePicker";
import useTaxAndCommission from "@/hooks/api/useTaxAndCommission";
import LoadingButton from "@/components/frontend/LoadingButton";
import AddIcon from "@/components/frontend/icons/AddIcon";
import usePropertyAddons from "@/hooks/api/usePropertyAddons";
import AddonCounterV2 from "@/components/frontend/AddonCounterV2";
import MkdSDK from "@/utils/MkdSDK";
import moment from "moment";
import { BOOKING_STATUS } from "@/utils/constants";
import { AuthContext, tokenExpireError } from "@/authContext";

const sdk = new MkdSDK();
const ctrl = new AbortController();

export default function EditBookingPage() {
  const { id: booking_id } = useParams();
  const navigate = useNavigate();

  const { register, watch, handleSubmit, setValue } = useForm({ defaultValues: { selectedAddons: [] } });
  const formValues = watch();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [booking, setBooking] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  const { tax, commission } = useTaxAndCommission();
  const { bookedSlots, scheduleTemplate } = useSchedulingData({ property_space_id: booking.property_space_id });
  const addons = usePropertyAddons(booking.property_id);

  const [showCharges, setShowCharges] = useState(false);

  async function fetchBooking() {
    globalDispatch({ type: "START_LOADING" });
    const where = [`ergo_booking.id = ${booking_id} AND ergo_booking.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/booking/details", { where }, "POST", ctrl.signal);
      setBooking(result.list ?? {});
      setValue("from", formatAMPM(result.list.booking_start_time));
      setValue("to", formatAMPM(result.list.booking_end_time));
      setValue("selectedDate", new Date(result.list.booking_start_time));
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") {
        globalDispatch({ type: "STOP_LOADING" });
        return;
      }
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  useEffect(() => {
    fetchBooking();
  }, []);

  useEffect(() => {
    if (addons.length > 0 && booking.property_space_id) {
      setValue(
        "selectedAddons",
        booking.add_ons.map((addon) => addon.name),
      );
    }
  }, [addons.length, booking]);

  async function onSubmit(data) {
    console.log("submitting ", data);

    setLoading(true);
    const dateFormat = moment(data.selectedDate).format("MM/DD/YY");
    const user_id = localStorage.getItem("user");
    try {
      await sdk.callRawAPI(
        "/v2/api/custom/ergo/booking/PUT",
        {
          id: booking.id,
          booked_unit: 1,
          booking_start_time: new Date(dateFormat + " " + data.from).toISOString(),
          booking_end_time: new Date(dateFormat + " " + data.to).toISOString(),
          commission_rate: Number(commission),
          customer_id: Number(user_id),
          duration: getDuration(data.from, data.to) * 3600,
          host_id: booking.host_id,
          payment_status: 0,
          property_space_id: Number(booking.property_space_id),
          status: 0,
          num_guests: data.num_guests - 1,
          tax_rate: Number(tax ?? booking?.tax),
        },
        "POST",
        ctrl.signal,
      );

      // get addons to delete and addons to create
      let addons_to_delete = booking.add_ons.filter((addon) => !data.selectedAddons.includes(addon.name)).map((addon) => addon.booking_addons_id);
      let addons_to_create = addons
        .filter((addon) => data.selectedAddons.includes(addon.add_on_name) && !booking.add_ons.map((addon) => addon.name).includes(addon.add_on_name))
        .map((addon) => addon.id);

      sdk.setTable("booking_addons");
      for (const delete_id of addons_to_delete) {
        const deleteResult = await sdk.callRestAPI({ id: delete_id }, "DELETE");
        console.log("deleteResult", deleteResult);
      }

      for (const property_add_on_id of addons_to_create) {
        await sdk.callRestAPI({ booking_id: booking.id, property_add_on_id }, "POST");
      }
      navigate(`/account/my-bookings/${booking.id}`);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Edit Booking Failed",
          message: err.message,
        },
      });
    }

    // notify host
    if (booking.status == BOOKING_STATUS.UPCOMING) {
      const r = await sdk.sendEmail(booking.host_email, "Booking Changed", `The structure for this email will be changed shortly`);
    }
  }
  const bookingStartDate = new Date(formValues.selectedDate);

  if (!booking.id) return null;

  return (
    <div
      className="container mx-auto min-h-screen bg-white px-6 normal-case 2xl:px-16"
      onClick={() => setShowCalendar(false)}
    >
      <button
        className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center font-semibold"
        onClick={() => navigate(-1)}
      >
        <Icon
          type="arrow"
          variant="narrow-left"
          className="h-4 w-4 stroke-[#667085]"
        />{" "}
        <span className="ml-2">Back</span>
      </button>
      <h2 className="mb-[20px] text-3xl font-semibold">Edit Booking</h2>
      <div className="flex flex-col items-start justify-between md:flex-row">
        <div className="w-full md:w-[43%]">
          <div className="mb-[40px] flex flex-col gap-[24px] md:flex-row">
            <div
              className="h-[150px] rounded-lg bg-cover bg-center pr-2 md:w-[204px]"
              style={{ backgroundImage: `url(${booking.image_url ?? "/default-property.jpg"})` }}
            >
              <FavoriteButton
                space_id={booking.property_space_id}
                user_property_spaces_id={null}
                reRender={null}
              />
            </div>
            <div className="">
              <h3 className="mb-[6px] text-[18px] font-semibold">{booking.property_name}</h3>
              <p className="mb-[6px] text-[#475467]">{booking.address_line_1}</p>
              <p className="mb-[6px] text-[#475467]">{booking.city + ", " + booking.address_line_2}</p>
            </div>
          </div>
          <div className="mb-[12px] flex justify-between">
            <div className="flex gap-[10px]">
              <DateTimeIcon />
              <h4 className="text-lg font-semibold">Date & time</h4>
            </div>
          </div>
          <div className="mb-[12px] flex justify-between">
            <p>Date</p>
            <p className="font-semibold text-[#344054]">
              {" "}
              {(bookingStartDate instanceof Date ? fullMonthsMapping[bookingStartDate.getMonth()] : "") + " " + bookingStartDate.getDate() + "/" + bookingStartDate.getFullYear()}
            </p>
          </div>
          <div className="mb-[12px] flex justify-between">
            <p>Time</p>
            <p className="font-semibold text-[#344054]">
              {formValues.from} - {formValues.to}
            </p>
          </div>
          <div className="mb-[12px] flex justify-between">
            <p>Duration</p>
            <p className="font-semibold text-[#344054]">{getDuration(formValues.from, formValues.to)} hour(s)</p>
          </div>
          <div className="mt-[40px] mb-[16px] flex gap-[10px]">
            <AddIcon />
            <h4 className="text-lg font-semibold">Add Ons</h4>
          </div>
          {addons.map((addon) => {
            return (
              <AddonCounterV2
                key={addon.id}
                data={addon}
                register={register}
                name="selectedAddons"
              />
            );
          })}
        </div>

        <div className={`${showCharges ? "hidden" : "block"} sticky-price-summary ml-auto w-full bg-white p-4 md:w-[473px] md:border md:p-[32px]`}>
          <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Max capacity</span>
            <span>
              {" "}
              <strong className="font-semibold">{booking.max_capacity}</strong> people
            </span>
          </div>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Pricing from</span>
            <span>
              from: <strong className="font-semibold">${booking.rate}</strong>/h
            </span>
          </div>

          <div className="flex flex-col">
            <div className="mb-[13px] flex items-center justify-between">
              <span className="text-lg">Number of guests</span>
              <Counter
                register={register}
                name="num_guests"
                setValue={setValue}
                initialValue={(booking.num_guests ?? 0) + 1}
                maxCount={booking.max_capacity}
              />
            </div>
            <hr className="mb-[24px] hidden md:block" />
            <div className="z-50 mb-3">
              <DateTimePicker
                register={register}
                setValue={setValue}
                fieldNames={["selectedDate", "from", "to"]}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                fromDefault={formatAMPM(booking.booking_start_time)}
                toDefault={formatAMPM(booking.booking_end_time)}
                bookedSlots={bookedSlots.map((slot) => ({ fromTime: new Date(slot.start_time), toTime: new Date(slot.end_time) }))}
                scheduleTemplate={scheduleTemplate}
                defaultDate={bookingStartDate}
              />
            </div>
            <button
              type="button"
              id="proceed-to-preview"
              className="login-btn-gradient gap-2 rounded-tr rounded-br py-3 px-2 text-center tracking-wide text-white outline-none focus:outline-none"
              disabled={(() => {
                const el = document.getElementById("booking-time");
                return !(el && !el.innerText.includes("Select"));
              })()}
              onClick={() => setShowCharges(true)}
            >
              Proceed
            </button>
          </div>
        </div>
        <form
          className={`${showCharges ? "block" : "hidden"} fadeIn w-full md:w-[40%]`}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col rounded-sm border-2 border-[#33D4B7] p-[12px] pb-0 md:p-[32px]">
            <div className="mb-[16px] flex justify-between text-[#101828]">
              <h4 className="text-2xl font-semibold">Charges</h4>
            </div>
            <div className="tiny-scroll mb-2 max-h-[200px] overflow-y-auto pr-3">
              <div className="mb-[12px] flex justify-between">
                <p>Rate</p>
                <p className="font-semibold text-[#344054]">${booking.rate.toFixed(2)}/h</p>
              </div>
              <div className="mb-[12px] flex justify-between">
                <p>Price</p>
                <p className="font-semibold text-[#344054]"> ${(booking.rate * getDuration(formValues.from, formValues.to)).toFixed(2)}</p>
              </div>
              {formValues.selectedAddons.map((addon_name, idx) => {
                let price = addons.find((addon) => addon.add_on_name == addon_name)?.cost;
                if (!price) return null;
                return (
                  <div
                    className="mb-[12px] flex justify-between"
                    key={idx}
                  >
                    <p>{addon_name}</p>
                    <p className="font-semibold text-[#344054]"> ${Number(price).toFixed(2)}</p>
                  </div>
                );
              })}
              <div className="mb-[12px] flex justify-between">
                <p>Tax</p>
                <p className="font-semibold text-[#344054]"> ${Number((booking.rate * getDuration(formValues.from, formValues.to) * tax) / 100).toFixed(2)}</p>
              </div>
              <div className="mb-[12px] flex justify-between">
                <p>Total</p>
                <p className="font-semibold text-[#344054]">
                  {" "}
                  $
                  {(
                    Number(
                      addons.reduce((acc, curr) => {
                        if (!formValues.selectedAddons.includes(curr.add_on_name)) return acc;
                        return Number(acc) + (Number(curr.cost) ?? 0);
                      }, 0),
                    ) +
                    Number((booking.rate * getDuration(formValues.from, formValues.to) * tax) / 100) +
                    Number(booking.rate * getDuration(formValues.from, formValues.to))
                  ).toFixed(2)}
                </p>
              </div>
            </div>
            <LoadingButton
              type="submit"
              loading={loading}
              className={`login-btn-gradient mb-[12px] gap-2 rounded-tr rounded-br px-2 text-center tracking-wide text-white outline-none focus:outline-none ${loading ? "loading py-2" : "py-3"}`}
              disabled={tax == null || commission == null}
            >
              Save
            </LoadingButton>
            <p className="text-center text-sm">(Note: this will affect the rates)</p>
          </div>
          <a
            href="/"
            className="mt-[12px] block text-center text-sm text-[#667085] underline"
          >
            Cancellation Policy
          </a>
        </form>
      </div>
    </div>
  );
}
