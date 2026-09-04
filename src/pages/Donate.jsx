import { useState } from "react";
import {
  Heart,
  Phone,
  CheckCircle,
  XCircle,
  Gift,
  Users,
  Mic,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import Reveal from "../components/Reveal";
import Counter from "../components/Counter";
import { submitDonation } from "../lib/api";

// ---------- VALIDATION HELPERS ----------
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, message: "Email is required." };
  if (!re.test(email)) return { valid: false, message: "Please enter a valid email address (e.g., name@domain.com)." };
  return { valid: true };
};

// Phone validation: digits only, max 12, accepts 0712345678 or 254712345678
const validatePhone = (phone) => {
  if (!phone) return { valid: false, message: "Phone number is required." };
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 9) {
    return { valid: true, normalized: '0' + cleaned };
  }
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return { valid: true, normalized: cleaned };
  }
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return { valid: true, normalized: cleaned };
  }
  return { valid: false, message: "Enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)." };
};

// Format phone to international +254... for the backend
const formatPhoneForBackend = (phone) => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '+254' + digits.slice(1);
  }
  if (digits.startsWith('254')) {
    return '+' + digits;
  }
  return phone;
};

// Phone input formatter – strip non-digits, limit to 12 digits
const formatPhoneInput = (value) => {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.slice(0, 12);
};

