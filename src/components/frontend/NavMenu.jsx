import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import { ID_VERIFICATION_STATUSES, IMAGE_STATUS } from "@/utils/constants";
import { Menu, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { useRef } from "react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../Icons";
import LogoutModal from "./LogoutModal";
import MkdSDK from "@/utils/MkdSDK";
import { ChatBubbleBottomCenterIcon } from "@heroicons/react/24/outline";
import { useTour } from "@reactour/tour";

const sdk = new MkdSDK();

export default function NavMenu({ variant }) {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { state: authState, dispatch: authDispatch } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(globalState.unreadMessages);
  const [height, setHeight] = useState(window.innerHeight);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  function switchToHost() {
    authDispatch({ type: "SWITCH_TO_HOST" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a host`,
        btn: "Ok got it",
      },
    });
    navigate("/");
  }

  function switchToAdmin() {
    authDispatch({ type: "SWITCH_TO_ADMIN" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as an admin`,
        btn: "Ok got it",
      },
    });
    navigate("/admin/dashboard");
  }

  function switchToCustomer() {
    authDispatch({ type: "SWITCH_TO_CUSTOMER" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a customer`,
        btn: "Ok got it",
      },
    });
    navigate("/");
  }
  async function fetchUnreadMessagesCount() {
    try {
      const result = await sdk.getMyRoom();
      if (Array.isArray(result.messages)) {
        globalDispatch({
          type: "SET_UNREAD_MESSAGES_COUNT",
          payload: result.messages.filter((msg) => {
            const messageSenderId = JSON.parse(msg.chat).user_id;
            return Number(messageSenderId) != Number(authState.user);
          }).length,
        });
      }

      setUnreadCount(result.messages.filter((msg) => {
        const messageSenderId = JSON.parse(msg.chat).user_id;
        return Number(messageSenderId) != Number(authState.user);
      }).length)
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
    }
  }

  useEffect(() => {
    fetchUnreadMessagesCount();
  }, []);


  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [logoutModal, setLogoutModal] = useState(false);

  function getVerifiedColor(status) {
    switch (status) {
      case ID_VERIFICATION_STATUSES.PENDING:
        return "";
      case ID_VERIFICATION_STATUSES.VERIFIED:
        return "text-green-600";
      case ID_VERIFICATION_STATUSES.REJECTED:
        return "text-red-600";
      default:
        return "text-red-600";
    }
  }

  const { setIsOpen } = useTour()

  const verificationStatuses = ["Pending Verification", "Verified", "Not Verified"];

  return (
    <>
      <div className="z-10 text-black">
        <Menu
          as="div"
          className="relative inline-block text-left"
          ref={menuRef}
        >
          <div>
            <Menu.Button
              className="eighth-step pointer-events-auto relative h-[36px] w-[36px] overflow-hidden rounded-full"
              id="menu-btn"
            >
              <Icon
                type="user"
                fill=""
                variant="circle"
                className={"my-stroke-" + variant}
              />
            </Menu.Button>
          </div>
          <Transition
          as={Fragment}
            show={globalState.menuIconOpen || undefined}
            className="overflow-y-auto"
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className={`absolute hidden-scrollbar ${(height < 720 && height > 560) && "max-h-[500px]"} ${(height < 560) && "max-h-[400px]"} overflow-y-auto right-0 mt-2 w-80 max-w-screen-sm origin-top-right rounded-3xl border bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
              <div className="flex flex-col items-center border-b p-4">
                <img
                  src={globalState.user.is_photo_approved == IMAGE_STATUS.APPROVED ? globalState.user.photo ?? "/default.png" : "/default.png"}
                  className="mb-3 h-[36px] w-[36px] rounded-full object-cover"
                />
                <h3 className="mb-1 font-semibold">
                  {globalState.user.first_name} {globalState.user.last_name}
                </h3>
                <p className="font-thin">You are signed in as {authState.role}</p>
                <span className={getVerifiedColor(globalState.user.verificationStatus)}>{verificationStatuses[globalState.user.verificationStatus] ?? "Not verified"}</span>
              </div>
              <Menu.Item>
                <>
                  <div className={`block border-b px-4 py-2 md:hidden`}>
                    <button
                      onClick={() => navigate("/account/profile")}
                      className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Account & profile
                    </button>
                  </div>
                  <div className="px-4 py-2 md:hidden block">
                    <Link
                      to={"/account/messages"}
                      className={`relative  -mx-3 flex w-full justify-between items-center rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Messages{" "}
                      {globalState.unreadMessages > 0 && (
                        <strong className={`login-btn-gradient flex h-[23px] w-[23px] items-center justify-center rounded-full border p-2 text-xs text-white`}>{globalState.unreadMessages}</strong>
                      )}
                    </Link>
                  </div>
                </>
              </Menu.Item>
              <div className={`hidden border-b px-4 py-2 md:block`}>
                <Menu.Item>
                  <>
                    <Link
                      to={"/account/my-bookings"}
                      className={`-mx-3  flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      My bookings
                    </Link>
                    <Link
                      to={"/account/messages"}
                      className={`relative  -mx-3 flex w-full justify-between items-center rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Messages{" "}
                      {globalState.unreadMessages > 0 && (
                        <strong className={`login-btn-gradient flex h-[23px] w-[23px] items-center justify-center rounded-full border p-2 text-xs text-white`}>{globalState.unreadMessages}</strong>
                      )}
                    </Link>

                    <Link
                      to={"/account/reviews"}
                      className={`-mx-3  flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Reviews
                    </Link>
                    {authState.role == "host" && (
                      <Link
                        to={"/account/my-spaces"}
                        data-tour='first-step-2'
                        className={`-mx-3  flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                      >
                        My Spaces
                      </Link>
                    )}
                    <Link
                      to={"/account/profile"}
                      data-tour="first-step"
                      // data-step={2}
                      className="first-step -mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200"
                    >
                      Profile
                    </Link>

                    <Link
                      to={"/account/payments"}
                      className={`-mx-3  flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Payment
                    </Link>
                    <Link
                      to={"/account/billing"}
                      className={`ninth-step -mx-3  flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Billing
                    </Link>
                  </>
                </Menu.Item>
              </div>
              <div className={`border-t px-4 pt-2 pb-2`}>
                <Menu.Item>
                  <button
                    className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    onClick={() => { globalDispatch({ type: "START_TOUR" }); setIsOpen(true) }}
                  >
                    Help me get started
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <Link
                    to="/faq"
                    className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                  >
                    FAQs
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link
                    to="/favorites"
                    className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                  >
                    Favorites
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  {authState.role == "customer" ? (
                    <>
                      {authState.originalRole != "customer" ? (
                        <button
                          onClick={switchToHost}
                          className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                        >
                          Sign in as host
                        </button>
                      ) : (
                        <Link
                          to={"/become-a-host"}
                          className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                        >
                          Become a host
                        </Link>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={switchToCustomer}
                      className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Sign in as customer
                    </button>
                  )}
                </Menu.Item>
                {["superadmin", "admin"].includes(authState.originalRole) && (
                  <Menu.Item>
                    <button
                      onClick={switchToAdmin}
                      className={`-mx-3 flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    >
                      Sign in as admin
                    </button>
                  </Menu.Item>
                )}
              </div>
              <div className="p-1">
                <Menu.Item>
                  <button
                    className={`flex w-full justify-start rounded-pill p-2 px-3 duration-200 hover:bg-gray-200`}
                    onClick={() => setLogoutModal(true)}
                  >
                    Sign out
                  </button>
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      <LogoutModal
        modalOpen={logoutModal}
        closeModal={() => setLogoutModal(false)}
      />
    </>
  );
}
