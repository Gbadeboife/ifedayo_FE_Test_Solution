import { useStripe } from "@stripe/react-stripe-js";
import moment from "moment";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router";
import AddIcon from "@/components/frontend/icons/AddIcon";
import DateTimeIcon from "@/components/frontend/icons/DateTimeIcon";
import Icon from "@/components/Icons";
import MkdSDK from "@/utils/MkdSDK";
import { useBookingContext } from "./bookingContext";
import { formatDate, getDuration } from "@/utils/date-time-utils";
import { GlobalContext, showToast } from "@/globalContext";
import { FavoriteButton, LoadingButton, AddOnCounter } from "@/components/frontend";
import { usePropertyAddons, useTaxAndCommission, useCards } from "@/hooks/api";
import { Link } from "react-router-dom";
import { parseJsonSafely, sleep } from "@/utils/utils";
import MultipleBookingErrorModal from "./MultipleBookingErrorModal";
import { AuthContext, tokenExpireError } from "@/authContext";
import { loadStripe } from "@stripe/stripe-js";
import SelectExistingCardsModal from "@/pages/Customer/Bookings/SelectExistingCardsModal";



const cardIcons = {
  MasterCard: "/mastercard.jpg",
  Visa: "/visa.jpg",
  "American Express": "/american-express.png",
  Discover: "/discover.png",
};
const sdk = new MkdSDK();
const ctrl = new AbortController();
const BOOKING_ERRORS = {
  ERR_MULTIPLE_BOOKING: "You already have a pending booking for this slot!",
};