const DonationPage = () => {
  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [donationAmount, setDonationAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // WhatsApp checkbox removed
  const [donationMethod, setDonationMethod] = useState("mpesa");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetAmountsKES = [100, 500, 1000, 5000];
  const presetMethodsUSD = [5, 10, 25, 50];

  const impactStats = [
    { label: "ARTISTS SUPPORTED", value: 150, suffix: "+", color: "text-coral" },
    { label: "EVENTS HELD", value: 100, suffix: "+", color: "text-[#389a51]" },
    { label: "AFRICAN COUNTRIES", value: 14, suffix: "", color: "text-[#e8a850]" },
    { label: "LIVES IMPACTED", value: 2500, suffix: "+", color: "text-[#3a7599]" },
  ];

  const handleAmountSelect = (amount) => {
    setDonationAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmount = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) setDonationAmount(Number(value));
  };

  const handlePhoneChange = (e) => {
    const cleaned = formatPhoneInput(e.target.value);
    setPhoneNumber(cleaned);
  };

  const handleDonate = async () => {
    if (isSubmitting) return;

    if (!donationAmount || donationAmount <= 0) {
      toast.error("Please choose or enter a donation amount.");
      return;
    }

    if (email) {
      const emailResult = validateEmail(email);
      if (!emailResult.valid) {
        toast.error(emailResult.message);
        return;
      }
    }

    if (donationMethod === "mpesa") {
      const phone = phoneNumber;
      const result = validatePhone(phone);
      if (!result.valid) {
        toast.error(result.message);
        return;
      }
      if (result.normalized) {
        setPhoneNumber(result.normalized);
      }
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading(
      donationMethod === "mpesa"
        ? "Setting up your M-Pesa donation…"
        : "Setting up your secure card payment…"
    );

    const currency = donationMethod === "mpesa" ? "KES" : "USD";

    // Format phone to international format for the backend
    let phoneToSend = undefined;
    if (donationMethod === "mpesa" && phoneNumber) {
      const result = validatePhone(phoneNumber);
      if (result.valid) {
        phoneToSend = formatPhoneForBackend(result.normalized);
      }
    }

    const { ok, source, record } = await submitDonation({
      donor_name: donorName || "Anonymous",
      email: email || undefined,
      amount: donationAmount,
      method: donationMethod,
      currency: currency,
      phone: phoneToSend,
      // send_whatsapp_receipt omitted (checkbox removed)
    });

    toast.dismiss(loadingToastId);

    if (!ok) {
      toast.error("Something went wrong starting your donation. Please try again.", {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
      });
      setIsSubmitting(false);
      return;
    }

    if (source === "local") {
      toast.info(
        <div>
          <p className="font-semibold">Saved (demo mode)</p>
          <p className="text-sm">
            We couldn't reach the payment server, so this was saved locally instead of
            actually charging you. Try again once the backend is running.
          </p>
        </div>,
        { duration: 5000 }
      );
      setIsSubmitting(false);
      return;
    }

    if (record?.error) {
      toast.error(
        <div>
          <p className="font-semibold">Couldn't start your donation</p>
          <p className="text-sm">{record.error}</p>
        </div>,
        { duration: 5000, icon: <XCircle className="w-5 h-5 text-red-500" /> }
      );
      setIsSubmitting(false);
      return;
    }

    if (record?.authorization_url) {
      toast.success(
        <div>
          <p className="font-semibold">Redirecting you to Paystack…</p>
          <p className="text-sm">
            Reference <span className="font-mono">{record.reference}</span> — complete{" "}
            {donationMethod === "mpesa" ? "the STK push on your phone" : "your card details"} on
            the next screen.
          </p>
        </div>,
        { duration: 3000, icon: <CheckCircle className="w-5 h-5 text-green-500" /> }
      );
      setTimeout(() => {
        window.location.href = record.authorization_url;
      }, 900);
      return;
    }

    toast.success("Thank you for your donation!");
    setIsSubmitting(false);
  };

  const presetAmounts = donationMethod === "mpesa" ? presetAmountsKES : presetMethodsUSD;
  const currencySymbol = donationMethod === "mpesa" ? "KES" : "USD";
  const currencyLabel = donationMethod === "mpesa" ? "KES" : "$";

  return (
    <div className="font-body bg-[#FAF7F2] text-[#1E1A18] min-h-screen">
   
      <section className="relative overflow-hidden bg-charcoal text-cream px-6 md:px-16 py-16">
        <img
          src="/anika-flower.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 -bottom-10 w-md rotate-0 opacity-90"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Reveal>
            <h1 className="text-5xl md:text-6xl font-display">SUPPORT OUR WORK</h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-4 max-w-md text-lg text-[#E6A15E] font-editorial italic">
              Your gift keeps the rooms open, the mics on and the conversation going
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-12 bg-charcoal">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 100}>
                <div className="text-center">
                  <div className={`text-2xl md:text-3xl font-display ${stat.color}`}>
                    <Counter from={0} to={stat.value} duration={2} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 font-body text-xs text-cream/60">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <Reveal>
              <span className="text-[#E6A15E] font-semibold text-sm tracking-widest uppercase">
                Why Give?
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                Some realities can't be understood through reports alone.
              </h2>
            </Reveal>

            <div className="space-y-4">
              <Reveal delay={150}>
                <div className="bg-[#faf5ef] p-6 rounded-2xl border border-[#e8e2d8]">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#E6A15E] p-2 rounded-full shrink-0">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold">Your support makes a direct impact</h4>
                      <p className="text-sm text-gray-600">
                        100% of your donation goes to programs, venues, artist stipends and safe
                        spaces.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="w-full h-64 bg-[#E6DED5] rounded-2xl flex items-center justify-center text-[#8a8074] overflow-hidden">
                  <img src="/RAYA1.jpg" alt="Spoken word" className="w-full h-full object-cover" />
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal delay={250}>
            <div className="bg-[#faf5ef] p-8 rounded-3xl shadow-lg border border-[#e8e2d8]">
              <h3 className="text-2xl font-bold mb-2">Make a Donation</h3>
              <p className="text-sm text-gray-500 mb-6">Choose your amount and preferred method.</p>

              <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-xl">
                <button
                  onClick={() => setDonationMethod("mpesa")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    donationMethod === "mpesa"
                      ? "bg-[#39ba25] text-[#1E1A18] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  M-Pesa
                </button>
                <button
                  onClick={() => setDonationMethod("card")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    donationMethod === "card"
                      ? "bg-[#E6A15E] text-[#1E1A18] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  USD (Card)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="col-span-2 px-4 py-2 border-2 border-gray-200 rounded-xl outline-none focus:border-[#E6A15E] bg-cream/95"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (for your receipt)"
                  className="col-span-2 px-4 py-2 border-2 border-gray-200 rounded-xl outline-none focus:border-[#E6A15E] bg-cream/95"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      donationAmount === amount && !customAmount
                        ? "border-[#E6A15E] bg-[#FDF6EE] text-[#1E1A18]"
                        : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {currencySymbol}
                    {amount.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmount}
                  placeholder={`Enter custom amount (${currencyLabel})`}
                  className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6A15E] focus:ring-2 focus:ring-[#E6A15E]/20 outline-none transition-all bg-cream/95"
                />
              </div>

              {donationMethod === "mpesa" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-PESA Phone Number
                  </label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-[#E6A15E] focus-within:ring-2 focus-within:ring-[#E6A15E]/20 transition-all">
                    <span className="pl-4 text-gray-500 font-medium">+254</span>
                    <input
                      type="tel"
                      placeholder="712345678"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      maxLength="12"
                      className="w-full p-3 pl-2 outline-none bg-cream/95"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter digits only (max 12)
                  </p>
                  {/* WhatsApp checkbox removed */}
                </div>
              )}

              {donationMethod === "card" && (
                <div className="mb-6 p-4 bg-[#FDF6EE] rounded-xl border border-[#E6DED5]">
                  <p className="text-sm text-gray-700">
                    You'll be redirected to Paystack's secure checkout to complete your USD
                    donation.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Amount: ${Number(donationAmount).toFixed(2)} USD
                  </p>
                </div>
              )}

              <button
                onClick={handleDonate}
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1E1A18] hover:bg-[#3D3530] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {donationMethod === "mpesa" ? (
                  <>
                    <Phone className="w-5 h-5" /> Donate KES {Number(donationAmount).toLocaleString()}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" /> Donate ${Number(donationAmount).toFixed(2)}
                  </>
                )}
              </button>
              {donationMethod === "mpesa" && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  You'll get an STK push prompt on your phone to confirm.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Impact Stories – heading and cards revealed with delays */}
      <section className="py-16 bg-[#F4EFE9]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <Reveal>
              <span className="text-[#E6A15E] font-semibold text-sm tracking-widest uppercase">
                Impact Stories
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">Where your support goes</h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Mic,
                title: "Open Mic Nights",
                desc: "Monthly events where artists air the unsaid. Your support keeps the stage open.",
              },
              {
                icon: Users,
                title: "Artist Residencies",
                desc: "Cross-border collaborations that bring African artists together to create.",
              },
              {
                icon: Heart,
                title: "Safe Spaces",
                desc: "Therapy workshops and forums where hard conversations finally happen.",
              },
            ].map((story, index) => (
              <Reveal key={story.title} delay={index * 150}>
                <div className="bg-[#faf5ef] p-6 rounded-2xl shadow-md border border-[#e8e2d8]">
                  <div className="bg-[#FDF6EE] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <story.icon className="w-6 h-6 text-[#E6A15E]" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">{story.title}</h4>
                  <p className="text-sm text-gray-600">{story.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DonationPage;