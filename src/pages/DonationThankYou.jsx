import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";


export default function DonationThankYou() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [donation, setDonation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reference) {
      setError("No donation reference was provided.");
      return;
    }

    const toastId = toast.loading("Confirming your donation…");

    // --- FIX: include /api/ prefix in the URL ---
    fetch(`${API_BASE}/api/donations/verify/${encodeURIComponent(reference)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not verify this donation");
        return data;
      })
      .then((data) => {
        toast.dismiss(toastId);
        setDonation(data);
        if (data.status === "Completed") {
          toast.success(
            <div>
              <p className="font-semibold">Thank you, {data.donor}!</p>
              <p className="text-sm">
                Your donation of {data.currency} {data.amount.toLocaleString()} was received.
              </p>
            </div>,
            { duration: 4000, icon: <CheckCircle className="w-5 h-5 text-green-500" /> }
          );
        } else if (data.status === "Failed") {
          toast.error("That payment didn't go through — feel free to try again.", {
            icon: <XCircle className="w-5 h-5 text-red-500" />,
          });
        } else {
          toast(
            "We're still waiting for confirmation from Paystack — this can take a minute for M-Pesa.",
            { icon: <Clock className="w-5 h-5 text-amber-500" /> }
          );
        }
      })
      .catch((err) => {
        toast.dismiss(toastId);
        setError(err.message);
        toast.error(err.message);
      });
  }, [reference]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        {error && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
          </>
        )}

        {!error && !donation && (
          <>
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-xl font-bold mb-2">Confirming your donation…</h1>
          </>
        )}

        {donation && donation.status === "Completed" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Thank you, {donation.donor}!</h1>
            <p className="text-sm text-gray-600 mb-1">
              {donation.currency} {donation.amount.toLocaleString()} received.
            </p>
            <p className="text-xs text-gray-400 mb-6 font-mono">{donation.reference}</p>
          </>
        )}

        {donation && donation.status === "Pending" && (
          <>
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Almost there…</h1>
            <p className="text-sm text-gray-600 mb-6">
              We're still waiting on confirmation. Check your phone for the M-Pesa prompt if you
              haven't completed it yet.
            </p>
          </>
        )}

        {donation && donation.status === "Failed" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Payment didn't go through</h1>
            <p className="text-sm text-gray-600 mb-6">No charge was made. Feel free to try again.</p>
          </>
        )}

        <Link
          to="/donate"
          className="inline-block py-3 px-6 bg-[#1E1A18] hover:bg-[#3D3530] text-white font-bold rounded-xl transition-all"
        >
          Back to donations
        </Link>
      </div>
    </div>
  );
}