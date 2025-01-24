import React, { useState } from "react";
import { AuthContext, tokenExpireError } from "./authContext";
import { GlobalContext } from "./globalContext";
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import SnackBar from "@/components/SnackBar";
import PublicHeader from "@/components/PublicHeader";
import TopHeader from "@/components/TopHeader";
import AdminHeader from "@/components/AdminHeader";
import HostHeader from "@/components/HostHeader";
import CustomerHeader from "@/components/CustomerHeader";
import Modal from "@/components/Modal";
import ReviewPopUp from "@/components/ReviewPopUp";

import AdminForgotPage from "./pages/Admin/Auth/AdminForgotPage";
import AdminResetPage from "./pages/Admin/Auth/AdminResetPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminProfilePage from "./pages/Admin/AdminProfilePage";

import NotFoundPage from "./pages/Admin/NotFoundPage";

import AdminFaqListPage from "./pages/Admin/Faq/AdminFaqListPage";
import AddAdminFaqPage from "./pages/Admin/Faq/AddAdminFaqPage";
import EditAdminFaqPage from "./pages/Admin/Faq/EditAdminFaqPage";

import AdminEmailListPage from "./pages/Admin/Email/AdminEmailListPage";
import AddAdminEmailPage from "./pages/Admin/Email/AddAdminEmailPage";
import EditAdminEmailPage from "./pages/Admin/Email/EditAdminEmailPage";
import ViewAdminEmailPage from "./pages/Admin/Email/ViewAdminEmailPage";

import AdminAddOnListPage from "./pages/Admin/Addon/AdminAddOnListPage";
import AddAdminAddOnPage from "./pages/Admin/Addon/AddAdminAddOnPage";
import EditAdminAddOnPage from "./pages/Admin/Addon/EditAdminAddOnPage";

import AdminUserListPage from "./pages/Admin/User/AdminUserListPage";
import AddAdminUserPage from "./pages/Admin/User/AddAdminUserPage";
import EditAdminUserPage from "./pages/Admin/User/EditAdminUserPage";
import ViewAdminUserPage from "./pages/Admin/User/ViewAdminUserPage";

import AdminHostListPage from "./pages/Admin/Host/AdminHostListPage";
import AddAdminHostPage from "./pages/Admin/Host/AddAdminHostPage";
import ViewAdminHostPage from "./pages/Admin/Host/ViewAdminHostPage";

import AdminCustomerListPage from "./pages/Admin/Customer/AdminCustomerListPage";
import AddAdminCustomerPage from "./pages/Admin/Customer/AddAdminCustomerPage";
import ViewAdminCustomerPage from "./pages/Admin/Customer/ViewAdminCustomerPage";

import AdminCustomerReviewListPage from "./pages/Admin/Review/AdminCustomerReviewListPage";
import AdminHostReviewListPage from "./pages/Admin/Review/AdminHostReviewPage";
import AddAdminReviewPage from "./pages/Admin/Review/AddAdminReviewPage";
import EditAdminReviewPage from "./pages/Admin/Review/EditAdminReviewPage";

import AdminSpacesListPage from "./pages/Admin/Space/AdminSpacesListPage";
import AddAdminSpacesPage from "./pages/Admin/Space/AddAdminSpacesPage";
import EditAdminSpacesPage from "./pages/Admin/Space/EditAdminSpacesPage";

import AdminPropertySpacesAmenititesListPage from "./pages/Admin/PropertySpaceAmenity/AdminPropertySpacesAmenititesListPage";
import AddAdminPropertySpacesAmenititesPage from "./pages/Admin/PropertySpaceAmenity/AddAdminPropertySpacesAmenititesPage";
import EditAdminPropertySpacesAmenititesPage from "./pages/Admin/PropertySpaceAmenity/EditAdminPropertySpacesAmenititesPage";

import AdminPayoutListPage from "./pages/Admin/Payout/AdminPayoutListPage";
import AddAdminPayoutPage from "./pages/Admin/Payout/AddAdminPayoutPage";
import EditAdminPayoutPage from "./pages/Admin/Payout/EditAdminPayoutPage";

import AdminPropertyListPage from "./pages/Admin/Property/AdminPropertyListPage";
import AddAdminPropertyPage from "./pages/Admin/Property/AddAdminPropertyPage";
import ViewAdminPropertyPage from "./pages/Admin/Property/ViewAdminPropertyPage";

import AdminBookingAddonsListPage from "./pages/Admin/BookingAddon/AdminBookingAddonsListPage";
import AddAdminBookingAddonsPage from "./pages/Admin/BookingAddon/AddAdminBookingAddonsPage";
import EditAdminBookingAddonsPage from "./pages/Admin/BookingAddon/EditAdminBookingAddonsPage";

import AdminPropertySpacesListPage from "./pages/Admin/PropertySpace/AdminPropertySpacesListPage";
import AddAdminPropertySpacesPage from "./pages/Admin/PropertySpace/AddAdminPropertySpacesPage";
import EditAdminPropertySpacesPage from "./pages/Admin/PropertySpace/EditAdminPropertySpacesPage";
import ViewAdminPropertySpacesPage from "./pages/Admin/PropertySpace/ViewAdminPropertySpacesPage";

import AdminSettingsListPage from "./pages/Admin/Setting/AdminSettingsListPage";
import AddAdminSettingsPage from "./pages/Admin/Setting/AddAdminSettingsPage";
import EditAdminSettingsPage from "./pages/Admin/Setting/EditAdminSettingsPage";

import AdminPropertySpacesImagesListPage from "./pages/Admin/PropertySpaceImage/AdminPropertySpacesImagesListPage";
import AddAdminPropertySpacesImagesPage from "./pages/Admin/PropertySpaceImage/AddAdminPropertySpacesImagesPage";
import EditAdminPropertySpacesImagesPage from "./pages/Admin/PropertySpaceImage/EditAdminPropertySpacesImagesPage";

import AdminIdVerificationListPage from "./pages/Admin/IdVerification/AdminIdVerificationListPage";
import AddAdminIdVerificationPage from "./pages/Admin/IdVerification/AddAdminIdVerificationPage";
import EditAdminIdVerificationPage from "./pages/Admin/IdVerification/EditAdminIdVerificationPage";

import AdminPropertyAddOnListPage from "./pages/Admin/PropertyAddon/AdminPropertyAddOnListPage";
import AddAdminPropertyAddOnPage from "./pages/Admin/PropertyAddon/AddAdminPropertyAddOnPage";
import EditAdminPropertyAddOnPage from "./pages/Admin/PropertyAddon/EditAdminPropertyAddOnPage";

import AdminBookingListPage from "./pages/Admin/Booking/AdminBookingListPage";
import AddAdminBookingPage from "./pages/Admin/Booking/AddAdminBookingPage";
import EditAdminBookingPage from "./pages/Admin/Booking/EditAdminBookingPage";
import ViewAdminBookingPage from "./pages/Admin/Booking/ViewAdminBookingPage";

import AdminAmenityListPage from "./pages/Admin/Amenity/AdminAmenityListPage";
import AddAdminAmenityPage from "./pages/Admin/Amenity/AddAdminAmenityPage";
import EditAdminAmenityPage from "./pages/Admin/Amenity/EditAdminAmenityPage";

import AdminHashTagPage from "./pages/Admin/Hashtag/AdminHashTagPage";
import AddAdminHashTagPage from "./pages/Admin/Hashtag/AddAdminHashtagPage";
import EditAdminHashTagPage from "./pages/Admin/Hashtag/EditAdminHashTagPage";

import AdminPropertySpaceFaqListPage from "./pages/Admin/PropertySpaceFaq/AdminPropertySpaceFaqListPage";
import AddAdminPropertySpaceFaqPage from "./pages/Admin/PropertySpaceFaq/AddAdminPropertySpaceFaqPage";
import EditAdminPropertySpaceFaqPage from "./pages/Admin/PropertySpaceFaq/EditAdminPropertySpaceFaqPage";

import AdminPrivacyPage from "./pages/Admin/CMS/AdminPrivacyPage";
import AdminTermsAndConditionsPage from "./pages/Admin/CMS/AdminTermsAndConditionsPage";
import AdminCancellationPolicyPage from "./pages/Admin/CMS/AdminCancellationPolicyPage";

import AdminNotificationPage from "./pages/Admin/Notification/AdminNotificationListPage";

