import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { Fragment, useState, useContext } from "react";
import { LoadingButton } from "../frontend";

export default function AddCardMethodModal({ modalOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardholderName: "",
  });
  const [errors, setErrors] = useState({});
  
  const stripe = useStripe();
  const elements = useElements();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const sdk = new MkdSDK();
  const [ctrl] = useState(new AbortController());

  const addNewCard = async (e) => {
    e.preventDefault();
    
    // Validate form before proceeding
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return; // Don't proceed if there are validation errors
    }
    
    setLoading(true);
    
    try {
      const cardNum = elements.getElement(CardNumberElement);
      const result = await stripe.createToken(cardNum);
      
      if (result.error) {
        globalDispatch({
          type: "SHOW_ERROR",
          payload: {
            message: result.error?.message || "Card validation failed",
          },
        });
      } else {
        await sdk.createCustomerStripeCard(
          { sourceToken: result.token.id }, 
          ctrl.signal
        );
        
        // Reset form
        setFormData({
          cardholderName: "",
        });
        setErrors({});
        
        closeModal();
        onSuccess();
        
        globalDispatch({
          type: "SHOW_SUCCESS",
          payload: {
            message: "Card added successfully",
          },
        });
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setLoading(false);
        return;
      }
      
      console.log(error);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          message: error?.message || "Failed to add card",
        },
      });
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate cardholder name
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    } else if (formData.cardholderName.trim().length < 2) {
      newErrors.cardholderName = "Name must be at least 2 characters";
    }

    return newErrors;
  };

  return (
    <Transition appear show={modalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="mb-4 text-lg font-medium leading-6 text-gray-900">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Add Payment Card
                  </div>
                </Dialog.Title>
                
                <p className="mb-6 text-sm text-gray-600">
                  Enter your card details to add a new payment method.
                </p>

                <form onSubmit={addNewCard} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                      Cardholder Name
                    </label>
                    <input
                      id="cardholderName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cardholderName ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.cardholderName && (
                      <p className="mt-1 text-xs text-red-500">{errors.cardholderName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Card Number
                    </label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <CardNumberElement
                        options={{
                          style: {
                            base: {
                              fontSize: '14px',
                              color: '#374151',
                              '::placeholder': {
                                color: '#9CA3AF',
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Expiry Date
                      </label>
                      <div className="px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <CardExpiryElement
                          options={{
                            style: {
                              base: {
                                fontSize: '14px',
                                color: '#374151',
                                '::placeholder': {
                                  color: '#9CA3AF',
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        CVC
                      </label>
                      <div className="px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <CardCvcElement
                          options={{
                            style: {
                              base: {
                                fontSize: '14px',
                                color: '#374151',
                                '::placeholder': {
                                  color: '#9CA3AF',
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={closeModal}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <LoadingButton
                      type="submit"
                      loading={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Card
                    </LoadingButton>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
