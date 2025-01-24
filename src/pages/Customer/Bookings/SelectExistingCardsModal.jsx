import { AuthContext, tokenExpireError } from "@/authContext";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { LoadingButton } from "@/components/frontend";
import MkdSDK from "@/utils/MkdSDK";
import { useLocation, useNavigate, useParams } from "react-router";
import moment from "moment";
import { showToast } from "@/globalContext";
import { addOneHour } from "@/utils/utils";
import axios from "axios";

const stripeKey = import.meta.env.VITE_REACT_STRIPE_PUBLIC_KEY;

const cardIcons = {
  MasterCard: "/mastercard.jpg",
  Visa: "/visa.jpg",
  "American Express": "/american-express.png",
  Discover: "/discover.png",
};

export default function SelectExistingCardsModal({ setPaying, setConfirmPayment, setloadingBtn, selectedAddons, bookingData, modalOpen, closeModal, onSuccess, cards, booking_id }) {
  const { dispatch: authDispatch, state: authState } = useContext(AuthContext);
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const [cardSelected, setCardSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectData, setRedirectData] = useState(null);
  const location = useLocation();
  const { id } = useParams();
  const user_id = localStorage.getItem("user");
  const navigate = useNavigate()
  const sdk = new MkdSDK();

  async function payBooking() {
    localStorage.setItem("card", JSON.stringify(selectedCard))
    try {
      const dateFormat = moment(bookingData.selectedDate).format("MM/DD/YY");
      let addons = []
      if (!cardSelected) {
        showToast(globalDispatch, "Please select a card to proceed", 5000, "ERROR")
        setLoading(false);
      } else {
        setLoading(true);
        localStorage.setItem("paying", true);
        for (const [k, v] of Object.entries(selectedAddons)) {
          const property_add_on_id = document.querySelector(`input[name='${k}']`)?.getAttribute("id").replace("cb", "");
          if (typeof v === "string") {
            addons.push(Number(property_add_on_id))
          }
        }
        localStorage.setItem("addons", JSON.stringify(addons))
        const result = await sdk.callRawAPI(`/v2/api/custom/ergo/pay-hold`, {
          "payment_method": selectedCard?.id,
          "stripe_uid": selectedCard?.customer.id,
          "booking_start_time": new Date(dateFormat + " " + bookingData.from).toISOString().slice(0, 19).replace("T", " "),
          "booking_end_time": new Date(dateFormat + " " + bookingData.to).toISOString().slice(0, 19).replace("T", " "),
          "customer_id": Number(user_id),
          "host_id": bookingData.host_id,
          "property_space_id": Number(id),
          "num_guests": bookingData.num_guests,
          "booking_addons": addons

        }, "POST");

        // Create the Axios request configuration
        const axiosConfig = {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        };

        // Construct the request data
        const requestData = new URLSearchParams();
        requestData.append('payment_method', selectedCard?.id);
        requestData.append('client_secret', result?.payment_intent?.client_secret);
        requestData.append('return_url', `https://ergo.mkdlabs.com/property/${id}/booking-preview`);

        if (result.message === "Action required!") {
          await axios.post(`https://api.stripe.com/v1/payment_intents/${result?.payment_intent?.id}/confirm`, requestData, axiosConfig).then(async (response) => {
            if (response.error) {
              globalDispatch({
                type: "SHOW_ERROR",
                payload: {
                  message: response.error?.message ? response.error?.message : response?.trace?.raw?.message,
                },
              })
              setLoading(false);
            } else {
              if (response?.data?.next_action !== null) {
                window.location.replace(response?.data?.next_action?.redirect_to_url?.url)
              } else {
                const second_result = await sdk.callRawAPI(`/v2/api/custom/ergo/pay-hold`, {
                  "payment_method": selectedCard?.id,
                  "stripe_uid": selectedCard?.customer.id,
                  "booking_start_time": new Date(dateFormat + " " + bookingData.from).toISOString().slice(0, 19).replace("T", " "),
                  "booking_end_time": new Date(dateFormat + " " + bookingData.to).toISOString().slice(0, 19).replace("T", " "),
                  "customer_id": Number(user_id),
                  "host_id": bookingData.host_id,
                  "property_space_id": Number(id),
                  "num_guests": bookingData.num_guests,
                  "booking_addons": addons,
                  "payment_intent": result?.payment_intent?.id

                }, "POST");
                if (!second_result.error) {
                  // Show your customer that the payment has succeeded
                  closeModal();
                  globalDispatch({
                    type: "SHOW_CONFIRMATION", payload: {
                      heading: "Payment, awaiting Host Approval", message: "Booking successful", btn: "OK", onClose: () => navigate("/account/my-bookings")
                    }
                  });
                  setLoading(false);
                  setloadingBtn(false);
                }
              }
            }
          })
        }
      }
    } catch (error) {
      setLoading(false);
      tokenExpireError(authDispatch, error.message);
      showToast(globalDispatch, error?.response?.data ? error?.response?.data?.error?.message : error?.message, "5000", "ERROR")
      setLoading(false);
      localStorage.removeItem("paying");
    }
  }

  useEffect(() => {
    // Function to parse query 
    const getQueryParams = (search) => {
      return search
        .slice(1)
        .split('&')
        .reduce((acc, current) => {
          const [key, value] = current.split('=');
          acc[key] = decodeURIComponent(value);
          return acc;
        }, {});
    };
    // Check if there are query parameters in the URL
    if (location.search) {
      const queryParams = getQueryParams(location.search);

      // Check if the query parameters contain Stripe redirect data
      if (queryParams.payment_intent) {
        setloadingBtn(true)
        // Create the Axios request configuration
        const axiosConfig = {
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        };

        const requestData = new URLSearchParams();
        requestData.append('client_secret', queryParams?.payment_intent_client_secret);

        // Parse and set the redirect data
        axios.get(`https://api.stripe.com/v1/payment_intents/${queryParams?.payment_intent}?client_secret=${queryParams?.payment_intent_client_secret}`, axiosConfig)
          .then(async (response) => {
            if (response.status !== 200) {
              // PaymentIntent client secret was invalid
              showToast(globalDispatch, "Payment Unsuccessful", "5000", "ERROR")
              setLoading(false);
            } else {
              const dateFormat = moment(bookingData.selectedDate).format("MM/DD/YY");
              const cardDetails = JSON.parse(localStorage.getItem("card"));
              const addons = JSON.parse(localStorage.getItem("addons"));
              if (response.data.status === 'requires_capture') {
                const result = await sdk.callRawAPI(`/v2/api/custom/ergo/pay-hold`, {
                  "payment_method": cardDetails?.id,
                  "stripe_uid": cardDetails?.customer.id,
                  "booking_start_time": new Date(dateFormat + " " + bookingData.from).toISOString().slice(0, 19).replace("T", " "),
                  "booking_end_time": new Date(dateFormat + " " + bookingData.to).toISOString().slice(0, 19).replace("T", " "),
                  "customer_id": Number(user_id),
                  "host_id": bookingData.host_id,
                  "property_space_id": Number(id),
                  "num_guests": bookingData.num_guests,
                  "booking_addons": addons,
                  "payment_intent": queryParams?.payment_intent

                }, "POST");
                console.log(result)
                if (!result.error) {
                  // Show your customer that the payment has succeeded
                  closeModal();
                  globalDispatch({
                    type: "SHOW_CONFIRMATION", payload: {
                      heading: "Payment, awaiting Host Approval", message: "Booking successful", btn: "OK", onClose: () => navigate("/account/my-bookings")
                    }
                  });
                  setLoading(false);
                  setloadingBtn(false);
                }
              }
            }
          })
        const redirectData = queryParams;
        setRedirectData(redirectData);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [location.search]);


  return (
    <Transition
      appear
      show={modalOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-medium leading-6 text-gray-900"
                >
                  Select Card
                </Dialog.Title>
                <div className="mt-4"></div>
                {cards.map((card) => (
                  <div
                    className={`mb-[16px] flex cursor-pointer rounded-md border px-[16px] ${selectedCard.id === card.id ? "border-transparent ring-2 ring-primary-dark ring-offset-2" : ""}`}
                    key={card.id}
                    onClick={() => { setSelectedCard(card); setCardSelected(true) }}
                  >
                    <div className="flex flex-grow items-center justify-between px-[18px] py-[16px]">
                      <div className="h-[36px] w-[51px]">
                        <img
                          src={cardIcons[card.brand]}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex h-full flex-col justify-between text-sm">
                        <p className="font-semibold">Credit card</p>
                        <small className="text-xs">
                          Expires: {card.exp_month}/{card.exp_year}
                        </small>
                      </div>
                      <li className="font-semibold">{card.last4}</li>
                    </div>
                  </div>
                ))}
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    className="inline-flex w-1/2 justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={() => { closeModal(); setLoading(false) }}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    loading={loading}
                    onClick={payBooking}
                    className={`inline-flex w-1/2 justify-center rounded-md ${loading ? "py-1 px-6" : "py-2 px-4"} login-btn-gradient text-sm font-medium text-white`}
                  >
                    Pay
                  </LoadingButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