import ResetForm from "./pages/Common/Login/ResetForm";
import LoginPage from "./pages/Common/Login/LoginPage";
import RequestReset from "./pages/Common/Login/RequestReset";
import OauthRedirect from "./pages/Common/Login/OauthRedirect";
import ResetRedirect from "./pages/Common/Login/ResetRedirect";

import SignUpDetailsForm from "./pages/Common/SignUp/SignUpDetailsForm";
import SignUpPageWrapper from "./pages/Common/SignUp/PageWrapper";
import SignUpForm from "./pages/Common/SignUp/SignUpForm";

import HomePage from "./pages/Common/HomePage";
import FaqPage from "./pages/Common/FaqPage";
import ContactUsPage from "./pages/Common/ContactUsPage";
import ExplorePage from "./pages/Common/ExplorePage";
import SearchPage from "./pages/Common/SearchPage";

import MessagesPage from "./pages/Common/Messages/MessagesPage";
import HostPaymentsPage from "./pages/Host/Payments/HostPaymentsPage";

import SpaceDetailsOne from "./pages/Host/Spaces/Add/SpaceDetailsOne";
import SpaceDetailsTwo from "./pages/Host/Spaces/Add/SpaceDetailsTwo";
import SpaceDetailsThree from "./pages/Host/Spaces/Add/SpaceDetailsThree";
import SpaceDetailsFour from "./pages/Host/Spaces/Add/SpaceDetailsFour";
import SpaceSubmitted from "./pages/Host/Spaces/Add/SpaceSubmitted";
import SpacesPageWrapper from "./pages/Host/Spaces/Add/PageWrapper";

import MySpaceWrapper from "./pages/Host/Spaces/Edit/PageWrapper";
import MySpaceDetailsPage from "./pages/Host/Spaces/MySpaceDetailsPage";
import EditScheduleWrapper from "./pages/Host/Spaces/Edit/EditScheduleWrapper";
import EditPropertyImagesPage from "./pages/Host/Spaces/Edit/EditPropertyImagesPage";
import EditPropertySpacePage from "./pages/Host/Spaces/Edit/EditPropertySpacePage";

import BookingPageWrapper from "./pages/Common/Booking/PageWrapper";
import FavoritesPage from "./pages/Common/FavoritesPage";
import PropertyPage from "./pages/Common/Booking/PropertyPage";
import BookingPreviewPage from "./pages/Common/Booking/BookingPreviewPage";
import CustomerVerificationPage from "./pages/Customer/Verification/CustomerVerificationPage";
import HostVerificationPage from "./pages/Host/Verification/HostVerificationPage";
import BookingConfirmationPage from "./pages/Common/Booking/BookingConfirmationPage";
import VerifyEmailPage from "./pages/Common/SignUp/VerifyEmailPage";
import AdminReportsPage from "./pages/Admin/AdminReportsPage";
import ScrollToTop from "./utils/ScrollToTop";
import AdminColumnOrderPage from "./pages/Admin/AdminColumnOrderPage";
import Footer from "./components/frontend/Footer";
import { useEffect } from "react";
import PrivacyPolicyPage from "./pages/Common/PrivacyPolicyPage";
import CheckVerificationPage from "./pages/Common/SignUp/CheckVerificationPage";
import CancellationPolicyPage from "./pages/Common/CancelationPolicyPage";
import TermsAndConditionsPage from "./pages/Common/TermsAndConditionsPage";
import AdminDevicesPage from "./pages/Admin/Devices/AdminDevicesPage.jsx";
import ConfirmationModal from "./components/ConfirmationModal";
import ErrorModal from "./components/ErrorModal";
import LoadingSpinner from "./components/LoadingSpinner";
import SessionExpiredModal from "./components/SessionExpiredModal";
import SignUpSelectRole from "./pages/Common/SignUp/SignUpSelectRole";
import { useMemo } from "react";
import BecomeAHostPage from "./pages/Common/SignUp/BecomeAHostPage";
import CheckDeleteEmailPage from "./pages/Common/CheckDeleteEmailPage";
import ConfirmDeletePage from "./pages/Common/ConfirmDeletePage";
import HostBookingListPage from "./pages/Host/Bookings/HostBookingListPage";
import HostBookingDetailsPage from "./pages/Host/Bookings/HostBookingDetailsPage";
import CustomerBookingListPage from "./pages/Customer/Bookings/CustomerBookingListPage";
import CustomerBookingDetailsPage from "./pages/Customer/Bookings/CustomerBookingDetailsPage";
import CustomerReviewsPage from "./pages/Customer/Reviews/CustomerReviewsPage";
import CustomerPaymentsPage from "./pages/Customer/Payments/CustomerPaymentsPage";
import HostReviewsPage from "./pages/Host/Reviews/HostReviewsPage";
import NotVerifiedModal from "./components/NotVerifiedModal";
import CustomerProfilePage from "./pages/Customer/Profile/CustomerProfilePage";
import HostProfilePage from "./pages/Host/Profile/HostProfilePage";
import CustomerBillingsPage from "./pages/Customer/Billings/CustomerBillingsPage";
import HostBillingsPage from "./pages/Host/Billings/HostBillingsPage";
import MySpacesListPage from "./pages/Host/Spaces/MySpacesListPage";
import EditBookingPage from "./pages/Customer/Bookings/EditBookingPage";
import HostAccountHeader from "./pages/Host/HostAccountHeader";
import CustomerAccountHeader from "./pages/Customer/CustomerAccountHeader";
import CustomerGettingStartedTour from "./components/CustomerGettingStartedTour";
import HostGettingStartedTour from "./components/HostGettingStartedTour";
import useSpaceCategories from "./hooks/api/useSpaceCategories";
import HostPropertyRulesTemplatePage from "./pages/Host/PropertyRulesTemplate/HostPropertyRulesTemplatePage";
import CreatePropertyRuleTemplatePage from "./pages/Host/PropertyRulesTemplate/CreatePropertyRulesTemplatePage";
import AdminPayoutMethodListPage from "./pages/Admin/PayoutMethods/AdminPayoutMethodListPage";
import EditPropertyRuleTemplatePage from "./pages/Host/PropertyRulesTemplate/EditPropertyRulesTemplatePage";
import EditPropertyDetails from "./pages/Host/Spaces/Edit/EditPropertyDetails";
import AdminRecycleBinUsers from "./pages/Admin/RecycleBin/AdminRecycleBinUsers";
import AdminRecycleBinDevices from "./pages/Admin/RecycleBin/AdminRecycleBinDevices";
import AdminRecycleBinProperties from "./pages/Admin/RecycleBin/AdminRecycleBinProperties";
import AdminRecycleBinPropertySpaces from "./pages/Admin/RecycleBin/AdminRecycleBinPropertySpaces";
import AdminRecycleBinSpaceImages from "./pages/Admin/RecycleBin/AdminRecycleSpaceImages";
import AdminRecycleBinPropertyAmenities from "./pages/Admin/RecycleBin/AdminRecycleBinAmenities";
import AdminRecycleBinBookingAddons from "./pages/Admin/RecycleBin/AdminRecycleBinBookingAddon";
import AdminRecycleBinFaqs from "./pages/Admin/RecycleBin/AdminRecycleBinFaqs";
import AdminRecycleBinHashtags from "./pages/Admin/RecycleBin/AdminRecycleHashtags";
import AdminRecycleBinSpaces from "./pages/Admin/RecycleBin/AdminRecycleSpaces";
import AdminRecycleBinPropertyAddons from "./pages/Admin/RecycleBin/AdminRecycleBinPropertyAddon";
import AdminRecycleBinPropertySpaceFaqs from "./pages/Admin/RecycleBin/AdminRecycleBinSpaceFaq";
import AdminRecycleBinPayout from "./pages/Admin/RecycleBin/AdminRecycleBinPayout";
import AdminRecycleBinBookings from "./pages/Admin/RecycleBin/AdminRecycleBinBooking";
import { TourProvider, useTour } from "@reactour/tour";
import MkdSDK from "@/utils/MkdSDK";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import HostAddOnListPage from "./pages/Host/Addons/HostAddOnListPage";
import EditHostAddOnPage from "./pages/Host/Addons/EditHostAddons";
import HostAmenitiesListPage from "./pages/Host/Amenities/HostAmenitiesListPage";
import EditHostAmenitiesPage from "./pages/Host/Amenities/EditHostAmenities";

