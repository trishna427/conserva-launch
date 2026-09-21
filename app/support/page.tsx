import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Camera,
  Bell,
  Mail,
  ShieldCheck,
  Sprout,
} from "lucide-react";

const faqs = [
  {
    question: "How do I add food to my kitchen?",
    answer:
      "Open Conserva, tap Add, and enter the food name, quantity, storage location, and expiration date. You can also scan a grocery receipt to add multiple items.",
  },
  {
    question: "How do expiration reminders work?",
    answer:
      "Conserva helps you keep track of food that is approaching its expiration date. You can adjust your reminder preferences in Settings.",
  },
  {
    question: "Can I edit or remove a food item?",
    answer:
      "Yes. Open an item in your virtual fridge to update its details or remove it from your inventory.",
  },
  {
    question: "How do AI recipe suggestions work?",
    answer:
      "Conserva suggests recipes using ingredients in your kitchen, with an emphasis on food that may need to be used soon.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#26382D]">
      {/* Website header */}
      <header className="border-b border-[#E5E7DD] bg-[#FAF8F2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/support"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3F624E] text-[#FFF9ED]">
              <Sprout size={22} strokeWidth={1.8} />
            </span>
            Conserva
          </Link>

        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pb-20 pt-20 sm:pb-24 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#E7EFE5] px-4 py-2 text-sm font-medium text-[#3F624E]">
            <Sprout size={16} />
            Conserva Support
          </div>

          <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            How can we help?
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#69736A]">
            Find answers, learn how to use Conserva, and get help making the
            most of your kitchen.
          </p>
        </div>
      </section>

      {/* Support topics */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-[#E3E7DC] bg-white p-8">
            <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E8] text-[#3F624E]">
              <BookOpen size={23} />
            </div>
            <h2 className="font-serif text-2xl font-semibold">
              Manage your kitchen
            </h2>
            <p className="mt-3 leading-7 text-[#69736A]">
              Add groceries, organize your fridge and pantry, and keep track of
              what you have.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E3E7DC] bg-white p-8">
            <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E8] text-[#3F624E]">
              <Bell size={23} />
            </div>
            <h2 className="font-serif text-2xl font-semibold">
              Stay on top of dates
            </h2>
            <p className="mt-3 leading-7 text-[#69736A]">
              Understand expiration reminders and adjust your notification
              preferences.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E3E7DC] bg-white p-8">
            <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E8] text-[#3F624E]">
              <Camera size={23} />
            </div>
            <h2 className="font-serif text-2xl font-semibold">
              Scan and discover
            </h2>
            <p className="mt-3 leading-7 text-[#69736A]">
              Get help with receipt scanning and AI-powered recipe suggestions.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-[#E5E7DD] bg-[#F0F2E9] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#62816B]">
            Frequently asked questions
          </p>

          <h2 className="mb-12 font-serif text-4xl font-semibold sm:text-5xl">
            A little help goes a long way.
          </h2>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-[#E0E6DA] bg-white p-7"
              >
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="mt-3 leading-7 text-[#69736A]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-[#3F624E] px-8 py-16 text-center text-[#FFF9ED] sm:px-16">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Mail size={26} />
          </div>

          <h2 className="font-serif text-4xl font-semibold sm:text-5xl">
            Still need a hand?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-8 text-[#E1E9DF]">
            Have a question, found a bug, or want to share feedback? We’d love
            to hear from you.
          </p>

          <a
            href="mailto:trishnaerukulla@gmail.com"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#FFF9ED] px-7 py-3 font-semibold text-[#3F624E] transition hover:bg-white"
          >
            Contact support
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7DD] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-sm text-[#69736A] sm:flex-row sm:items-center">
          <p>© 2026 Conserva. Waste less, make more of what you have.</p>

          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} />
              Made with care
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}