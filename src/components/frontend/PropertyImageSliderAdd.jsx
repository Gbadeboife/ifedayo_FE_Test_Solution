import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import Swiper from "swiper";
import { SwiperSlide, Swiper as SwiperComponent } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper";

export default function PropertyImageSliderAdd({ modalOpen, closeModal, spaceImages }) {
  const [currentImageSlide, setCurrentImageSlide] = useState(0);

  return (
    <Transition
      appear
      show={modalOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                as="div"
                className="bg-white p-5 rounded-lg md:w-4/5 w-5/6 transform overflow-hidden shadow-xl transition-all"
              >
                {/* <div className="flex justify-between md:mb-[24px] mb-4">
                  <div></div>
                  {spaceImages.length > 0 ?
                    <p className="self-center normal-case">
                      Images {currentImageSlide + 1} of {spaceImages.length}
                    </p>
                    :
                    <p className="self-center normal-case">
                      No approved images to preview
                    </p>
                  }
                  <button
                    onClick={closeModal}
                    className="p-1 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full"
                  >
                    &#x2715;
                  </button>
                </div> */}
                <div className="flex justify-between md:mb-[24px] mb-4">
                  <div></div>
                  <p className="self-center normal-case">
                    Images {currentImageSlide + 1} of {spaceImages?.filter((v) => (v != null && v != "")).length}
                  </p>
                  <button
                    onClick={closeModal}
                    className="p-1 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full"
                  >
                    &#x2715;
                  </button>
                </div>
                <div className="">
                  <SwiperComponent
                    // install Swiper modules
                    modules={[Navigation, Pagination, A11y]}
                    spaceBetween={50}
                    slidesPerView={1}
                    loop={true}
                    navigation
                    pagination={{
                      clickable: true,
                      renderBullet: (i, className) => `<img src="${spaceImages[i] || "/default-property.jpg"}" draggable="false" class="pagination-imag ${className}" />`,
                    }}
                    className="property-swiper-slid"
                  >
                    {spaceImages?.filter((v) => (v != null && v != "")).map((img, i) => (
                      <SwiperSlide
                        key={i}
                        className="md:pb-[120px]"
                      >
                        {({ isActive }) => {
                          if (isActive) setCurrentImageSlide(i);
                          return (
                            <img
                              src={img || "/default-property.jpg"}
                              draggable={"false"}
                              className="w-full property-swiper-image md:h-[600px] h-[300px"
                            />
                          );
                        }}
                      </SwiperSlide>
                    ))}
                  </SwiperComponent>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
