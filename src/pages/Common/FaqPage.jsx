import React, { useState } from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FaqTile from "@/components/frontend/FaqTile";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { Tab } from "@headlessui/react";

const FaqPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [faqs, setFaqs] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchFaqs() {
    globalDispatch({ type: "START_LOADING" });
    try {
      const result = await callCustomAPI(
        "faq",
        "post",
        {
          page: 1,
          limit: 1000,
          where: [`1`],
        },
        "PAGINATE",
      );
      if (Array.isArray(result.list)) {
        setFaqs(result.list);
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
    fetchFaqs();
  }, []);

  return (
    <>
      <section className="bg-black pb-[80px] pt-[170px] md:pt-[120px]">
        <h1 className="text-center text-4xl font-semibold text-white md:text-7xl">Frequently asked questions</h1>
      </section>
      <section className="container mx-auto min-h-screen px-4 pt-[40px] pb-[140px] normal-case 2xl:px-16">
        <p className="px-4 md:px-0">Below are some common questions people ask.</p>
        <Tab.Group
          as={"div"}
          className="mt-8"
          onChange={(v) => {
            setSearchParams({ tab: v == 0 ? "customers" : "hosts" });
            window.scrollTo({ top: 0, left: 0 });
          }}
          defaultIndex={localStorage.getItem("role") == "host" ? 1 : 0 || searchParams.get("tab") == "hosts" ? 1 : 0}
        >
          <Tab.List className={"two-tab-menu small mb-4"}>
            <Tab className={"px-5 py-3 text-xl text-gray-700 focus:outline-none ui-selected:text-black"}>For guests</Tab>
            <Tab className={"px-5 py-3 text-xl text-gray-700 focus:outline-none ui-selected:text-black"}>For hosts</Tab>
            <div className="mover"></div>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel as="section">
              {faqs
                .filter((faq) => faq.status != 1)
                .map((faq) => (
                  <FaqTile
                    data={faq}
                    key={faq.id}
                  />
                ))}
            </Tab.Panel>
            <Tab.Panel as="section">
              {faqs
                .filter((faq) => faq.status == 1)
                .map((faq) => (
                  <FaqTile
                    data={faq}
                    key={faq.id}
                  />
                ))}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        <p>
          If you can’t find your answers we’re here to help. <br />
        </p>
        <Link
          to="/contact-us"
          className="underline"
        >
          Contact us
        </Link>
      </section>
    </>
  );
};

export default FaqPage;
