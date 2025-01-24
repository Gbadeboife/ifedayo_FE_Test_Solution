import { AuthContext } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import React, { useState, useEffect, useContext } from "react";

export default function useCards({ loader, onCardDelete }) {
  const [cards, setCards] = useState([]);
  const [defaultCard, setDefaultCard] = useState({});
  const sdk = new MkdSDK();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { state: authState } = useContext(AuthContext);

  async function fetchCards() {
    if (loader) {
      globalDispatch({ type: "START_LOADING" });
    }
    try {
      const result = await sdk.getCustomerStripeCards();
      if (Array.isArray(result.data?.data)) {
        setCards(result.data.data);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Unable to get payment methods",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  async function changeDefaultCard(cardId) {
    if (loader) {
      globalDispatch({ type: "START_LOADING" });
    }
    try {
      await sdk.setStripeCustomerDefaultCard(cardId);
      fetchCards();
    } catch (err) {
      // globalDispatch({
      //   type: "SHOW_ERROR",
      //   payload: {
      //     heading: "Operation failed",
      //     message: err.message,
      //   },
      // });
      globalDispatch({ type: "STOP_LOADING" });
    }
  }

  async function deleteCard(cardId) {
    if (loader) {
      globalDispatch({ type: "START_LOADING" });
    }

    try {
      await sdk.deleteCustomerStripeCard(cardId);
      if (onCardDelete) {
        onCardDelete();
      }
      fetchCards();
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
      globalDispatch({ type: "STOP_LOADING" });
    }
  }

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      var found = cards.find((card) => card.id == card.customer.default_source);
      setDefaultCard(found || {});
    }
  }, [cards]);

  return { cards, defaultCard, changeDefaultCard, fetchCards, deleteCard };
}