const BookingPreviewPage = () => {
  localStorage.removeItem("paying");
  const { bookingData, dispatch } = useBookingContext();
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [paymentOptions, setPaymentOptions] = useState(false);
  const bookingDetails = bookingData?.from !== "" ? bookingData : JSON.parse(localStorage.getItem("booking_details"));

  const { register, watch } = useForm();
  const selectedAddons = watch();
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const { cards } = useCards({ loader: false });
  const [errMultipleBooking, setErrMultipleBooking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [existingCardsModal, setExistingCardsModal] = useState(localStorage.getItem("paying") ? true : false);
  const [paymentMethod, setPaymentMethod] = useState();
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(undefined);


  const stripePromise = loadStripe(import.meta.env.VITE_REACT_STRIPE_PUBLIC_KEY);
  if (id != bookingDetails.id) {
    return <Navigate to={`/property/${id}`} />;
  }

  // const handleBooking = async () => {
  //   setLoading(true);
  //   const dateFormat = moment(bookingDetails.selectedDate).format("MM/DD/YY");
  //   const user_id = localStorage.getItem("user");

  //   try {
  //     const result = await sdk.callRawAPI(
  //       "/v2/api/custom/ergo/booking/POST",
  //       {
  //         booked_unit: 1,
  //         booking_start_time: new Date(dateFormat + " " + bookingDetails.from).toISOString(),
  //         booking_end_time: new Date(dateFormat + " " + bookingDetails.to).toISOString(),
  //         commission_rate: Number(commission),
  //         customer_id: Number(user_id),
  //         duration: getDuration(bookingDetails.from, bookingDetails.to) * 3600,
  //         host_id: bookingDetails.host_id,
  //         payment_method: "0",
  //         payment_status: 0,
  //         property_space_id: Number(id),
  //         status: 0,
  //         num_guests: bookingDetails.num_guests - 1,
  //         tax_rate: Number(tax),
  //       },
  //       "POST",
  //       ctrl.signal,
  //     );
  //     // create booking addons

  //     for (const [k, v] of Object.entries(selectedAddons)) {
  //       const property_add_on_id = document.querySelector(`input[name='${k}']`)?.getAttribute("id").replace("cb", "");
  //       if (!property_add_on_id || !v) continue;
  //       sdk.setTable("booking_addons");
  //       await sdk.callRestAPI({ booking_id: result.message, property_add_on_id: Number(property_add_on_id) }, "POST");
  //     }
  //     sendEmailAlert(bookingDetails.host_id, bookingDetails.name, bookingDetails.id);
  //     dispatch({ type: "SET_BOOKING_ID", payload: result.message });
  //     // navigate(`/property/${id}/booking-confirmation`);
  //     navigate(`/account/my-bookings/${result.message}`)

  //   } catch (err) {
  //     tokenExpireError(authDispatch, err.message);
  //     if (err.name == "AbortError") {
  //       setLoading(false);
  //       return;
  //     }
  //     await handleBookingErrors(err);
  //   }
  //   setLoading(false);
  // };

  // async function createPaymentIntent() {
  //   try {
  //     setPaymentMethod(result)
  //   } catch (err) {
  //     tokenExpireError(dispatch, err.message);
  //     globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Failed to create payment intent", message: err.message } });
  //   }
  // }


  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState(null)

  useEffect(() => {
    (async () => {
      if (stripe) {
        const pr = stripe.paymentRequest({
          country: 'US',
          currency: 'usd',
          total: {
            label: 'Booking total',
            amount: Number(total_additional_guest_rate + total_rate + addon_cost),
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        pr.canMakePayment().then(result => {
          if (result) {
            console.log("result", result)
            setPaymentRequest(pr);
          }
        });
      }
    })();
  }, [stripe])

  if (paymentRequest) {
    paymentRequest.on('paymentmethod', async (ev) => {
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );

      if (confirmError) {
        ev.complete('fail');
      }
      else {
        ev.complete('success')
        if (paymentIntent.status === "requires_action") {
          const { error } = await stripe.confirmCardPayment(clientSecret);
          if (error) {
            globalDispatch({
              type: "SHOW_ERROR",
              payload: {
                heading: "Payment failed",
                message: error.message,
              },
            });
          } else {
            await fetchBooking(id)
            globalDispatch({
              type: "SHOW_CONFIRMATION",
              payload: {
                heading: "Payment success",
                message: "Your payment was successful",
                btn: "Ok got it",
              },
            });
          }
        } else {
          await fetchBooking(id);
          globalDispatch({
            type: "SHOW_CONFIRMATION",
            payload: {
              heading: "Payment success",
              message: "Your payment was successful",
              btn: "Ok got it",
            },
          });
        }
      }
    });
  }

  const makePayment = () => {
    if (cards.length > 0) {
      setExistingCardsModal(true)
    } else {
      showToast(globalDispatch, "Please add cards in your billing page", 5000, "ERROR")
    }
  }

  async function handleBookingErrors(err) {
    switch (err.message) {
      case BOOKING_ERRORS.ERR_MULTIPLE_BOOKING:
        setErrMultipleBooking(true);
        break;
      default:
        globalDispatch({
          type: "SHOW_ERROR",
          payload: {
            heading: "Booking Failed",
            message: err.message,
          },
        });
    }
  }

  async function sendEmailAlert(to, property_name, booking_id) {
    try {
      // get receiver preferences
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/get-user", { id: to }, "POST");

      if (parseJsonSafely(result.settings, {}).email_on_space_booked == true) {
        let customer_name = globalState.user.first_name + " " + globalState.user.last_name;
        // get email template
        const tmpl = await sdk.getEmailTemplate("space-booked-alert");
        const body = tmpl.html?.replace(new RegExp("{{{customer_name}}}", "g"), customer_name)
          .replace(new RegExp("{{{property_name}}}", "g"), property_name)
          .replace(new RegExp("{{{booking_id}}}", "g"), booking_id);

        // send email
        await sdk.sendEmail(result.email, tmpl.subject, body);
      }
    } catch (err) {
      console.log("ERROR", err);
    }
  }


  const { tax, commission } = useTaxAndCommission();
  const addons = usePropertyAddons(bookingDetails.property_id);

  const total_rate = bookingDetails.rate * getDuration(bookingDetails.from, bookingDetails.to);
  const total_additional_guest_rate = bookingDetails.additional_guest_rate * getDuration(bookingDetails.from, bookingDetails.to) * (bookingDetails.num_guests - 1);
  const addon_cost = Number(
    Object.entries(selectedAddons)
      .map(([k, v]) => v)
      .reduce((acc, price) => {
        return Number(acc) + (Number(price) ?? 0);
      }, 0),
  );

  return (
    <div className="container mx-auto min-h-screen bg-white px-6 pt-[100px] pb-12 normal-case md:pt-[90px] 2xl:px-16">
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
      <div className="flex flex-col items-start justify-between md:flex-row">
        <div className="w-full md:w-[43%]">
          <h2 className="mb-[20px] text-3xl font-semibold">Review and payment</h2>
          <div className="mb-[40px] flex flex-col gap-[24px] md:flex-row">
            <div
              className="h-[150px] rounded-lg bg-cover bg-center pr-2 md:w-[204px]"
              style={{ backgroundImage: `url(${bookingDetails.url ?? "/default-property.jpg"})` }}
            >
              <FavoriteButton
                space_id={bookingDetails.id}
                user_property_spaces_id={bookingDetails.user_property_spaces_id}
                reRender={null}
              />
            </div>
            <div className="">
              <h3 className="mb-[6px] text-[18px] font-semibold">{bookingDetails.name}</h3>
            </div>
          </div>
          <div className="mb-[12px] flex justify-between">
            <div className="flex gap-[10px]">
              <DateTimeIcon />
              <h4 className="text-lg font-semibold">Date & time</h4>
            </div>
            <button
              className="text-sm font-semibold text-[#475467] underline"
              onClick={() => navigate(-1)}
            >
              Change
            </button>
          </div>
          <div className="mb-[12px] flex justify-between">
            <p>Date</p>
            <p className="font-semibold text-[#344054]"> {formatDate(bookingDetails.selectedDate)}</p>
          </div>
          <div className="mb-[12px] flex justify-between">
            <p>Time</p>
            <p className="font-semibold text-[#344054]">
              {bookingDetails.from} - {bookingDetails.to}
            </p>
          </div>
          <div className="mb-[12px] flex justify-between">
            <p>Duration</p>
            <p className="font-semibold text-[#344054]">{getDuration(bookingDetails.from, bookingDetails.to) + " hours"}</p>
          </div>
          <div className="mt-[40px] mb-[16px] flex gap-[10px]">
            <AddIcon />
            <h4 className="text-lg font-semibold">Add Ons</h4>
          </div>
          {addons.map((addon) => (
            <AddOnCounter
              key={addon.id}
              data={addon}
              register={register}
            />
          ))}
        </div>
        <div className="w-full md:w-[40%]">
          <div className="flex flex-col rounded-md border border-[#33D4B7] p-[20px] md:border-2 md:p-[32px]">
            <h4 className="text-lg mb-4 font-semibold md:text-2xl">Booking summary</h4>

            <hr className="mb-8" />
            <div className="tiny-scroll mb-4 max-h-[200px] overflow-y-auto pb-4 pr-4 md:max-h-[250px]">
              <div className="mb-[12px] flex justify-between">
                <p>Rate</p>
                <p className="font-semibold text-[#344054]">${bookingDetails.rate.toFixed(2)}/h</p>
              </div>
              <div className="mb-[12px] flex justify-between">
                <p>Price</p>
                <p className="font-semibold text-[#344054]"> ${total_rate.toFixed(2)}</p>
              </div>
              {bookingDetails.additional_guest_rate && bookingDetails.num_guests - 1 ? (
                <div className="mb-[12px] flex justify-between">
                  <p>Extra guests</p>
                  <p className="font-semibold text-[#344054]"> ${total_additional_guest_rate.toFixed(2)}</p>
                </div>
              ) : null}
              {Object.entries(selectedAddons).map(([addon_name, price], idx) => {
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
                <p className="font-semibold text-[#344054]"> ${((((total_additional_guest_rate + total_rate) * (bookingDetails?.tax ?? tax)) / 100)).toFixed(2)}</p>
              </div>
              {/* <div className="mb-[12px] flex justify-between">
                <p>Commission</p>
                <p className="font-semibold text-[#344054]"> ${(((total_additional_guest_rate + total_rate + addon_cost) * commission) / 100).toFixed(2)}</p>
              </div> */}
              <div className="mb-[12px] flex justify-between">
                <p>Total</p>
                <p className="font-semibold text-[#344054]"> ${(total_additional_guest_rate + total_rate + addon_cost + (((total_additional_guest_rate + total_rate) * (bookingDetails?.tax ?? tax)) / 100)).toFixed(2)}</p>
              </div>
            </div>
            {/* {!(tax == null || commission == null) && (
              <ReCAPTCHA
                className="recaptcha-v2 mb-2"
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={onChange}
              />
            )} */}

            <LoadingButton
              loading={loading}
              className={`login-btn-gradient mb-[12px] gap-2 rounded-md border border-[#33D4B7] px-2 text-center tracking-wide text-white outline-none focus:outline-none disabled:border-0 ${loading ? "loading py-2" : "py-3"
                }`}
              onClick={() => makePayment()}

              disabled={(tax == null ?? bookingDetails?.tax) || commission == null}
            >
              Make Payment
            </LoadingButton>
            {
              !clientSecret && paymentOptions && (
                <p>Loading...</p>
              )
            }
            {/* {() && (
              <div>
                <div className="flex justify-center gap-4">
                  {cards.length > 0 && (
                    <button
                      className="rounded-lg border py-2 px-6 ring-2 ring-transparent duration-100 hover:border-transparent hover:ring-primary"
                      onClick={() => setExistingCardsModal(true)}
                    >
                      Use existing cards
                    </button>
                  )}

                  <button
                    className="rounded-lg border py-2 px-6 ring-2 ring-transparent duration-100 hover:border-transparent hover:ring-primary"
                    onClick={() => setNewCardPaymentModal(true)}
                  >
                    Pay with new card
                  </button>
                </div>
              </div>
            )} */}
            <p className="text-center text-sm">(funds will be put on hold, pending when host accepts/rejects your booking)</p>
          </div>
          <Link
            to="/help/cancellation-policy"
            target={"_blank"}
            className="mt-[12px] block w-full text-center text-sm text-[#667085] underline"
          >
            Cancellation Policy
          </Link>
        </div>
      </div>

      <SelectExistingCardsModal
        modalOpen={existingCardsModal}
        setConfirmPayment={setConfirmPayment}
        closeModal={() => setExistingCardsModal(false)}
        cards={cards}
        bookingData={bookingDetails}
        selectedAddons={selectedAddons}
        paying={paying}
        setloadingBtn={setLoading}
        setPaying={setPaying}
      />

      <MultipleBookingErrorModal
        modalOpen={errMultipleBooking}
        closeModal={() => setErrMultipleBooking(false)}
        spaceId={id}
      />
    </div>
  );
};

export default BookingPreviewPage;
