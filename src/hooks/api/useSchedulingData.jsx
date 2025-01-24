import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import React from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";

export default function useSchedulingData({ property_space_id }) {
  const [bookedSlots, setBookedSlots] = useState([]);
  const [scheduleTemplate, setScheduleTemplate] = useState({});
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchBookedSlots(id) {
    try {
      const result = await callCustomAPI("customer/schedule", "post", { property_spaces_id: id }, "", null, "v3");
      if (Array.isArray(result.list)) {
        setBookedSlots(result.list);
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
  }

  async function fetchScheduleTemplate(id) {
    try {
      const result = await callCustomAPI(
        "property_spaces_schedule_template",
        "post",
        {
          page: 1,
          limit: 1,
          where: [`property_spaces_id = ${id}`],
        },
        "PAGINATE",
      );
      if (Array.isArray(result.list) && result.list.length > 0) {
        setScheduleTemplate({ custom_slots: result.list[0].custom_slots });
      }
      if (result.list[0]?.schedule_template_id) {
        const templateResult = await callCustomAPI(
          "schedule_template",
          "post",
          {
            page: 1,
            limit: 1,
            where: [`id = ${result.list[0].schedule_template_id}`],
          },
          "PAGINATE",
        );
        if (Array.isArray(templateResult.list) && (templateResult.list[0] ?? {})) {
          setScheduleTemplate((prev) => {
            let updated = { ...prev, ...templateResult.list[0] };
            return updated;
          });
        }
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
  }

  useEffect(() => {
    if (property_space_id) {
      fetchBookedSlots(property_space_id);
      fetchScheduleTemplate(property_space_id);
    }
  }, [property_space_id]);

  return { bookedSlots, scheduleTemplate };
}