function renderHeader(role) {
  switch (role) {
    case "superadmin":
    case "admin":
      return <AdminHeader />;

    case "host":
      return <HostHeader />;

    case "customer":
      return <CustomerHeader />;

    default:
      return <PublicHeader />;
  }
}

function renderRoutes(role) {
  switch (role) {
    case "superadmin":
    case "admin":
      return (
        <Routes>
          <Route
            exact
            path="/admin"
            element={<AdminDashboardPage />}
          ></Route>
          <Route
            exact
            path="/admin/dashboard"
            element={<AdminDashboardPage />}
          ></Route>
          <Route
            exact
            path="/admin/profile"
            element={<AdminProfilePage />}
          ></Route>

          <Route
            path="/admin/faq"
            element={<AdminFaqListPage />}
          ></Route>
          <Route
            path="/admin/add-faq"
            element={<AddAdminFaqPage />}
          ></Route>
          <Route
            path="/admin/edit-faq/:id"
            element={<EditAdminFaqPage />}
          ></Route>

          <Route
            path="/admin/email"
            element={<AdminEmailListPage />}
          ></Route>
          <Route
            path="/admin/add-email"
            element={<AddAdminEmailPage />}
          ></Route>
          <Route
            path="/admin/edit-email/:id"
            element={<EditAdminEmailPage />}
          ></Route>
          <Route
            path="/admin/view-email/:id"
            element={<ViewAdminEmailPage />}
          ></Route>

          <Route
            path="/admin/add_on"
            element={<AdminAddOnListPage />}
          ></Route>
          <Route
            path="/admin/add-add_on"
            element={<AddAdminAddOnPage />}
          ></Route>
          <Route
            path="/admin/edit-add_on/:id"
            element={<EditAdminAddOnPage />}
          ></Route>

          <Route
            path="/admin/user"
            element={<AdminUserListPage />}
          ></Route>
          <Route
            path="/admin/add-user"
            element={<AddAdminUserPage />}
          ></Route>

          <Route
            path="/admin/edit-user/:id"
            element={<EditAdminUserPage />}
          ></Route>
          <Route
            path="/admin/view-user/:id"
            element={<ViewAdminUserPage />}
          ></Route>

          <Route
            path="/admin/host"
            element={<AdminHostListPage />}
          ></Route>
          <Route
            path="/admin/add-host"
            element={<AddAdminHostPage />}
          ></Route>

          <Route
            path="/admin/edit-host/:id"
            element={<ViewAdminHostPage page="edit" />}
          ></Route>
          <Route
            path="/admin/view-host/:id"
            element={<ViewAdminHostPage page="view" />}
          ></Route>

          <Route
            path="/admin/customer"
            element={<AdminCustomerListPage />}
          ></Route>
          <Route
            path="/admin/add-customer"
            element={<AddAdminCustomerPage />}
          ></Route>

          <Route
            path="/admin/edit-customer/:id"
            element={<ViewAdminCustomerPage page="edit" />}
          ></Route>
          <Route
            path="/admin/view-customer/:id"
            element={<ViewAdminCustomerPage page="view" />}
          ></Route>

          <Route
            path="/admin/review"
            element={<AdminHostReviewListPage />}
          ></Route>
          <Route
            path="/admin/review/customer"
            element={<AdminCustomerReviewListPage />}
          ></Route>
          <Route
            path="/admin/add-review"
            element={<AddAdminReviewPage />}
          ></Route>
          <Route
            path="/admin/edit-review/:id"
            element={<EditAdminReviewPage />}
          ></Route>

          <Route
            path="/admin/spaces"
            element={<AdminSpacesListPage />}
          ></Route>
          <Route
            path="/admin/add-spaces"
            element={<AddAdminSpacesPage />}
          ></Route>
          <Route
            path="/admin/edit-spaces/:id"
            element={<EditAdminSpacesPage />}
          ></Route>

          <Route
            path="/admin/property_spaces_amenitites"
            element={<AdminPropertySpacesAmenititesListPage />}
          ></Route>
          <Route
            path="/admin/add-property_spaces_amenitites"
            element={<AddAdminPropertySpacesAmenititesPage />}
          ></Route>
          <Route
            path="/admin/edit-property_spaces_amenitites/:id"
            element={<EditAdminPropertySpacesAmenititesPage />}
          ></Route>

          <Route
            path="/admin/payout"
            element={<AdminPayoutListPage />}
          ></Route>
          <Route
            path="/admin/add-payout"
            element={<AddAdminPayoutPage />}
          ></Route>
          <Route
            path="/admin/edit-payout/:id"
            element={<EditAdminPayoutPage />}
          ></Route>
          <Route
            path="/admin/payout_method"
            element={<AdminPayoutMethodListPage />}
          ></Route>
          <Route
            path="/admin/add-payout_method"
            element={<AddAdminPayoutPage />}
          ></Route>
          <Route
            path="/admin/edit-payout_method/:id"
            element={<EditAdminPayoutPage />}
          ></Route>

          <Route
            path="/admin/property"
            element={<AdminPropertyListPage />}
          ></Route>
          <Route
            path="/admin/add-property"
            element={<AddAdminPropertyPage />}
          ></Route>
          <Route
            path="/admin/edit-property/:id"
            element={<ViewAdminPropertyPage page="edit" />}
          ></Route>
          <Route
            path="/admin/view-property/:id"
            element={<ViewAdminPropertyPage page="view" />}
          ></Route>

          <Route
            path="/admin/booking_addons"
            element={<AdminBookingAddonsListPage />}
          ></Route>
          <Route
            path="/admin/add-booking_addons"
            element={<AddAdminBookingAddonsPage />}
          ></Route>
          <Route
            path="/admin/edit-booking_addons/:id"
            element={<EditAdminBookingAddonsPage />}
          ></Route>

          <Route
            path="/admin/property_spaces"
            element={<AdminPropertySpacesListPage />}
          ></Route>
          <Route
            path="/admin/add-property_spaces"
            element={<AddAdminPropertySpacesPage />}
          ></Route>
          <Route
            path="/admin/edit-property_spaces/:id"
            element={<EditAdminPropertySpacesPage />}
          ></Route>
          <Route
            path="/admin/view-property_spaces/:id"
            element={<ViewAdminPropertySpacesPage />}
          ></Route>
          <Route
            path="/admin/property_spaces_faq"
            element={<AdminPropertySpaceFaqListPage />}
          ></Route>
          <Route
            path="/admin/add-property_spaces_faq"
            element={<AddAdminPropertySpaceFaqPage />}
          ></Route>
          <Route
            path="/admin/edit-property_spaces_faq/:id"
            element={<EditAdminPropertySpaceFaqPage />}
          ></Route>

          <Route
            path="/admin/settings"
            element={<AdminSettingsListPage />}
          ></Route>
          <Route
            path="/admin/add-settings"
            element={<AddAdminSettingsPage />}
          ></Route>
          <Route
            path="/admin/edit-settings/:id"
            element={<EditAdminSettingsPage />}
          ></Route>

          <Route
            path="/admin/property_spaces_images"
            element={<AdminPropertySpacesImagesListPage />}
          ></Route>
          <Route
            path="/admin/add-property_spaces_images"
            element={<AddAdminPropertySpacesImagesPage />}
          ></Route>
          <Route
            path="/admin/edit-property_spaces_images/:id"
            element={<EditAdminPropertySpacesImagesPage />}
          ></Route>

          <Route
            path="/admin/id_verification"
            element={<AdminIdVerificationListPage />}
          ></Route>
          <Route
            path="/admin/add-id_verification"
            element={<AddAdminIdVerificationPage />}
          ></Route>
          <Route
            path="/admin/edit-id_verification/:id"
            element={<EditAdminIdVerificationPage />}
          ></Route>

          <Route
            path="/admin/property_add_on"
            element={<AdminPropertyAddOnListPage />}
          ></Route>
          <Route
            path="/admin/add-property_add_on"
            element={<AddAdminPropertyAddOnPage />}
          ></Route>
          <Route
            path="/admin/edit-property_add_on/:id"
            element={<EditAdminPropertyAddOnPage />}
          ></Route>

          <Route
            path="/admin/booking"
            element={<AdminBookingListPage />}
          ></Route>
          <Route
            path="/admin/add-booking"
            element={<AddAdminBookingPage />}
          ></Route>
          <Route
            path="/admin/edit-booking/:id"
            element={<EditAdminBookingPage />}
          ></Route>
          <Route
            path="/admin/view-booking/:id"
            element={<ViewAdminBookingPage />}
          ></Route>
          <Route
            path="/admin/amenity"
            element={<AdminAmenityListPage />}
          ></Route>
          <Route
            path="/admin/add-amenity"
            element={<AddAdminAmenityPage />}
          ></Route>
          <Route
            path="/admin/edit-amenity/:id"
            element={<EditAdminAmenityPage />}
          ></Route>

          <Route
            path="/admin/hashtag"
            element={<AdminHashTagPage />}
          ></Route>
          <Route
            path="/admin/edit-hashtag/:id"
            element={<EditAdminHashTagPage />}
          ></Route>
          <Route
            path="/admin/add-hashtag"
            element={<AddAdminHashTagPage />}
          ></Route>
          <Route
            path="/admin/reports"
            element={<AdminReportsPage />}
          ></Route>
          <Route
            path="/admin/column_order/:sectionId"
            element={<AdminColumnOrderPage />}
          ></Route>
          <Route
            path="/admin/privacy"
            element={<AdminPrivacyPage />}
          ></Route>
          <Route
            path="/admin/terms_and_conditions"
            element={<AdminTermsAndConditionsPage />}
          ></Route>
          <Route
            path="/admin/cancellation_policy"
            element={<AdminCancellationPolicyPage />}
          ></Route>
          <Route
            path="/admin/notification"
            element={<AdminNotificationPage />}
          ></Route>
          {/* <Route
            path="/admin/recycle_bin_users"
            element={<AdminRecycleBinUsers />}
          ></Route> */}
          <Route
            path="/admin/recycle_bin_users"
            element={<AdminRecycleBinUsers />}
          ></Route>
          <Route
            path="/admin/recycle_bin_devices"
            element={<AdminRecycleBinDevices />}
          ></Route>
          <Route
            path="/admin/recycle_bin_properties"
            element={<AdminRecycleBinProperties />}
          ></Route>
          <Route
            path="/admin/recycle_bin_properties_spaces"
            element={<AdminRecycleBinPropertySpaces />}
          ></Route>
          <Route
            path="/admin/recycle_bin_booking"
            element={<AdminRecycleBinBookings />}
          ></Route>
          <Route
            path="/admin/recycle_bin_booking_addon"
            element={<AdminRecycleBinBookingAddons />}
          ></Route>
          <Route
            path="/admin/recycle_bin_spaces"
            element={<AdminRecycleBinSpaces />}
          ></Route>
          <Route
            path="/admin/recycle_bin_properties_space_images"
            element={<AdminRecycleBinSpaceImages />}
          ></Route>
          <Route
            path="/admin/recycle_bin_properties_space_amenities"
            element={<AdminRecycleBinPropertyAmenities />}
          ></Route>
          <Route
            path="/admin/recycle_bin_properties_space_faq"
            element={<AdminRecycleBinPropertySpaceFaqs />}
          ></Route>
          <Route
            path="/admin/recycle_bin_properties_addon"
            element={<AdminRecycleBinPropertyAddons />}
          ></Route>
          <Route
            path="/admin/recycle_bin_hashtag"
            element={<AdminRecycleBinHashtags />}
          ></Route>
          <Route
            path="/admin/recycle_bin_faqs"
            element={<AdminRecycleBinFaqs />}
          ></Route>
          <Route
            path="/admin/recycle_bin_payout"
            element={<AdminRecycleBinPayout />}
          ></Route>
          <Route
            path="/admin/device"
            element={<AdminDevicesPage />}
          ></Route>
          <Route
            path="*"
            element={<Navigate to="/admin" /> || <NotFoundPage />}
          ></Route>
        </Routes>
      );
      break;

    case "host":
      return (
        <Routes>
          <Route
            exact
            path="/check-verification"
            element={<CheckVerificationPage />}
          />
          <Route
            path="/login"
            exact
            element={<LoginPage />}
          />
          <Route
            path="/request-reset"
            exact
            element={<RequestReset />}
          />
          <Route
            path="/reset-password"
            exact
            element={<ResetForm />}
          />
          <Route
            path="/login/oauth"
            exact
            element={<OauthRedirect />}
          />
          <Route
            path="/signup"
            exact
            element={<SignUpPageWrapper />}
          >
            <Route
              path="select-role"
              exact
              element={<SignUpSelectRole />}
            />
            <Route
              exact
              index
              element={<SignUpForm />}
            />
            <Route
              path="details"
              exact
              element={<SignUpDetailsForm />}
            />
            <Route
              path="oauth"
              exact
              element={<OauthRedirect />}
            />
          </Route>

          <Route
            exact
            path="/"
            element={<HomePage />}
          />
          <Route
            exact
            path="/faq"
            element={<FaqPage />}
          />
          <Route
            exact
            path="/contact-us"
            element={<ContactUsPage />}
          />
          <Route
            exact
            path="/cancelation-policy"
            element={<ContactUsPage />}
          />
          <Route
            exact
            path="/explore"
            element={<ExplorePage />}
          />
          <Route
            exact
            path="/search"
            element={<SearchPage />}
          />
          <Route
            exact
            path="/favorites"
            element={<FavoritesPage />}
          />
          <Route
            exact
            path="/property/:id"
            element={<BookingPageWrapper />}
          >
            <Route
              exact
              index
              element={<PropertyPage />}
            />
            <Route
              exact
              path="booking-preview"
              element={<BookingPreviewPage />}
            />
            <Route
              exact
              path="booking-confirmation"
              element={<BookingConfirmationPage />}
            />
          </Route>
          <Route
            path="/account"
            element={<HostAccountHeader />}
          >
            <Route
              path="my-bookings"
              exact
              element={<HostBookingListPage />}
            />
            <Route
              path="my-bookings/:id"
              exact
              element={<HostBookingDetailsPage />}
            />
            <Route
              path="messages"
              exact
              element={<MessagesPage />}
            />
            <Route
              path="reviews"
              exact
              element={<HostReviewsPage />}
            />
            <Route
              exact
              path="profile"
              element={<HostProfilePage />}
            />
           
             <Route
              exact
              path="my-addons"
              element={<MySpaceWrapper />}
            >
              <Route
                exact
                index
                element={<HostAddOnListPage />}
              />
            <Route
              exact
              path="host/edit-add_on/:id"
              element={<EditHostAddOnPage />}
            />
            </Route>

             <Route
              exact
              path="my-amenities"
              element={<MySpaceWrapper />}
            >
              <Route
                exact
                index
                element={<HostAmenitiesListPage />}
              />
            <Route
              exact
              path="host/edit-amenity/:id"
              element={<EditHostAmenitiesPage />}
            />
            </Route>


            <Route
              exact
              path="profile"
              element={<HostProfilePage />}
            />
            <Route
              exact
              path="my-spaces"
              element={<MySpaceWrapper />}
            >
              <Route
                exact
                index
                element={<MySpacesListPage />}
              />
              <Route
                exact
                path=":id"
                element={<MySpaceDetailsPage />}
              />
              <Route
                exact
                path=":id/edit-review"
                element={<EditPropertyDetails />}
              />
              <Route
                exact
                path=":id/edit-scheduling"
                element={<EditScheduleWrapper />}
              />
              <Route
                exact
                path=":id/edit-images"
                element={<EditPropertyImagesPage />}
              />
              <Route
                exact
                path=":id/edit-property-space"
                element={<EditPropertySpacePage />}
              />
            </Route>
            <Route
              exact
              path="payments"
              element={<HostPaymentsPage />}
            />
            <Route
              exact
              path="billing"
              element={<HostBillingsPage />}
            />
            <Route
              path="verification"
              exact
              element={<HostVerificationPage />}
            />
          </Route>
          <Route
            exact
            path="/account/profile/rules-templates"
            element={<HostPropertyRulesTemplatePage />}
          />
          <Route
            exact
            path="/account/profile/rules-templates/add"
            element={<CreatePropertyRuleTemplatePage />}
          />
          <Route
            exact
            path="/account/profile/edit-rules-templates/:id"
            element={<EditPropertyRuleTemplatePage />}
          />
          <Route
            exact
            path="/account/delete/check"
            element={<CheckDeleteEmailPage />}
          />
          <Route
            exact
            path="/host/confirm-delete"
            element={<ConfirmDeletePage />}
          />
          <Route
            path="spaces"
            exact
            element={<SpacesPageWrapper />}
          >
            <Route
              path="add"
              exact
              element={<SpaceDetailsOne />}
            />
            <Route
              path="add/2"
              exact
              element={<SpaceDetailsTwo />}
            />
            <Route
              path="add/3"
              exact
              element={<SpaceDetailsThree />}
            />
            <Route
              path="add/4"
              exact
              element={<SpaceDetailsFour />}
            />
            <Route
              path="add/5"
              exact
              element={<SpaceSubmitted />}
            />
          </Route>
          <Route
            path="*"
            element={<NotFoundPage />}
          ></Route>
          <Route
            exact
            path="/customer/verify-email"
            element={<VerifyEmailPage role="customer" />}
          />
          <Route
            exact
            path="/host/verify-email"
            element={<VerifyEmailPage role="host" />}
          />
          <Route
            exact
            path="/help/privacy-policy"
            element={<PrivacyPolicyPage />}
          />
          <Route
            exact
            path="/help/cancellation-policy"
            element={<CancellationPolicyPage />}
          />
          <Route
            exact
            path="/help/terms_and_conditions"
            element={<TermsAndConditionsPage />}
          />
        </Routes>
      );

    case "customer":
      return (
        <Routes>
          <Route
            exact
            path="/check-verification"
            element={<CheckVerificationPage />}
          />
          <Route
            path="/login"
            exact
            element={<LoginPage />}
          />
          <Route
            path="/request-reset"
            exact
            element={<RequestReset />}
          />
          <Route
            path="/reset-password"
            exact
            element={<ResetForm />}
          />
          <Route
            path="/login/oauth"
            exact
            element={<OauthRedirect />}
          />
          <Route
            path="/signup"
            exact
            element={<SignUpPageWrapper />}
          >
            <Route
              path="select-role"
              exact
              element={<SignUpSelectRole />}
            />
            <Route
              exact
              index
              element={<SignUpForm />}
            />
            <Route
              path="details"
              exact
              element={<SignUpDetailsForm />}
            />
            <Route
              path="oauth"
              exact
              element={<OauthRedirect />}
            />
          </Route>

          <Route
            exact
            path="/become-a-host"
            element={<BecomeAHostPage />}
          ></Route>

          <Route
            exact
            path="/"
            element={<HomePage />}
          />
          <Route
            exact
            path="/faq"
            element={<FaqPage />}
          />
          <Route
            exact
            path="/contact-us"
            element={<ContactUsPage />}
          />
          <Route
            exact
            path="/cancelation-policy"
            element={<ContactUsPage />}
          />
          <Route
            exact
            path="/explore"
            element={<ExplorePage />}
          />
          <Route
            exact
            path="/search"
            element={<SearchPage />}
          />
          <Route
            exact
            path="/favorites"
            element={<FavoritesPage />}
          />
          <Route
            exact
            path="/property/:id"
            element={<BookingPageWrapper />}
          >
            <Route
              exact
              index
              element={<PropertyPage />}
            />
            <Route
              exact
              path="booking-preview"
              element={<BookingPreviewPage />}
            />
            <Route
              exact
              path="booking-confirmation"
              element={<BookingConfirmationPage />}
            />
          </Route>
          <Route
            path="/account"
            element={<CustomerAccountHeader />}
          >
            <Route
              path="my-bookings"
              exact
              element={<CustomerBookingListPage />}
            />
            <Route
              path="my-bookings/edit/:id"
              exact
              element={<EditBookingPage />}
            />
            <Route
              path="my-bookings/:id"
              exact
              element={<CustomerBookingDetailsPage />}
            />
            <Route
              path="messages"
              exact
              element={<MessagesPage />}
            />
            <Route
              path="reviews"
              exact
              element={<CustomerReviewsPage />}
            />
            <Route
              exact
              path="profile"
              element={<CustomerProfilePage />}
            />
            <Route
              exact
              path="payments"
              element={<CustomerPaymentsPage />}
            />
            <Route
              exact
              path="billing"
              element={<CustomerBillingsPage />}
            />
            <Route
              path="verification"
              exact
              element={<CustomerVerificationPage />}
            />
          </Route>
          <Route
            exact
            path="/account/delete/check"
            element={<CheckDeleteEmailPage />}
          />
          <Route
            exact
            path="/customer/confirm-delete"
            element={<ConfirmDeletePage />}
          />
          <Route
            exact
            path="/customer/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route
            exact
            path="/host/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route
            exact
            path="/help/privacy-policy"
            element={<PrivacyPolicyPage />}
          />
          <Route
            exact
            path="/help/cancellation-policy"
            element={<CancellationPolicyPage />}
          />
          <Route
            exact
            path="/help/terms_and_conditions"
            element={<TermsAndConditionsPage />}
          />
          <Route
            path="*"
            element={<NotFoundPage />}
          ></Route>
        </Routes>
      );

    default:
      return (
        <Routes>
          <Route
            exact
            path="/admin/login"
            element={<Navigate to="/login" />}
          ></Route>
          <Route
            exact
            path="/superadmin/login"
            element={<Navigate to="/admin/login" />}
          ></Route>
          <Route
            exact
            path="/admin/forgot"
            element={<AdminForgotPage />}
          ></Route>
          <Route
            exact
            path="/admin/reset/"
            element={<AdminResetPage />}
          ></Route>
          <Route
            exact
            path="/customer/login"
            element={<Navigate to="/login" />}
          ></Route>
          <Route
            exact
            path="/customer/reset"
            element={<ResetRedirect role="customer" />}
          ></Route>
          <Route
            exact
            path="/host/login"
            element={<Navigate to="/login" />}
          ></Route>
          <Route
            exact
            path="/host/reset"
            element={<ResetRedirect role="host" />}
          ></Route>

          {/* frontend login screens */}

          <Route
            path="/login"
            exact
            element={<LoginPage />}
          />
          <Route
            path="/request-reset"
            exact
            element={<RequestReset />}
          />
          <Route
            path="/reset-password"
            exact
            element={<ResetForm />}
          />
          <Route
            path="/login/oauth"
            exact
            element={<OauthRedirect />}
          />
          <Route
            path="/signup"
            exact
            element={<SignUpPageWrapper />}
          >
            <Route
              path="select-role"
              exact
              element={<SignUpSelectRole />}
            />
            <Route
              exact
              index
              element={<SignUpForm />}
            />
            <Route
              path="details"
              exact
              element={<SignUpDetailsForm />}
            />
            <Route
              path="oauth"
              exact
              element={<OauthRedirect />}
            />
          </Route>
          <Route
            exact
            path="/"
            element={<HomePage />}
          />
          <Route
            exact
            path="/faq"
            element={<FaqPage />}
          />
          <Route
            exact
            path="/contact-us"
            element={<ContactUsPage />}
          />
          <Route
            exact
            path="/explore"
            element={<ExplorePage />}
          />
          <Route
            exact
            path="/search"
            element={<SearchPage />}
          />
          <Route
            exact
            path="/favorites"
            element={<FavoritesPage />}
          />
          <Route
            exact
            path="/property/:id"
            element={<BookingPageWrapper />}
          >
            <Route
              exact
              index
              element={<PropertyPage />}
            />
            <Route
              exact
              path="booking-preview"
              element={<BookingPreviewPage />}
            />
          </Route>

          <Route
            exact
            path="/customer/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route
            exact
            path="/check-verification"
            element={<CheckVerificationPage />}
          />
          <Route
            exact
            path="/host/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route
            exact
            path="/help/privacy-policy"
            element={<PrivacyPolicyPage />}
          />
          <Route
            exact
            path="/help/cancellation-policy"
            element={<CancellationPolicyPage />}
          />
          <Route
            exact
            path="/help/terms_and_conditions"
            element={<TermsAndConditionsPage />}
          />
          <Route
            exact
            path="/customer/confirm-delete"
            element={<ConfirmDeletePage />}
          />
          <Route
            exact
            path="/host/confirm-delete"
            element={<ConfirmDeletePage />}
          />
          <Route
            path="*"
            exact
            element={<NotFoundPage />}
          ></Route>
        </Routes>
      );
      break;
  }
}

