import BrandMark from "./BrandMark";

export default function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className="size-9 shrink-0 rounded-xl" />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="text-lg leading-none font-semibold tracking-normal">
          Copyright Ark
        </span>
        <span className="mt-1 whitespace-nowrap text-[10px] leading-3 font-normal tracking-normal text-muted">
          A decentralized copyright management platform
        </span>
      </span>
    </span>
  );
}
