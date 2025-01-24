import React, { Fragment, useContext, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useCards } from "@/hooks/api";
import { ExclamationCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import AddCardMethodModal from "@/components/Billing/AddCardMethodModal";
import DeleteCardMethodModal from "@/components/Billing/DeleteCardMethodModal";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import AddPayoutMethodModal from "./AddPayoutMethodModal";
import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import TreeSDK from "@/utils/TreeSDK";

const cardIcons = {
  MasterCard: "/mastercard.jpg",
  Visa: "/visa.jpg",
  "American Express": "/american-express.png",
  Discover: "/discover.png",
};

export default function HostBillingsPage() {
  const [addMethodPopup, setAddMethodPopup] = useState(false);

  const [deleteMethodPopup, setDeleteMethodPopup] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const { cards, changeDefaultCard, fetchCards } = useCards({ loader: true, onCardDelete: () => setDeleteMethodPopup(false) });

  const [addPayoutModal, setAddPayoutModal] = useState(false);
  const { dispatch, state } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [payoutMethods, setPayoutMethods] = useState([]);

  async function fetchPayoutMethods() {
    globalDispatch({ type: "START_LOADING" });
    try {
      const treeSdk = new TreeSDK();
      const result = await treeSdk.getList("payout_method", { join: [], filter: [`deleted_at,is`, `host_id,eq,${state.user}`] });
      if (Array.isArray(result.list)) {
        setPayoutMethods(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
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

  async function deletePayoutMethod(id) {
    globalDispatch({ type: "START_LOADING" });
    try {
      const treeSdk = new TreeSDK();
      await treeSdk.delete("payout_method", id);
      fetchPayoutMethods();
    } catch (err) {
      tokenExpireError(dispatch, err.message);
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
    fetchPayoutMethods();
  }, []);

  return (
    <>
      <div className="min-h-screen pt-[30px] pb-16 normal-case">
        <div>
          <div className="max-w-lg">
            <div className="mb-[12px] flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Payment Method</h2>
              <button
                className="tenth-step text-sm font-semibold underline"
                onClick={() => setAddMethodPopup(true)}
              >
                Add new
              </button>
            </div>
            {cards.map((card) => (
              <div
                className="radio-container mb-[16px] flex rounded-md border px-2 md:px-[16px]"
                key={card.id}
              >
                <div className="border-r py-[26px] pr-[12px]">
                  <label
                    htmlFor={"default" + card.id}
                    className="cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="defaultPaymentMethod"
                      id={"default" + card.id}
                      checked={card.id == card.customer.default_source}
                      value={card.id}
                      onChange={(e) => changeDefaultCard(e.target.value)}
                    />
                    <span></span>
                    <b className="hidden font-normal md:inline">Default</b>
                  </label>
                </div>
                <div className="flex flex-grow items-center justify-between px-3 py-[16px] pr-0 md:px-[18px] md:pr-[18px]">
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
                  <li className="list-none md:list-disc md:font-semibold">{card.last4}</li>
                  <Menu
                    as="div"
                    className="relative max-w-[60px]"
                  >
                    <div className="">
                      <Menu.Button className="inline-flex justify-center px-1 py-3 text-sm font-medium text-gray-700">
                        <EllipsisVerticalIcon className="h-6 w-6" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-0 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            <button
                              onClick={() => {
                                setSelectedCard(card);
                                setDeleteMethodPopup(true);
                              }}
                              className={`inline-flex w-full items-center gap-2 px-4 py-2 text-center text-sm ui-active:bg-gray-100 ui-active:text-gray-900 ui-not-active:text-gray-700`}
                            >
                              <TrashIcon className="h-6 w-6" />
                              Delete
                            </button>
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            ))}
          </div>
          {cards.length == 0 && (
            <div className="flex min-h-[300px] items-center justify-center normal-case text-[#667085]">
              <h2 className="flex gap-3">
                <ExclamationCircleIcon className="h-6 w-6" /> No cards yet
              </h2>
            </div>
          )}
        </div>
        <div className="mt-16">
          <div className="max-w-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Payout Method</h2>
              <button
                className="tenth-step text-sm font-semibold underline"
                onClick={() => setAddPayoutModal(true)}
              >
                Add new
              </button>
            </div>
            <div className="mt-2 mb-4 text-sm text-gray-500">Let us know where you'd like us to send your money</div>
            {payoutMethods.map((card) => (
              <div
                className="radio-container mb-[16px] flex items-center rounded-md border px-2 md:px-[16px]"
                key={card.id}
              >
                <div className="flex flex-grow items-center justify-between px-3 py-[16px] pr-0">
                  <div className="flex w-full flex-col gap-4 text-sm">
                    <div className="flex justify-between">
                      <p>Routing number</p>
                      <p>{card.routing_number}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Account number</p>
                      <p>{card.account_number}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Account holder name</p>
                      <p>{card.account_name}</p>
                    </div>
                  </div>
                  <div className="mr-2"></div>
                  <Menu
                    as="div"
                    className="relative"
                  >
                    <div className="">
                      <Menu.Button className="inline-flex justify-center px-1 py-3 text-sm font-medium text-gray-700">
                        <EllipsisVerticalIcon className="h-6 w-6" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-0 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            <button
                              onClick={() => {
                                deletePayoutMethod(card.id);
                              }}
                              className={`inline-flex w-full items-center gap-2 px-4 py-2 text-center text-sm ui-active:bg-gray-100 ui-active:text-gray-900 ui-not-active:text-gray-700`}
                            >
                              <TrashIcon className="h-6 w-6" />
                              Delete
                            </button>
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AddCardMethodModal
        modalOpen={addMethodPopup}
        closeModal={() => setAddMethodPopup(false)}
        onSuccess={() => fetchCards()}
      />
      <AddPayoutMethodModal
        modalOpen={addPayoutModal}
        closeModal={() => setAddPayoutModal(false)}
        onSuccess={() => fetchPayoutMethods()}
      />
      <DeleteCardMethodModal
        modalOpen={deleteMethodPopup}
        closeModal={() => {
          setSelectedCard({});
          setDeleteMethodPopup(false);
        }}
        onSuccess={() => fetchCards()}
        card={selectedCard}
      />
    </>
  );
}
