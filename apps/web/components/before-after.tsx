"use client";
import Image from "next/image";
import { ImgComparisonSlider } from "@img-comparison-slider/react";

type Img = { src: string; alt: string; width: number; height: number };

export function BeforeAfter({ before, after, caption }: { before: Img; after: Img; caption: React.ReactNode }) {
  return (
    <figure className="m-0 flex flex-col gap-3 rounded-[16px] bg-white p-4">
      <ImgComparisonSlider className="overflow-hidden rounded-[12px] [--divider-color:#4DB848] [--divider-width:3px]">
        <Image slot="first" src={before.src} alt={before.alt} width={before.width} height={before.height} className="h-[380px] w-full object-cover" />
        <Image slot="second" src={after.src} alt={after.alt} width={after.width} height={after.height} className="h-[380px] w-full object-cover" />
      </ImgComparisonSlider>
      <figcaption className="text-[15px] text-text-2">{caption}</figcaption>
    </figure>
  );
}
