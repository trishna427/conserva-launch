import Link from "next/link";
import { Leaf, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF7F0] text-[#2B2B26] flex justify-center">
      <section className="w-full max-w-[430px] min-h-screen px-6 py-8 flex flex-col justify-between">
        <div className="text-center pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#3F6B4F] text-white">
            <Leaf size={32} />
          </div>

          <h1 className="font-serif text-5xl font-bold tracking-tight">
            Conserva
          </h1>

          <p className="mt-5 text-xl leading-relaxed text-[#8A8578]">
            Know what&apos;s in your kitchen.
            <br />
            Use it before it&apos;s gone.
          </p>
        </div>

        <div className="my-12">
          <div className="relative mx-auto h-44 w-full">
            <div className="absolute bottom-2 left-1/2 h-8 w-72 -translate-x-1/2 rounded-full bg-[#E7EFE6]" />
            <div className="absolute left-1/2 top-8 h-28 w-64 -translate-x-1/2 rounded-3xl border-4 border-[#D8D2C2] bg-[#F4F1EA]">
              <div className="absolute left-8 top-9 h-14 w-14 rounded-full bg-[#E9A86A]" />
              <div className="absolute left-[94px] top-6 h-16 w-16 rounded-full bg-[#3F6B4F]" />
              <div className="absolute right-8 top-8 h-16 w-12 rounded-xl bg-[#A6783A]" />
            </div>
          </div>
        </div>

        <div className="space-y-5 text-lg">
          <p className="flex items-center gap-4">
            <CheckCircle2 className="text-[#3F6B4F]" />
            Track everything in your fridge, freezer & pantry
          </p>
          <p className="flex items-center gap-4">
            <CheckCircle2 className="text-[#3F6B4F]" />
            Gentle reminders before food turns
          </p>
          <p className="flex items-center gap-4">
            <CheckCircle2 className="text-[#3F6B4F]" />
            AI recipes built around what you already have
          </p>
        </div>
        <div className="space-y-4 pt-10">
  <Link
    href="/signup"
    className="flex w-full items-center justify-center gap-3 rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white"
  >
    Get started <ArrowRight />
  </Link>

  <Link
    href="/login"
    className="block w-full rounded-3xl border-2 border-[#E7E2D6] py-5 text-center text-lg font-bold"
  >
    I already have an account
  </Link>
</div> 
      </section>
    </main>
  );
}