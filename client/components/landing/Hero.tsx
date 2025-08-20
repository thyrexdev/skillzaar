"use client";

import React from "react";
import Navbar from "./Navbar";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative container min-h-screen bg-[#6858D5]">
      {/* Navbar */}
      <div>
        <Navbar />
      </div>

      {/* Hero Section */}
      <div className="  ">
        <div className="text-white flex flex-col-reverse md:flex-row justify-between items-center py-[10%] px-6 ">
          <div className="  flex-1 mb-8 md:mb-0">
            <Image
              src="/hero.png"
              alt="hero"
              width={880}
              height={1150}
              className="absolute z-20 bottom-0"
            />
            <Image
              src={"/desig.svg"}
              alt={"dots"}
              width={145}
              height={112}
              className="absolute right-[40%]"
            />
            <div className="">
              <Image
                src={"/circle.png"}
                alt={"circle"}
                width={100}
                height={100}
                className="absolute right-52 top-1/4"
              />
              <Image
                src={"/lines.svg"}
                alt={"circle"}
                width={376}
                height={270}
                className="absolute right-[170px] top-[22.5%]"
              />
            </div>
            <Image
              src={"/text.svg"}
              alt={"text"}
              width={190}
              height={62}
              className="absolute z-30 right-[28%] bottom-5"
            />
            <Image
              src={"/3d.svg"}
              alt={"3d"}
              width={190}
              height={62}
              className="absolute z-10 right-[13%] top-[60%]"
            />
            <Image
              src={"/Vector 2 (1).svg"}
              alt={"vector 2"}
              width={736}
              height={295}
              className="absolute bottom-0"
            />
            <Image
              src={"/polygon 2.svg"}
              alt={""}
              width={72}
              height={72}
              className="absolute right-[45%] top-1/4"
            />
            <Image
              src={"/polygon 3.svg"}
              alt={""}
              width={72}
              height={72}
              className="absolute right-52 bottom-5"
            />
          </div>

          <div className="flex-1 space-y-6 text-center md:text-right">
            <h2 className="text-4xl font-semibold leading-relaxed">
              ابدأ رحلتك في العمل الحر <br /> أو وظّف أفضل الكفاءات بسهولة
            </h2>
            <p className="text-gray-200 text-lg">
              منصة عربية تجمع بين المستقلين الموهوبين وأصحاب المشاريع لإنجاز
              الأعمال باحترافية وسرعة. سجّل الآن وابدأ العمل من أي مكان.
            </p>

            <div className="flex items-center rounded-full p-2 w-full max-w-lg mx-auto md:mx-0">
              <div className="relative flex items-center w-full px-4">
                <Button className="absolute right-0 p-3 bg-orange-500 text-white rounded-full w-[86px] h-[86px]">
                  <Search size={48} />
                </Button>
                <Input
                  placeholder="ابحث عن خدمات أو مستقلين (مثل: تصميم، كتابة، تطوير..)"
                  type="text"
                  className="flex-grow bg-white text-black w-full h-[86px] px-24 rounded-4xl outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-center space-y-6 ">
              <Button className="bg-orange-400 px-6 py-2 rounded-md text-white w-44 h-14">
                انضم كمستقل
              </Button>
              <Button className="bg-white text-purple-600 px-6 py-2 rounded-md w-44 h-14 border-2">
                ابحث عن مستقلين
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
