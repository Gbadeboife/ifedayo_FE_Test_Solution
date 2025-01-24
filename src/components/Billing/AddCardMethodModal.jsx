import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { Fragment, useState } from "react";
import { useContext } from "react";
import { LoadingButton } from "../frontend";

export default function AddCardMethodModal({ modalOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const sdk = new MkdSDK();
  const [ctrl] = useState(new AbortController());

  const addNewCard = async (e) => {
    setLoading(true);
    e.preventDefault();
    // create stripe token
    try {
      const cardNum = elements.getElement("cardNumber");
      const result = await stripe.createToken(cardNum).then(async (r) => {
        if (r.error) {
          globalDispatch({
            type: "SHOW_ERROR",
            payload: {
              message: r.error?.message ? r.error?.message : r?.trace?.raw?.message,
            },
          });
        } else {
          await sdk.createCustomerStripeCard({ sourceToken: r ? r.token.id : result.token.id }, ctrl.signal);
          closeModal();
          onSuccess();
        }
      }
      );
    } catch (error) {
      if (error.name == "AbortError") {
        setLoading(false);
        return;
      }
      console.log(error)
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          message: error?.message ? error?.message : "Declined",
        },
      });
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Add Modal UI here to allow card to be created */}
    </div>
  );
}
