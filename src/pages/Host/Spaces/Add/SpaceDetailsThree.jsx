import React, { useState } from "react";
import { useContext } from "react";
import { Calendar } from "react-calendar";
import { useNavigate } from "react-router";
import NextIcon from "@/components/frontend/icons/NextIcon";
import PrevIcon from "@/components/frontend/icons/PrevIcon";
import ScheduleDay from "@/pages/Host/Spaces/Add/ScheduleDay";
import { GlobalContext } from "@/globalContext";
import { useEffect } from "react";
import { useSpaceContext } from "./spaceContext";
import MkdSdk from "@/utils/MkdSDK";

import NoteIcon from "@/components/frontend/icons/NoteIcon";
import { DRAFT_STATUS, IMAGE_STATUS, SPACE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import { Tab } from "@headlessui/react";
import SelectTemplatesModal from "./SelectTemplatesModal";
import CreateTemplateModal from "./CreateTemplateModal";
import TemplateCard from "./TemplateCard";

let sdk = new MkdSdk();

const SpaceDetailsThree = () => {
  const [addTemplatePopup, setAddTemplatePopup] = useState(false);
  const [selectTemplatePopup, setSelectTemplatePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const [templates, setTemplates] = useState([]);
  const [render, forceRender] = useState(new Date());
  const [selectedTemplate, setSelectedTemplate] = useState({});
  const { spaceData, dispatch } = useSpaceContext();
  const [templatesFetched, setTemplatesFetched] = useState(false);

  const navigate = useNavigate();

  async function fetchTemplates() {
    const host_id = localStorage.getItem("user");
    const payload = { host_id };
    sdk.setTable("schedule_template");
    try {
      const result = await sdk.callRestAPI({ payload }, "GETALL");
      if (Array.isArray(result.list)) {
        setTemplates(result.list);
        setTemplatesFetched(true);
      }
    } catch (err) {
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
    fetchTemplates();
  }, [render]);

  useEffect(() => {
    if (templatesFetched && spaceData?.schedule_template?.id) {
      setSelectedTemplate(templates.find((tmp) => tmp.id == spaceData.schedule_template.id));
    }
  }, [templatesFetched]);

  async function submitSchedule() {
    if (selectedTemplate?.slots?.length < 1 || selectedTemplate?.slots === "[]") {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: { heading: "Template selected doesn't have a slot", message: "Click on Use Template and Add Slot Time" },
      });
      return;
    }
    if (!selectedTemplate.id) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: { heading: "Template was not selected", message: "Click on Use Template and Select a Schedule Template" },
      });
      return;
    }
    console.log(selectedTemplate)
    dispatch({ type: "SET_SCHEDULE_TEMPLATE", payload: selectedTemplate });
    navigate("/spaces/add/4");
  }

  const onSaveDraft = async () => {
    if (selectedTemplate?.slots && selectedTemplate?.slots?.length < 1 || selectedTemplate?.slots === "[]") {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: { heading: "Template selected doesn't have a slot", message: "Click on Use Template and Add Slot Time" },
      });
      return;
    }

    if (!selectedTemplate.id && selectedTemplate?.slots) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: { heading: "Template was not selected", message: "Click on Use Template and Select a Schedule Template" },
      });
      return;
    }

    const host_id = localStorage.getItem("user");
    globalDispatch({ type: "START_LOADING" });
    var propertyResult, propertySpaceResult;
    if (!spaceData.property_id) {
      sdk.setTable("property");
      propertyResult = await sdk.callRestAPI(
        {
          address_line_1: spaceData.address_line_1,
          address_line_2: spaceData.address_line_2,
          city: spaceData.city,
          country: spaceData.country,
          zip: spaceData.zip,
          status: 1,
          verified: 1,
          host_id,
          name: spaceData.name,
          rule: spaceData.rule,
        },
        "POST",
      );
      dispatch({ type: "SET_PROPERTY_ID", payload: propertyResult?.message });
    }

    // create space
    if (!spaceData.property_space_id) {
      sdk.setTable("property_spaces");
      propertySpaceResult = await sdk.callRestAPI(
        {
          property_id: propertyResult?.message ?? spaceData.property_id,
          space_id: spaceData.category,
          max_capacity: spaceData.max_capacity,
          description: spaceData.description,
          rate: spaceData.rate,
          space_status: SPACE_STATUS.UNDER_REVIEW,
          availability: SPACE_VISIBILITY.VISIBLE,
          draft_status: DRAFT_STATUS.SCHEDULING,
          additional_guest_rate: spaceData.additional_guest_rate || undefined,
          size: spaceData.size || undefined,
        },
        "POST",
      );
    }
    try {
      // create property add ons
      sdk.setTable("property_add_on");
      for (let i = 0; i < spaceData.addons.length; i++) {
        const addon_id = spaceData.addons[i];
        await sdk.callRestAPI(
          {
            property_id: propertyResult?.message,
            add_on_id: addon_id,
          },
          "POST",
        );
      }

      // create property space images
      for (let i = 0; i < spaceData.pictureIds.length; i++) {
        sdk.setTable("property_spaces_images");
        const pictureId = spaceData.pictureIds[i];
        if (pictureId) {
          await sdk.callRestAPI(
            {
              property_id: propertyResult.message,
              property_spaces_id: propertySpaceResult.message,
              photo_id: pictureId,
              is_approved: IMAGE_STATUS.IN_REVIEW,
            },
            "POST",
          );
        }
        if (pictureId && pictureId == spaceData.thumbnail) {
          sdk.setTable("property_spaces");
          await sdk.callRestAPI(
            {
              id: propertySpaceResult.message,
              default_image_id: spaceData.thumbnail,
            },
            "PUT",
          );
        }
      }

      // create property space faqs
      sdk.setTable("property_space_faq");
      for (let i = 0; i < spaceData.faqs.length; i++) {
        const faq = spaceData.faqs[i];
        await sdk.callRestAPI(
          {
            property_space_id: propertySpaceResult.message,
            question: faq.question,
            answer: faq.answer,
          },
          "POST",
        );
      }

      // create property space amenities
      sdk.setTable("property_spaces_amenitites");
      for (let i = 0; i < spaceData.amenities.length; i++) {
        const amenity_id = spaceData.amenities[i];
        await sdk.callRestAPI(
          {
            property_spaces_id: propertySpaceResult.message,
            amenity_id,
          },
          "POST",
        );
      }

      // create scheduling
      sdk.setTable("property_spaces_schedule_template");
      await sdk.callRestAPI(
        {
          property_spaces_id: propertySpaceResult.message,
          schedule_template_id: selectedTemplate.id,
          custom_slots: JSON.stringify(spaceData.customSlots),
        },
        "POST",
      );
      navigate("/account/my-spaces");
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  };

  // useEffect(() => {
  //   if (!spaceData.name) {
  //     navigate("/spaces/add");
  //   }
  // }, []);

  return (
    <div className="min-h-screen bg-white pb-8">
      <h1 className="mb-8 text-4xl font-bold">Space Details</h1>
      <div className="mb-[32px] max-w-3xl rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-4 py-[16px] md:px-[24px]">
        <h3 className="text-lg flex items-center gap-2 font-semibold">
          <NoteIcon />
          <span>How it works</span>
        </h3>
        <p className="ml-6 max-w-2xl text-sm leading-relaxed">
          You can predefine each day of the week in <b>’Templates’</b> - those hours will be applied to each day of the week. On top of that you can customize each day according to your needs.
          <br />
          <br /> You will be able to edit and change the space availability anytime from in ‘Spaces/space/edit availability’.
        </p>
      </div>

      <Tab.Group>
        <Tab.List className="two-tab-menu smaller border-b">
          <Tab className="py-2 px-4 ui-selected:font-semibold">Calendar</Tab>
          <Tab className="py-2 px-4 ui-selected:font-semibold">Templates</Tab>
          <div className="mover"></div>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div
              className="py-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Calendar
                className="scheduling-calendar eighteen-step-schedule"
                onChange={setSelectedDate}
                value={selectedDate}
                defaultValue={selectedDate}
                nextLabel={
                  <>
                    <div className="flex gap-4">
                      <div className="w-[40px] border p-[10px] px-[15px]">
                        <NextIcon />
                      </div>
                      <button
                        className="use-template !hidden md:!inline bg-[linear-gradient(230.69deg, #33d4b7 9.11%, #0d9895 69.45%)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectTemplatePopup(true);
                        }}
                      >
                        Use Template
                      </button>
                    </div>
                  </>
                }
                prevLabel={<PrevIcon />}
                next2Label={
                  <>
                    <button
                      className="use-template"
                      style={{ backgroundColor: 'linear-gradient(230.69deg, #33d4b7 9.11%, #0d9895 69.45%) !important' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectTemplatePopup(true);
                      }}
                    >
                      Use Template
                    </button>
                  </>
                }
                prev2Label={<></>}
                navigationLabel={({ date, label, locale, view }) => (
                  <>
                    <div
                      className="flex justify-center gap-4 border-2 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{label}</span>
                      <div className={"rotate-90 duration-200"}>
                        <NextIcon />
                      </div>
                    </div>
                  </>
                )}
                tileContent={({ activeStartDate, date, view }) => {
                  return (
                    <ScheduleDay
                      activeStartDate={activeStartDate}
                      date={date}
                      view={view}
                      selectedDate={selectedDate}
                      selectedTemplate={selectedTemplate}
                    />
                  );
                }}
                minDate={new Date()}
                maxDetail="month"
              />
            </div>
            <SelectTemplatesModal
              modalOpen={selectTemplatePopup}
              closeModal={() => setSelectTemplatePopup(false)}
              clearAll={() => dispatch({ type: "CLEAR_ALL_SLOTS" })}
              templates={templates}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
            />
          </Tab.Panel>
          <Tab.Panel className="pt-[70px] text-sm md:text-base">
            <div className="flex justify-between p-[12px]">
              <div className="flex">
                <p className="md:min-w-[370px]">Template name & day(s)</p>
                <p>Time slots</p>
              </div>
              <button
                className="font-semibold text-[#1570EF]"
                onClick={() => setAddTemplatePopup(true)}
              >
                + Create new template
              </button>
            </div>
            {templates.map((tmp) => (
              <TemplateCard
                key={tmp.id}
                data={tmp}
                forceRender={forceRender}
              />
            ))}
            {templates.length == 0 && (
              <p className="flex h-40 items-center justify-center">
                <NoteIcon />
                <span className="ml-2"></span> No templates yet
              </p>
            )}
            <CreateTemplateModal
              modalOpen={addTemplatePopup}
              closeModal={() => setAddTemplatePopup(false)}
              onSuccess={() => fetchTemplates()}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <p className="flex gap-2 text-[#475467]">
        <NoteIcon /> Keep in mind it usually takes us 2 days to review new space. Once we approve it it wil be posted with the first date/time available
      </p>
      <hr className="my-[30px]" />
      <button
        type="button"
        className="login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        onClick={submitSchedule}
      >
        Continue
      </button>
      <br />
      <button
        type="button"
        id="save-as-draft"
        className="mt-[24px] rounded border-2 border-[#98A2B3] py-2 px-4 tracking-wide outline-none focus:outline-none"
        onClick={() => onSaveDraft()}
      >
        Save draft and exit
      </button>
    </div>
  );
};

export default SpaceDetailsThree;
