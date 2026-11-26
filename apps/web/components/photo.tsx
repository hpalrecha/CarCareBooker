import Image from "next/image";

export function Photo({ src, alt, width, height, priority = false, className = "" }: { src: string; alt: string; width: number; height: number; priority?: boolean; className?: string }) {
  return <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes="(min-width: 1240px) 600px, 100vw" className={`block h-full w-full object-cover ${className}`} />;
}