function Main() {
  const { state, dispatch } = React.useContext(AuthContext);
  const { state: globalState, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { pathname } = useLocation();
  const tidioBlacklist = useMemo(() => ["/admin", "/login", "/signup", "/account/messages"], []);
  const shouldInsertTidio = tidioBlacklist.every((path) => !pathname.startsWith(path));
  // const [currentStep, setCurrentStep] = useState(0);

  const sdk = new MkdSDK();

  function insertTidio() {
    // we are not using tidio right now
    return;
    if (document.getElementById("tidio-script")) return;
    console.log("inserting tidio script");
    const script = document.createElement("script");

    script.src = "//code.tidio.co/h0tpq7blt8pa6septktw5zcdj85psftv.js";
    script.async = true;
    script.setAttribute("id", "tidio-script");
    document.body.appendChild(script);
  }

  useEffect(() => {
    let tidioChat = document.getElementById("tidio-chat");
    if (!tidioChat) {
      if (shouldInsertTidio) {
        insertTidio();
      }
      return;
    }
    if (!shouldInsertTidio) {
      tidioChat.style.display = "none";
    } else {
      tidioChat.style.display = "block";
    }
  }, [pathname]);

  useEffect(() => {
    if (!shouldInsertTidio) return;
    insertTidio();
  }, []);

  useSpaceCategories();

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const setCurrentStep = (step) => {
    setTimeout(() => {
      setStep(step);
    }, 1000);
  };

  async function markAsNotFirstTimeUser() {
    try {
      await sdk.callRawAPI("/v2/api/custom/ergo/edit-self", { profile: { getting_started: 1 } }, "POST");
      globalDispatch({
        type: "SET_USER_DATA",
        payload: {
          ...globalState.user,
          getting_started: 1,
        },
      });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      console.log("err", err);
    }
  }

  const endTour = () => {
    globalDispatch({ type: "END_TOUR" });
    globalDispatch({ type: "CLOSE_MENU_ICON" });
    globalDispatch({ type: "CLOSE_ADD_PAYMENT_METHOD" });
    setCurrentStep(0)
    markAsNotFirstTimeUser();
  }
  const disableBody = (target) => disableBodyScroll(target)
  const enableBody = (target) => enableBodyScroll(target)

  const styles = {
    highlightedArea: (base, { x, y }) => ({
      ...base,
      x: x + 10,
      y: y + 10,
      padding: "10px"
    }),
    maskArea: (base) => ({ ...base, rx: '10px' }),
    badge: (base) => ({ ...base, right: '-0.8125em' }),
    controls: (base) => ({ ...base, marginTop: 100 }),
    styles: {
      popover: (base) => ({
        ...base,
        boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
        padding: '30px',
        backgroundColor: '#dedede',
      })
    },
    maskWrapper: (base) => ({
      ...base,
      boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
      padding: '40px',
      backgroundColor: '#dedede',
    }),
    popover: (base) => ({
      ...base,
      boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
      padding: '40px',
      backgroundColor: '#dedede',
    }),
    badge: (base) => ({ ...base, color: 'white', background: '#0ba68a' }),
  }

  const hostSteps =
    [
      {
        selector: '.first-step',
        content: ({ goTo, inDOM, setCurrentStep, isHighlightingObserved }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px] text-start">Navigate to the Profile menu</p>
            <span className="font-semibold text-sm mt-1">From the profile menu, users can manage their profile, view bookings, message hosts, view reviews, manage payments and billing information.</span>
            <button onClick={() => setCurrentStep(1)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        ),
        action: () => {
          setCurrentStep(0)
          if (!globalState?.menuIconOpen) {
            globalDispatch({ type: "OPEN_MENU_ICON" });
          }
        },
        position: "center",
        highlightedSelectors: [".first-step"],
        resizeObservables: [".first-step"],
        mutationObservables: ['[data-tour="photo-step"]'],

      },

      {
        selector: '[data-tour="photo-step"]',
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <span className="font-semibold text-sm mt-1">Upload your photo. All photos are subject to approval. For further questions, please visit our <Link className="underline text-blue-500" to="/faq">FAQs</Link> or
              <Link className="underline text-blue-500" to="/help/terms_and_conditions">User Agreement page.</Link></span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() =>
                setCurrentStep(0)
              } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => {

                setCurrentStep(2); globalDispatch({ type: "CLOSE_MENU_ICON" });
              }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginLeft: '30px',
            marginTop: '30px',
            backgroundColor: '#dedede',
          })
        },
        position: "bottom",
        action: () => {
          navigate("/account/profile");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        },
        mutationObservables: ['[data-tour="photo-step"]'],
      },
      {
        selector: '[data-tour="profile-step"]',
        content: ({ setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <span className="font-semibold text-sm mt-1">Complete your About Me and include information about yourself and/or your company.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() =>
                setCurrentStep(1)
              } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => {
                setCurrentStep(3); globalDispatch({ type: "CLOSE_MENU_ICON" });
              }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginLeft: '30px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          navigate("/account/profile");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        },
        mutationObservables: ['[data-tour="about-step"]'],
      },
      {
        selector: '[data-tour="email-step"]',
        content: ({ setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <span className="font-semibold text-sm mt-1">Enable or disable Email Alerts for Site Activity if you want to be alerted via email on all site actions.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() =>
                setCurrentStep(2)
              } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => {
                setCurrentStep(4); globalDispatch({ type: "CLOSE_MENU_ICON" });
              }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            backgroundColor: '#dedede',
          })
        },
      position: "center",
        action: () => {
          navigate("/account/profile");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        },
        mutationObservables: ['[data-tour="email-step"]'],
      },
      {
        selector: '[data-tour="fourth-step"]',
        onTransition: {
          position: "center"
        },
        content: ({ goTo, inDOM, setCurrentStep, transition }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-sm">Click on Get Verified to submit your identity for verification.</p>
            <div className="flex justify-start gap-4 w-full">
              <div className="flex justify-start gap-4 w-full">
                <button
                  onClick={() => setCurrentStep(3)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
                <button onClick={() => {
                  setCurrentStep(5);
                  transition(true)
                }
                } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next Step</button>
              </div>
            </div>
          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '30px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          navigate("/account/profile");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        },
        mutationObservables: ['[data-tour="fourth-step"]'],
      },
      {
        selector: '[data-tour="fifth-step"]',
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Select and Upload a Government issued ID or Passport.</p>
            <span className="font-semibold text-sm mt-1">Identification is subject to approval. The image must be current, legible and expiration date must be valid. For further questions, please review our <Link className="underline text-blue-500" to="/help/terms_and_conditions">User Agreement</Link>.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() =>
                setCurrentStep(4)
              } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button
                onClick={() =>
                  setCurrentStep(6)
                }
                className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: 'bottom',
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '30px',
            marginLeft: '30px',
            backgroundColor: '#dedede',
          })
        },
        mutationObservables: [`[data-tour-id="mask-position-recompute"]`]
      },

      {
        selector: "",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">

          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '-30px',
            marginLeft: '20px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          if (pathname != "/account/verification") {
            navigate("/account/verification");
          }
        },
      },
      {
        selector: ".tenth-step",
        content: ({ goTo, inDOM, setCurrentStep }) => {
          return (
            <div className="flex justify-center items-center flex-col">
              <p className="font-semibold text-[18px]">Under Billing, please add your payment and payout methods</p>
              <div className="flex justify-start gap-4 w-full">
                <button onClick={() => setCurrentStep(6)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
                <button onClick={() => {
                  setCurrentStep(8)
                }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
              </div>
            </div>
          )
        },
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '30px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          navigate("/account/billing");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        },
      },
      {
        selector: ".twelfth-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Under Payments, view your payment history</p>
            <span className="font-semibold text-sm mt-1">Payments you’ve received from Customers after bookings are completed.</span>
            {/* <span className="font-semibold text-sm mt-1">Once approved, you will receive an email with approval confirmation from our support team and your account will be activated. For questions or concerns, please navigate to the <Link className="underline text-blue-500" to="/faq">FAQs</Link> page.</span> */}
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(7)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(9)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "bottom",
        action: () => {
          if (pathname != "/account/payments") {
            navigate("/account/payments");
            globalDispatch({ type: "CLOSE_MENU_ICON" });
          }
        },
      },
      {
        selector: ".thirteenth-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">See reviews given by your customers</p>
            {/* <span className="font-semibold text-sm mt-1">Once approved, you will receive an email with approval confirmation from our support team and your account will be activated. For questions or concerns, please navigate to the <Link className="underline text-blue-500" to="/faq">FAQs</Link> page.</span> */}
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(8)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(10)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "top",
        styles: {
          popover: (base) => ({
            ...base,
            marginLeft: '30px',
            marginTop: '30px',
          })
        },
        action: () => {
          if (globalState.menuIconOpen) {
            globalDispatch({ type: "CLOSE_MENU_ICON" });
          }
          if (globalState.addPaymentMethodModal) {
            globalDispatch({ type: "CLOSE_ADD_PAYMENT_METHOD" });
          }
          if (pathname != "/account/reviews") {
            navigate("/account/reviews");
          }
        },
      },
      {
        selector: ".seventeen-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Manage all bookings made for your space</p>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(9)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(11)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "center",
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '10px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          if (pathname != "/account/my-bookings") {
            navigate("/account/my-bookings");
          }
        },
      },
      {
        selector: ".nineteen-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Chat with your customers</p>
            <span className="font-semibold text-sm mt-1">You will be notified via email when new messages are received.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(10)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(12)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "center",
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          // if (pathname != "/account/messages") {
          navigate("/account/messages");
          // }
        },
      },
      {
        selector: ".fourteen-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Add a new space</p>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(11)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(13)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '30px',
            marginLeft: '30px',
            display: 'flex',
            justify: 'center',
            position: 'center',
            backgroundColor: '#dedede',
          })
        },
        position: "center",
        action: () => {
          // if (pathname != "/account/my-spaces") {
          navigate("/account/my-spaces");
          // }
        },
      },
      {
        selector: ".fifteen-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Input details of your space</p>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(12)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(14)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "center",
        action: () => {
          if (pathname != "/spaces/add") {
            navigate("/spaces/add");
          }
        },
      },
      {
        selector: ".eighteen-step-imag",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Add Images, Addons, Amenities, Faqs for your space</p>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(13)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(15)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "center",
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '-30px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          if (pathname != "/spaces/add/2") {
            navigate("/spaces/add/2");
          }
        },
      },
      {
        selector: ".eighteen-step-schedul",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Add available slots for your space</p>
            <span className="font-semibold text-sm mt-1">Customize and maintain the available slots for your space.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(14)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(16)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "center",
        action: () => {
          if (pathname != "/spaces/add/3") {
            navigate("/spaces/add/3");
          }
        },
      },
      {
        selector: ".eighteen-step-summary",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Review your space details</p>
            <span className="font-semibold text-sm mt-1">Review the final details for your space for approval and posting.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(15)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(17)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        position: "center",
        action: () => {
          if (pathname != "/spaces/add/4") {
            navigate("/spaces/add/4");
          }
        },
      },
      {
        selector: ".sixteen-step",
        content: ({ goTo, inDOM, setCurrentStep }) => (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Submit your space for admin approval</p>
            <span className="font-semibold text-sm mt-1">Once approved, you will receive an email with approval confirmation from our support team and your account will be activated. For questions or concerns, please navigate to the <Link className="underline text-blue-500" to="/faq">FAQs</Link> page.</span>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(16)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => setCurrentStep(18)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        ),
        styles: {
          popover: (base) => ({
            ...base,
            boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
            marginTop: '-30px',
            marginLeft: '20px',
            backgroundColor: '#dedede',
          })
        },
        action: () => {
          if (pathname != "/spaces/add/4") {
            navigate("/spaces/add/4");
          }
        },
      },
      {
        selector: "last_step",
        content: ({ goTo, inDOM, setIsOpen }) => (
          <div className="flex justify-center items-center flex-col">
            <button onClick={() => { endTour(); setIsOpen(false); setCurrentStep(0) }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Done! You can now add your space ready</button>
          </div>
        ),
        position: "center",
        action: () => {
          navigate("/");
        },
      },

    ]

  const customerSteps = [
    {
      selector: '.first-step',
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-[18px] text-start">Navigate to the Profile menu</p>
          <span className="font-semibold text-sm mt-1">From the profile menu, users can manage their profile, view bookings, message hosts, view reviews, manage payments and billing information.</span>
          <button onClick={() => setCurrentStep(1)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
        </div>
      ),
      action: () => {
        if (!globalState?.menuIconOpen) {
          globalDispatch({ type: "OPEN_MENU_ICON" });
        }
      },
      position: "center",
      highlightedSelectors: [".first-step"],
      resizeObservables: [".first-step2"],
      mutationObservables: [".first-step2"],
    },
    {
      selector: '[data-tour="photo-step"]',
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <span className="font-semibold text-sm mt-1">Upload your photo. All photos are subject to approval. For further questions, please visit our <Link className="underline text-blue-500" to="/faq">FAQs</Link> or
            <Link className="underline text-blue-500" to="/help/terms_and_conditions">User Agreement page.</Link></span>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() =>
              setCurrentStep(0)
            } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => {

              setCurrentStep(2); globalDispatch({ type: "CLOSE_MENU_ICON" });
            }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          marginLeft: '30px',
          marginTop: '30px',
          backgroundColor: '#dedede',
        })
      },
      position: "bottom",
      action: () => {
        navigate("/account/profile");
        globalDispatch({ type: "CLOSE_MENU_ICON" });
      },
      mutationObservables: ['[data-tour="photo-step"]'],
    },
    {
      selector: '[data-tour="profile-step"]',
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <span className="font-semibold text-sm mt-1">Complete your About Me and include information about yourself.</span>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() =>

              setCurrentStep(1)

            } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => {
              setCurrentStep(3); globalDispatch({ type: "CLOSE_MENU_ICON" });
            }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          marginLeft: '30px',
          backgroundColor: '#dedede',
        })
      },
      action: () => {
        navigate("/account/profile");
        globalDispatch({ type: "CLOSE_MENU_ICON" });
      },
      mutationObservables: ['[data-tour="about-step"]'],
    },
    {
      selector: '[data-tour="email-step"]',
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <span className="font-semibold text-sm mt-1">Enable or disable Email Alerts for Site Activity if you want to be alerted via email on all site actions.</span>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() =>
              setCurrentStep(2)
            } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => {
              setCurrentStep(4); globalDispatch({ type: "CLOSE_MENU_ICON" });
            }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          backgroundColor: '#dedede',
        })
      },
      position: "center",
      action: () => {
        navigate("/account/profile");
        globalDispatch({ type: "CLOSE_MENU_ICON" });
      },
      mutationObservables: ['[data-tour="email-step"]'],
    },
    {
      selector: '[data-tour="fourth-step"]',
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-sm">Click on Get Verified to submit your identity for verification.</p>
          <div className="flex justify-start gap-4 w-full">
            <div className="flex justify-start gap-4 w-full">
              <button
                onClick={() => setCurrentStep(3)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() =>
                setCurrentStep(5)
              } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next Step</button>
            </div>
          </div>
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          marginTop: '30px',
          backgroundColor: '#dedede',
        })
      },
      action: () => {
        navigate("/account/profile");
        globalDispatch({ type: "CLOSE_MENU_ICON" });
      },
      mutationObservables: ['[data-tour="fourth-step"]'],
    },
    {
      selector: '[data-tour="fifth-step"]',
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-[18px]">Select and Upload a Government issued ID or Passport.</p>
          <span className="font-semibold text-sm mt-1">Identification is subject to approval. The image must be current, legible and expiration date must be valid. For further questions, please review our <Link className="underline text-blue-500" to="/help/terms_and_conditions">User Agreement</Link>.</span>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() =>
              setCurrentStep(4)
            } className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button
              onClick={() =>
                setCurrentStep(6)
              }
              className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          marginTop: '30px',
          marginLeft: '30px',
          display: 'flex',
          justify: 'center',
          position: 'center',
          backgroundColor: '#dedede',
        })
      },
      mutationObservables: ['[data-tour="fifth-step"]'],
    },

    {
      selector: "",
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          backgroundColor: '#dedede',
          marginLeft: '20px',
          marginTop: '-30px',
        })
      },
      action: () => {
        if (pathname != "/account/verification") {
          navigate("/account/verification");
        }
      },
    },
    {
      selector: ".tenth-step",
      content: ({ goTo, inDOM, setCurrentStep }) => {
        return (
          <div className="flex justify-center items-center flex-col">
            <p className="font-semibold text-[18px]">Under Billing, please add your payment methods</p>
            <div className="flex justify-start gap-4 w-full">
              <button onClick={() => setCurrentStep(6)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
              <button onClick={() => {
                setCurrentStep(8)
              }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
            </div>
          </div>
        )
      },
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          marginTop: '30px',
          backgroundColor: '#dedede',
        })
      },
      action: () => {
        if (pathname != "/account/billing") {
          navigate("/account/billing");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        }
      },
    },
    {
      selector: ".twelfth-step",
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-[18px]">Under Payments, view your payment history</p>
          <span className="font-semibold text-sm mt-1">	Payments you’ve made after bookings are completed.</span>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() => setCurrentStep(7)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => setCurrentStep(9)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      position: "center",
      action: () => {
        if (pathname != "/account/payments") {
          navigate("/account/payments");
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        }
      },
    },
    {
      selector: ".thirteenth-step",
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-[18px]">View your review history</p>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() => setCurrentStep(8)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => setCurrentStep(10)}
              className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      position: "center",
      action: () => {
        if (globalState.menuIconOpen) {
          globalDispatch({ type: "CLOSE_MENU_ICON" });
        }
        if (globalState.addPaymentMethodModal) {
          globalDispatch({ type: "CLOSE_ADD_PAYMENT_METHOD" });
        }
        if (pathname != "/account/reviews") {
          navigate("/account/reviews");
        }
      },
    },
    {
      selector: ".seventeen-step",
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-[18px]">View your booking history</p>
          <div className="flex justify-start items-center gap-4 w-full">
            <button onClick={() => setCurrentStep(9)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => setCurrentStep(11)}
              className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      position: "center",
      action: () => {
        if (pathname != "/account/my-bookings") {
          navigate("/account/my-bookings");
        }
      },
    },
    {
      selector: ".nineteen-step",
      content: ({ goTo, inDOM, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <p className="font-semibold text-[18px]">View and manage your messages with your hosts</p>
          <span className="font-semibold text-sm mt-1">You will be notified via email when new messages are received.</span>
          <div className="flex justify-start gap-4 w-full">
            <button onClick={() => setCurrentStep(10)} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Prev step</button>
            <button onClick={() => setCurrentStep(12)}
              className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Next step</button>
          </div>
        </div>
      ),
      styles: {
        popover: (base) => ({
          ...base,
          boxShadow: '0 0 3em rgba(0, 0, 0, 0.5)',
          marginLeft: '10px',
          backgroundColor: '#dedede',
        })
      },
      action: () => {
        if (pathname != "/account/messages") {
          navigate("/account/messages");
        }
      },
    },
    {
      selector: "last_step",
      content: ({ goTo, inDOM, setIsOpen, setCurrentStep }) => (
        <div className="flex justify-center items-center flex-col">
          <button onClick={() => { endTour(); setIsOpen(false); setCurrentStep(0) }} className="bg-[#0ba68a] text-white py-[7px] px-[10px] mt-2 rounded-md">Done! You are ready to search and book your new space</button>
        </div>
      ),
      position: "center",
      action: () => {
        navigate("/");
      },
    },


  ]


  return (
    <div className="h-full">
      <ScrollToTop />

      {state.role == "host" &&
        <TourProvider
          Wrapper={React.Fragment}
          styles={styles}
          margin={4}
          showNavigation={false}
          showButtons={false}
          startAt={0}
          disableInteraction={true}
          scrollSmooth
          transition={true}
          onTransition={(pos, prev) => {
            return [prev.x, prev.y]
          }}
          setCurrentStep={setCurrentStep}
          currentStep={step}
          accentColor="#0ba68a"
          steps={hostSteps}
          onClickClose={({ setIsOpen, setCurrentStep }) => { setIsOpen(false); globalDispatch({ type: "CLOSE_MENU_ICON" }); setCurrentStep(0) }}
          onClickMask={({ setIsOpen, setCurrentStep }) => { setIsOpen(false); globalDispatch({ type: "CLOSE_MENU_ICON" }); setCurrentStep(0) }}
          isOpen={globalState?.tourOpen}>
          <div className="flex">
            {!state.isAuthenticated ? <PublicHeader /> : renderHeader(state.role)}
            <div className={`w-full ${["superadmin", "admin"].includes(state.role) ? "bg-gray-100" : "customer-section bg-white"}`}>
              {state.isAuthenticated && ["superadmin", "admin"].includes(state.role) ? <TopHeader /> : null}
              <div
                className={`page-wrapper capitalize ${!state.isAuthenticated || !["superadmin", "admin"].includes(state.role) ? "max-w-screen" : "md:max-w-[82vw]"} ${["superadmin", "admin"].includes(state.role) ? "h-screen px-5 py-10 pb-10 lg:max-h-screen lg:overflow-y-auto" : "bg-[#F9FAFB]"
                  }  `}
              >
                {!state.isAuthenticated ? renderRoutes("none") : renderRoutes(state.role)}

                {globalState.showModal ? (
                  <Modal
                    showModal={globalState.showModal}
                    modalShowTitle={globalState.modalShowTitle}
                    type={globalState.type}
                    modalShowMessage={globalState.modalShowMessage}
                    modalBtnText={globalState.modalBtnText}
                    itemId={globalState.itemId}
                    itemId2={globalState.itemId2}
                    table1={globalState.table1}
                    table2={globalState.table2}
                    backTo={globalState.backTo}
                  />
                ) : null}
                {globalState.showReview ? (
                  <ReviewPopUp
                    showReview={globalState.showReview}
                    review={globalState.review}
                  />
                ) : null}
                <ErrorModal />
                <ConfirmationModal />
                {state.role == "host" && <HostGettingStartedTour />}
              </div>
              <Footer />
            </div>
          </div>
        </TourProvider>
      }
      {state.role != "host" &&
        <TourProvider
          Wrapper={React.Fragment}
          styles={styles}
          showNavigation={false}
          showButtons={false}
          startAt={0}
          disableInteraction={true}
          scrollSmooth
          setCurrentStep={setCurrentStep}
          currentStep={step}
          accentColor="#0ba68a"
          steps={customerSteps}
          onClickClose={({ setIsOpen, setCurrentStep }) => { setIsOpen(false); globalDispatch({ type: "CLOSE_MENU_ICON" }); setCurrentStep(0) }}
          onClickMask={({ setIsOpen, setCurrentStep }) => { setIsOpen(false); globalDispatch({ type: "CLOSE_MENU_ICON" }); setCurrentStep(0) }}
          isOpen={globalState?.tourOpen}>
          <div className="flex">
            {!state.isAuthenticated ? <PublicHeader /> : renderHeader(state.role)}
            <div className={`w-full ${["superadmin", "admin"].includes(state.role) ? "bg-gray-100" : "customer-section bg-white"}`}>
              {state.isAuthenticated && ["superadmin", "admin"].includes(state.role) ? <TopHeader /> : null}
              <div
                className={`page-wrapper capitalize ${!state.isAuthenticated || !["superadmin", "admin"].includes(state.role) ? "max-w-screen" : "md:max-w-[82vw]"} ${["superadmin", "admin"].includes(state.role) ? "h-screen px-5 py-10 pb-10 lg:max-h-screen lg:overflow-y-auto" : "bg-[#F9FAFB]"
                  }  `}
              >
                {!state.isAuthenticated ? renderRoutes("none") : renderRoutes(state.role)}

                {globalState.showModal ? (
                  <Modal
                    showModal={globalState.showModal}
                    modalShowTitle={globalState.modalShowTitle}
                    type={globalState.type}
                    modalShowMessage={globalState.modalShowMessage}
                    modalBtnText={globalState.modalBtnText}
                    itemId={globalState.itemId}
                    itemId2={globalState.itemId2}
                    table1={globalState.table1}
                    table2={globalState.table2}
                    backTo={globalState.backTo}
                  />
                ) : null}
                {globalState.showReview ? (
                  <ReviewPopUp
                    showReview={globalState.showReview}
                    review={globalState.review}
                  />
                ) : null}
                <ErrorModal />
                <ConfirmationModal />
                {state.role == "customer" && <CustomerGettingStartedTour />}
              </div>
              <Footer />
            </div>
          </div>
        </TourProvider>
      }

      <SessionExpiredModal />
      <NotVerifiedModal />
      <SnackBar />
      <LoadingSpinner />
    </div>
  );
}

export default Main;
