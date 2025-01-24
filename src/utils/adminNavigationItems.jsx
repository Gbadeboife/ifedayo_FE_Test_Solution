import AddIcon from "@/components/frontend/icons/AddIcon";
import PictureIcon from "@/components/frontend/icons/PictureIcon";
import {
  ArchiveBoxXMarkIcon,
  BanknotesIcon,
  BellAlertIcon,
  BookOpenIcon,
  BookmarkIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  Cog8ToothIcon,
  CreditCardIcon,
  DeviceTabletIcon,
  EnvelopeIcon,
  HashtagIcon,
  HomeIcon,
  IdentificationIcon,
  PhotoIcon,
  PlusCircleIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  QueueListIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  StarIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { AdjustmentsHorizontalIcon, BookmarkSlashIcon } from "@heroicons/react/24/solid";

const adminNavigationItems = [
  {
    title: "Dashboard",
    path: "dashboard",
    icon: <Squares2X2Icon className="h-6 w-6" />,
  },
  {
    title: "Users",
    path: "user",
    icon: <UserGroupIcon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Hosts",
        path: "host",
        icon: <BuildingLibraryIcon className="h-6 w-6" />,
      },
      {
        title: "Customers",
        path: "customer",
        icon: <UserCircleIcon className="h-6 w-6" />,
      },
    ],
  },
  {
    title: "Devices",
    path: "device",
    icon: <DeviceTabletIcon className="h-6 w-6" />,
  },
  {
    title: "ID Verification",
    path: "id_verification",
    icon: <IdentificationIcon className="h-6 w-6" />,
  },
  {
    title: "Properties",
    path: "property",
    icon: <BuildingOffice2Icon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Add-on",
        path: "property_add_on",
        icon: <PuzzlePieceIcon className="h-6 w-6" />,
      },
    ],
  },
  {
    title: "Categories",
    path: "spaces",
    icon: <Square3Stack3DIcon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Space",
        path: "spaces",
        icon: <HomeIcon className="h-6 w-6" />,
      },
      {
        title: "Add-on",
        path: "add_on",
        icon: <PuzzlePieceIcon className="h-6 w-6" />,
      },
      {
        title: "Amenity",
        path: "amenity",
        icon: <PlusCircleIcon className="h-6 w-6" />,
      },
    ],
  },

  {
    title: "Property Spaces",
    path: "property_spaces",
    icon: <HomeIcon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Images",
        path: "property_spaces_images",
        icon: <PhotoIcon className="h-6 w-6" />,
      },
      {
        title: "Amenities",
        path: "property_spaces_amenitites",
        icon: <PlusCircleIcon className="h-6 w-6" />,
      },
      {
        title: "Faqs",
        path: "property_spaces_faq",
        icon: <QuestionMarkCircleIcon className="h-6 w-6" />,
      },
    ],
  },

  {
    title: "Bookings",
    path: "booking",
    icon: <BookOpenIcon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Add-ons",
        path: "booking_addons",
        icon: <PuzzlePieceIcon className="h-6 w-6" />,
      },
    ],
  },
  {
    title: "Payout",
    path: "payout",
    icon: <BanknotesIcon className="h-6 w-6" />,
  },
  {
    title: "Payout methods",
    path: "payout_method",
    icon: <CreditCardIcon className="h-6 w-6" />,
  },
  {
    title: "Hashtags",
    path: "hashtag",
    icon: <HashtagIcon className="h-6 w-6" />,
  },
  {
    title: "Review",
    path: "review",
    icon: <StarIcon className="h-6 w-6" />,
  },
  {
    title: "FAQ",
    path: "faq",
    icon: <QuestionMarkCircleIcon className="h-6 w-6" />,
  },
  {
    title: "Reports",
    path: "reports",
    icon: <ChartBarIcon className="h-6 w-6" />,
  },
  {
    title: "Email",
    path: "email",
    icon: <EnvelopeIcon className="h-6 w-6" />,
  },
  {
    title: "Notifications",
    path: "notification",
    icon: <BellAlertIcon className="h-6 w-6" />,
  },
  {
    title: "CMS",
    path: "privacy",
    icon: <ClipboardDocumentIcon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Privacy policy",
        path: "privacy",
        icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />,
      },
      {
        id: 24,
        title: "Terms & Conditions",
        path: "terms_and_conditions",
        icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
      },
      {
        id: 25,
        title: "Cancellation Policy",
        path: "cancellation_policy",
        icon: <ArchiveBoxXMarkIcon className="h-6 w-6" />,
      },
    ],
  },
  {
    title: "Settings",
    path: "settings",
    icon: <Cog8ToothIcon className="h-6 w-6" />,
  },
  {
    title: "Profile",
    path: "profile",
    icon: <UserIcon className="h-6 w-6" />,
  },
  {
    title: "Recycle bin",
    path: "recycle_bin_users",
    icon: <TrashIcon className="h-6 w-6" />,
    sub_categories: [
      {
        title: "Users",
        path: "recycle_bin_users",
        icon: <UserGroupIcon className="h-6 w-6" />,
      },
      {
        title: "Devices",
        path: "recycle_bin_devices",
        icon: <DeviceTabletIcon className="h-6 w-6" />,
      },
      {
        title: "Properties",
        path: "recycle_bin_properties",
        icon: <BuildingOfficeIcon className="h-6 w-6" />,
      },
      {
        title: "Property Addons",
        path: "recycle_bin_properties_addon",
        icon: <AddIcon className="h-6 w-6" />,
      },
      {
        title: "Bookings",
        path: "recycle_bin_booking",
        icon: <BuildingOfficeIcon className="h-6 w-6" />,
      },
      {
        title: "Booking Addons",
        path: "recycle_bin_booking_addon",
        icon: <AddIcon className="h-6 w-6" />,
      },
      {
        title: "Property Spaces",
        path: "recycle_bin_properties_spaces",
        icon: <HomeIcon className="h-6 w-6" />,
      },
      {
        title: "Space Images",
        path: "recycle_bin_properties_space_images",
        icon: <PictureIcon className="h-6 w-6" />,
      },
      {
        title: "Space Amenities",
        path: "recycle_bin_properties_space_amenities",
        icon: <PlusCircleIcon className="h-6 w-6" />,
      },
      {
        title: "Spaces Faqs",
        path: "recycle_bin_properties_space_faq",
        icon: <QueueListIcon className="h-6 w-6" />,
      },
      {
        title: "Spaces",
        path: "recycle_bin_spaces",
        icon: <SparklesIcon className="h-6 w-6" />,
      },
      {
        title: "Faqs",
        path: "recycle_bin_faqs",
        icon: <QuestionMarkCircleIcon className="h-6 w-6" />,
      },
      {
        title: "Hashtags",
        path: "recycle_bin_hashtag",
        icon: <HashtagIcon className="h-6 w-6" />,
      },
      {
        title: "Payout",
        path: "recycle_bin_payout",
        icon: <BanknotesIcon className="h-6 w-6" />,
      },
    ],
  },
];

export default adminNavigationItems;
