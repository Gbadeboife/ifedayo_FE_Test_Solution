import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext } from "@/authContext";
import { oauthLoginApi } from "@/utils/callCustomAPI";
import LoadingButton from "@/components/frontend/LoadingButton";
import Icon from "@/components/Icons";
import SuggestPasswordChangeModal from "./SuggestPasswordChangeModal";
import SuggestResendVerificationModal from "./SuggestResendVerificationModal";
import { GlobalContext, showToast } from "@/globalContext";
import axios from "axios";
const sdk = new MkdSDK();

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "customer";
  const [hideDownloadButton, setHideDownloadButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const schema = yup.object({
    email: yup.string().email("Email must be valid").required("Email is required"),
    password: yup.string().required("Password is required"),
  });

  const { dispatch: authDispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [showPassword, setShowPassword] = React.useState(false);
  const [suggestPasswordChange, setSuggestPasswordChange] = React.useState(false);
  const [suggestResendVerification, setSuggestResendVerification] = React.useState(false);
  const [inCorrectPasswordCount, setInCorrectPasswordCount] = React.useState(0);
  const [disableEmails, setDisableEmails] = React.useState([]);
  const [disableLogin, setDisableLogin] = React.useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [located, setLocated] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const email = watch("email");

  const checkParams = () => {
    if (searchParams.get('error')) {
      showToast(dispatch, searchParams.get('message'), 5000, "error")
      navigate("/login")
    }
  }

  useEffect(() => {
    let setter;
    if (!setter) {
      checkParams()
    }
    return () => {
      setter = true
    }
  }, [])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);


  const handleGoogleLogin = async () => {
    try {
      const result = await sdk.oauthLoginApi("google", role);
      const data = (searchParams.get("oauth"))
      window.open(result, "_self");
    } catch (error) {
      console.log(error)
      showToast(authDispatch, error.message)
    }
  };
  const handleFacebookLogin = async () => {
    const data = (JSON.parse(searchParams.get("oauth")))
    try {
      const result = await sdk.oauthLoginApi("facebook", role);
      window.open(result, "_self");
    } catch (error) {
      console.log(error)
      showToast(authDispatch, error.message)
    }
  };
  const handleAppleLogin = async () => {
    try {
      const result = await sdk.oauthLoginApi("apple", role);
      window.open(result, "_self");
    } catch (error) {
      console.log(error)
    }
  };

  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };
  function success(pos) {
    var crd = pos.coords;
    setLatitude(crd.latitude);
    setLongitude(crd.longitude);
    setLocated(true)
  }

  const handleDownloadNowClick = () => {
    console.log(deferredPrompt)
    if (deferredPrompt) {
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
      });

      setDeferredPrompt(null);
    }
  };

  function _errors(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  // useEffect(() => {
  //   if (navigator && navigator?.geolocation && navigator?.geolocation) {
  //     navigator?.permissions
  //       .query({ name: "geolocation" })
  //       .then(function (result) {
  //         if (result.state === "granted") {
  //           //If granted then you can directly call your function here
  //           showToast(globalDispatch, "Access to location is granted");
  //           navigator.geolocation.getCurrentPosition(success, _errors, options);
  //         } else if (result.state === "prompt") {
  //           //If prompt then the user will be asked to give permission
  //           // showToast(globalDispatch, "Access to location needs to be granted");
  //           navigator.geolocation.getCurrentPosition(success, _errors, options);
  //           globalDispatch({
  //             type: "SHOW_ERROR",
  //             payload: {
  //               heading: "Location Access",
  //               message: "Access to location needs to be granted",
  //             },
  //           });
  //         } else if (result.state === "denied") {
  //           //If denied then you have to show instructions to enable location
  //           // showToast(globalDispatch, "Access to location is denied");
  //           globalDispatch({
  //             type: "SHOW_ERROR",
  //             payload: {
  //               heading: "Location Access",
  //               message: "Access to location needs to be granted",
  //             },
  //           });
  //         }
  //       }).catch(error => {
  //         globalDispatch({
  //           type: "SHOW_ERROR",
  //           payload: {
  //             heading: "Location Access",
  //             message: "Access to location needs to be granted",
  //           },
  //         });
  //       });
  //   } else {
  //     // console.log("Geolocation is not supported by this browser.");
  //     globalDispatch({
  //       type: "SHOW_ERROR",
  //       payload: {
  //         heading: "Location Access",
  //         message: "Geolocation is not supported by this browser.",
  //       },
  //     });
  //   }
  // }, [])


  const onSubmit = async (data) => {

    // if (located || !located) {
    try {
      // const response = await axios.get(
      //   `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`
      // );

      // const addressComponents = response.data.results[0]?.address_components;
      // const state = addressComponents.find(
      //   component => component.types.includes('administrative_area_level_1')
      // );

      // if (["Florida", "California", "New York", "Lagos", "Islamabad", "Rawalpindi"].includes(state.long_name)) {
      setLocationInfo('Location Granted.');
      try {
        const result = await sdk.customLogin(data);
        if (!result.error) {
          authDispatch({ type: "LOGIN", payload: { ...result, originalRole: result.role } });
          if (["superadmin", "admin"].includes(result.role)) {
            navigate(searchParams.get("redirect_uri") ?? "/admin/dashboard");
          } else {
            navigate(searchParams.get("redirect_uri") ?? "/");
          }
        }
      } catch (err) {
        if (err.message == "Your account is inactive" || err.message == "This email is not registered") {
          setDisableEmails((prev) => {
            const copy = [...prev, data.email.toLowerCase()];
            return copy;
          });
          setDisableLogin(true);
        }
        if (err.message == "Your email is not verified") {
          setSuggestResendVerification(true);
        }
        if (err.message == "Invalid Password") {
          setInCorrectPasswordCount((prev) => prev + 1);
        } else {
          setInCorrectPasswordCount(0);
        }
        setError("email", {
          type: "manual",
          message: err.message,
        });
        if (inCorrectPasswordCount >= 3) {
          setSuggestPasswordChange(true);
        }
      }
      // } else {
      //   setLocationInfo('Location Denied.');
      //   globalDispatch({
      //     type: "SHOW_ERROR",
      //     payload: {
      //       heading: "Location Denied",
      //       message: "Access to site is only allowed for Florida, California and New York Residents",
      //     },
      //   });
      // }
    } catch (error) {
      console.error('Error fetching location information', error);
      // setDisableLogin(true);
    };

    // }


  };

  return (
    <div>
      <header className="absolute top-0 left-0 pt-4 pl-6 md:pl-16">
        <Link to="/">
          <Icon
            type="logo"
            fill="fill-[#101828]"
          />
        </Link>
      </header>
      <div className="flex justify-center w-full min-h-screen">
        <section className="flex flex-col items-center justify-center w-full bg-white md:w-1/2">
          <form
            className="flex flex-col w-full max-w-md px-6"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
          >
            <h1 className="mb-8 text-3xl font-semibold text-center md:text-5xl md:font-bold">Log In</h1>
            <input
              type="text"
              autoComplete="off"
              className="p-2 px-4 mb-8 bg-transparent border-2 rounded-sm resize-none focus:outline-none active:outline-none"
              {...register("email", {
                onChange: (e) => {
                  if (disableEmails.includes(e.target.value.toLowerCase())) {
                    setDisableLogin(true);
                  } else {
                    setDisableLogin(false);
                  }
                },
              })}
              placeholder="Email"
            />
            <div className="relative flex items-center justify-between mb-4 bg-transparent border-2 rounded-sm">
              <input
                autoComplete={showPassword ? "off" : "new-password"}
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="flex-grow p-2 px-4 border-0 focus:outline-none active:outline-none "
                placeholder="Password"
              />{" "}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1"
              >
                {" "}
                {showPassword ? (
                  <img
                    src="/show.png"
                    alt=""
                    className="w-6 m-2"
                  />
                ) : (
                  <img
                    src="/invisible.png"
                    alt=""
                    className="w-6 m-2"
                  />
                )}
              </button>
            </div>
            <Link
              to={"/request-reset?role=" + role}
              className="self-end mb-6 text-sm font-semibold my-text-gradient"
            >
              Forgot Password
            </Link>
            {isDirty && Object.entries(errors).length > 0 ? (
              <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{Object.values(errors)[0].message}</p>
            ) : (
              <></>
            )}

            <LoadingButton
              disabled={disableLogin}
              loading={isSubmitting}
              type="submit"
              className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none  ${isSubmitting ? "py-1" : "py-2"}`}
            >
              Continue
            </LoadingButton>
          </form>
          <div className="my-6 text-center hr">OR</div>
          <div className="oauth flex w-full max-w-md flex-col gap-4 px-6 text-[#344054]">
            <button
              onClick={() => handleGoogleLogin()}
              className="flex items-center justify-center gap-2 border-2 py-[10px]"
            >
              <img
                src="/google-icon.png"
                className="h-[18px] w-[18px]"
              />
              <span>Sign in With Google</span>
            </button>
            <button
              onClick={() => handleFacebookLogin()}
              className="flex items-center justify-center gap-2 border-2 py-[10px]"
            >
              <img
                src="/facebook-icon.png"
                className="h-[16px] w-[16px]"
              />
              <span>Sign in With Facebook</span>
            </button>
            <button
              onClick={() => handleAppleLogin()}
              className="flex items-center justify-center gap-2 border-2 py-[10px]"
            >
              <img
                src="/apple-icon.png"
                className="h-[16px] w-[16px]"
              />
              <span>Sign in With Apple</span>
            </button>
            <div>
              <h3 className="mb-2 text-sm text-center text-gray-800 normal-case">
                Don't have an account?{" "}
                <Link
                  to={"/signup"}
                  className="self-end mb-8 text-sm font-semibold my-text-gradient"
                >
                  Sign up
                </Link>{" "}
              </h3>
              <h3 className="text-sm text-center text-gray-800 normal-case">
                Account issues? Please visit our{" "}
                <Link
                  to={"/faq"}
                  className="self-end mb-8 text-sm font-semibold my-text-gradient"
                >
                  FAQ page
                </Link>{" "}
              </h3>
            </div>
          </div>

        </section>
        <section
          style={{ backgroundImage: `url(${"/login-bg.jpg"})`, backgroundSize: "cover", backgroundPosition: "center" }}
          className="hidden w-1/2 md:block"
        ></section>
      </div>

      <SuggestPasswordChangeModal
        modalOpen={suggestPasswordChange}
        closeModal={() => setSuggestPasswordChange(false)}
      />
      <SuggestResendVerificationModal
        modalOpen={suggestResendVerification}
        closeModal={() => setSuggestResendVerification(false)}
        email={email}
      />
    </div>
  );
}
