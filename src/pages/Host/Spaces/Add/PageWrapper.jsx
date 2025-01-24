import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import Icon from "@/components/Icons";
import { SpaceContextProvider } from "./spaceContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import useAddonCategories from "@/hooks/api/useAddonCategories";
import useAmenityCategories from "@/hooks/api/useAmenityCategories";
import useRuleTemplates from "@/hooks/api/useRuleTemplates";
const sdk = new MkdSDK();

const PageWrapper = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const arr = pathname.split("/");
  const currentStep = Number(arr[arr.length - 1]) || 1;
  const { state: globalState } = useContext(GlobalContext);
  const amenities = useAmenityCategories();
  const addons = useAddonCategories();
  const ruleTemplates = useRuleTemplates(globalState.user.id);
  const spaceCategories = globalState.spaceCategories;

  return (
    <SpaceContextProvider>
      <div className="container mx-auto w-full px-4 pt-[100px] normal-case md:pt-[110px] 2xl:px-32">
        {currentStep < 5 && (
          <div className="flex flex-wrap-reverse items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
            >
              <Icon
                type="arrow"
                variant="narrow-left"
                className="h-4 w-4 stroke-[#667085]"
              />{" "}
              <span className="ml-2">Back</span>
            </button>
            <div className="mx-auto mb-3 flex max-w-full gap-1">
              <div className={`${currentStep > 1 ? "bg-my-gradient" : "bg-[#F2F4F7]"} w-[80px] rounded-lg border py-1 md:w-24`}></div>
              <div className={`${currentStep > 2 ? "bg-my-gradient" : "bg-[#F2F4F7]"} w-[80px] rounded-lg border py-1 md:w-24`}></div>
              <div className={`${currentStep > 3 ? "bg-my-gradient" : "bg-[#F2F4F7]"} w-[80px] rounded-lg border py-1 md:w-24`}></div>
              <div className={`${currentStep > 4 ? "bg-my-gradient" : "bg-[#F2F4F7]"} w-[80px] rounded-lg border py-1 md:w-24`}></div>
            </div>
          </div>
        )}

        <Outlet context={{ amenities, spaceCategories, addons, ruleTemplates }} />
      </div>
    </SpaceContextProvider>
  );
};

export default PageWrapper;
