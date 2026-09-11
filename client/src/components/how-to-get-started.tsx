import { Link } from "wouter";

interface HowToGetStartedProps {
  onBook?: () => void;
  "data-testid"?: string;
}

/**
 * Mobile-first 5-step "How to Get Started" guide section.
 * Designed for quick scanning within seconds for ad visitors.
 */
export default function HowToGetStarted({
  onBook,
  "data-testid": testId = "how-to-get-started",
}: HowToGetStartedProps) {
  const steps = [
    { num: "1", title: "Choose your service", desc: "Ceramic coating, PPF, or deep detailing." },
    { num: "2", title: "Select your car/bike", desc: "Pick vehicle type for instant price." },
    { num: "3", title: "Check the price", desc: "100% transparent live pricing." },
    { num: "4", title: "Book your appointment", desc: "Free booking — zero upfront fee." },
    { num: "5", title: "Visit P91 Car Care", desc: "Indiranagar studio — pay after work." },
  ];

  return (
    <section className="section py-8 bg-[var(--dark-gray)] rounded-2xl border border-[var(--medium-gray)] my-8" id="how-to-get-started" data-testid={testId}>
      <div className="wrap narrow px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-[var(--neon-green)] bg-[var(--neon-green)]/10 rounded-full border border-[var(--neon-green)]/20 mb-2">
            Simple 5-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How to Get Started</h2>
          <p className="text-sm text-[var(--txt-2)] mt-1.5 max-w-md mx-auto">
            Book online in seconds. Free reservation — pay for service at our Indiranagar studio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 my-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-3 p-3.5 rounded-xl bg-[var(--medium-gray)]/40 border border-[var(--medium-gray)]"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--neon-green)] text-black font-black text-sm flex items-center justify-center shadow-md">
                {step.num}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white leading-snug">{step.title}</h3>
                <p className="text-xs text-[var(--txt-2)] mt-0.5 leading-tight">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          {onBook ? (
            <button
              type="button"
              className="cta-lg w-full sm:w-auto"
              onClick={onBook}
              data-testid="button-get-started-book"
            >
              Book Free Appointment →
            </button>
          ) : (
            <Link
              href="/services"
              className="cta-lg inline-block w-full sm:w-auto text-center"
              data-testid="link-get-started-services"
            >
              Check Price &amp; Get Started →
            </Link>
          )}
          <p className="text-xs text-[var(--txt-2)] mt-2">
            💡 <b>100% Free Online Booking</b> · Settle service price at the studio after work
          </p>
        </div>
      </div>
    </section>
  );
}
