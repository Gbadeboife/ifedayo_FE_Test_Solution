import React, { useState } from "react";
import { useContext } from "react";
import { Calendar } from "react-calendar";
import { useLocation, useNavigate, useParams } from "react-router";
import AvailabilityTemplate from "@/components/frontend/AvailabilityTemplate";
import NextIcon from "@/components/frontend/icons/NextIcon";
import PrevIcon from "@/components/frontend/icons/PrevIcon";
import { GlobalContext } from "@/globalContext";
import { useEffect } from "react";
import { useSpaceContext } from "./spaceContext";
import MkdSdk from "@/utils/MkdSDK";
import EditScheduleDay from "./EditScheduleDay";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { DRAFT_STATUS } from "@/utils/constants";
import NoteIcon from "@/components/frontend/icons/NoteIcon";
import { Tab } from "@headlessui/react";
import SelectTemplatesModal from "@/pages/Host/Spaces/Add/SelectTemplatesModal";
import CreateTemplateModal from "@/pages/Host/Spaces/Add/CreateTemplateModal";
import { usePropertyAddons, usePropertySpace, usePropertySpaceAmenities } from "@/hooks/api";
import moment from "moment";

let sdk = new MkdSdk();

const EditSpaceSchedulingPage = () => {
  const { id } = useParams();
  const { state: scheduleTemplate } = useLocation();
  const [render, forceRender] = useState(new Date());
  // const dayFormatted = moment(date).format("MM/DD/YY");

  const { propertySpace, notFound } = usePropertySpace(id, render);
console.log(scheduleTemplate)


  const [searchParams] = useSearchParams();
  const [addTemplatePopup, setAddTemplatePopup] = useState(false);
  const [selectTemplatePopup, setSelectTemplatePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(scheduleTemplate);
  const { spaceData, dispatch } = useSpaceContext();
  const spaceAddons = usePropertyAddons(propertySpace.property_id);
  const spaceAmenities = usePropertySpaceAmenities(propertySpace.property_id);

  useEffect(() => {
    dispatch({ type: "SET_ADDONS", payload: spaceAddons })
    dispatch({ type: "SET_AMENITIES", payload: spaceAmenities })
    if (scheduleTemplate?.custom_slots) {
      for (let index = 0; index < Object?.keys(JSON.parse(scheduleTemplate?.custom_slots)).length; index++) {
        const elementDay = Object.keys(JSON.parse(scheduleTemplate?.custom_slots))[index];
        const elementTime = Object.values(JSON.parse(scheduleTemplate?.custom_slots))[index];
        dispatch({
          type: "SET_DAY_SLOT",
          payload: {
            day: elementDay,
            slots: elementTime,
          },
        });
      }
    }
  }, []);


  const navigate = useNavigate();


  async function fetchTemplates() {
    const host_id = Number(localStorage.getItem("user"));
    sdk.setTable("schedule_template");
    try {
      const result = await sdk.callRestAPI({ payload: { host_id } }, "GETALL");
      if (Array.isArray(result.list)) {
        setTemplates(result.list);
      }

    } catch (err) {
      console.log("error", err)
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function changeDraftStatus(space_id, newStatus) {
    try {
      const result = await axios.post("https://ergo.mkdlabs.com/rest/property_spaces/PUT",
        { id: Number(space_id), draft_status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-project": "ZXJnbzprNWdvNGw1NDhjaDRxazU5MTh4MnVsanV2OHJxcXAyYXM",
          },
        },
      );
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, [render]);

  useEffect(() => {
    dispatch({ type: "SET_INITIAL_SCHEDULING", payload: scheduleTemplate });
  }, []);

  async function submitSchedule(draftType) {
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
    globalDispatch({ type: "START_LOADING" });

    const mode = searchParams.get("mode");

    try {
      // create/edit scheduling
      sdk.setTable("property_spaces_schedule_template");
      if (mode == "create") {
        await sdk.callRestAPI(
          {
            property_spaces_id: Number(id),
            schedule_template_id: selectedTemplate.id,
            custom_slots: JSON.stringify(spaceData?.customSlots),
          },
          "POST",
        );
        await changeDraftStatus(id, DRAFT_STATUS.COMPLETED);
      }
      // console.log(JSON.stringify(spaceData?.customSlots))
      else {
        sdk.setTable("property_spaces_schedule_template");

        await sdk.callRestAPI(
          {
            id: scheduleTemplate.schedule_id,
            schedule_template_id: selectedTemplate.id,
            custom_slots: JSON.stringify(spaceData?.customSlots),
          },
          "PUT",
        );
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
    dispatch({ type: "SET_SCHEDULE_TEMPLATE", payload: selectedTemplate });
    if (draftType === "continue") {
      navigate(`/account/my-spaces/${id}/edit-review`, { state: { selectedTemplate, spaceAmenities, spaceAddons } });
    } else {
      navigate(`/account/my-spaces/${id}`);
    }
  }

  return (
    <div className="min-h-screen bg-white pb-8 normal-case">
      <h1 className="mb-8 text-4xl font-bold">Edit Scheduling</h1>
      <div className="mb-[32px] max-w-3xl rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-[24px] py-[16px]">
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
        <Tab.List className={"two-tab-menu smaller border-b"}>
          <Tab className={"p-2 px-4 focus:outline-none ui-selected:font-semibold"}>Calendar</Tab>
          <Tab className={"p-2 px-4 focus:outline-none ui-selected:font-semibold"}>Templates</Tab>
          <div className="mover"></div>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div
              className="py-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pl-1 mb-2">
                <button
                  className="use-template"
                  onClick={(e) => {
                    setSelectTemplatePopup(true);
                  }}
                >
                  Use Template
                </button>
              </div>
              <Calendar
                className="scheduling-calendar"
                onChange={(v) => {
                  setSelectedDate(v);
                }}
                value={selectedDate}
                defaultValue={selectedDate}
                nextLabel={
                  <>
                    <div className="flex gap-4">
                      <div className="w-[40px] border p-[10px] px-[15px]">
                        <NextIcon />
                      </div>
                    </div>
                  </>
                }
                prevLabel={<PrevIcon />}
                navigationLabel={({ date, label, locale, view }) => (
                  <>
                    <div
                      className="flex justify-center gap-4 border-2 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{label}</span>
                      <div className={"rotate-90 duration-200"}>
                        {/* <NextIcon /> */}
                      </div>
                    </div>
                  </>
                )}
                tileContent={({ activeStartDate, date, view }) => {
                  return (
                    <EditScheduleDay
                      activeStartDate={activeStartDate}
                      date={date}
                      view={view}
                      id={id}
                      schedule_id={scheduleTemplate?.schedule_id}
                      selected_id={selectedTemplate?.id}
                      selectedDate={selectedDate}
                      selectedTemplate={selectedTemplate}
                    />
                  );
                }}
                minDate={new Date()}
              />
            </div>
            <SelectTemplatesModal
              modalOpen={selectTemplatePopup}
              dispatch={dispatch}
              closeModal={() => setSelectTemplatePopup(false)}
              clearAll={() => dispatch({ type: "CLEAR_ALL_SLOTS" })}
              templates={templates}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
            />
          </Tab.Panel>
          <Tab.Panel className={"pt-[70px]"}>
            <div className="flex flex-wrap-reverse justify-between p-[12px]">
              <div className="flex">
                <p className="w-[250px] md:w-[340px]">Template name & day(s)</p>
                <p>Time slots</p>
              </div>
              <button
                className="mb-0 font-semibold text-[#1570EF] md:mb-4"
                onClick={() => setAddTemplatePopup(true)}
              >
                + Create new template
              </button>
            </div>
            {templates.map((tmp) => (
              <AvailabilityTemplate
                key={tmp.id}
                data={tmp}
                forceRender={forceRender}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
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
        onClick={() => submitSchedule("continue")}
        type="submit"
        className="login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
      >
        Continue
      </button>
      <br />
      <button
        type="button"
        className="login-btn-gradient rounded mt-3 py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        onClick={() => submitSchedule("submit")}
      >
        Save
      </button>
    </div>
  );
};

export default EditSpaceSchedulingPage;
