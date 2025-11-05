"use client";

import { useState, useEffect } from "react";
import { StateSelect } from "@/components/ui/state-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { savePledge, type PledgeFormData } from "./actions";

export function Pledge() {
  const [courageousGift, setCourageousGift] = useState("");
  const [consistentGift, setConsistentGift] = useState("");
  const [creativeGift, setCreativeGift] = useState("");
  const [total, setTotal] = useState("0.00");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) return value;
    
    const decimalPart = parts[1];
    
    if (decimalPart !== undefined && decimalPart.length > 2) return value;
    
    return numericValue;
  };

  const parseNumeric = (value: string): number => {
    const numeric = value.replace(/[^0-9.]/g, "");
    return parseFloat(numeric) || 0;
  };

  const handleCurrencyChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    const formatted = formatCurrency(value);
    setter(formatted);
  };

  useEffect(() => {
    const a = parseNumeric(courageousGift);
    const b = parseNumeric(consistentGift);
    const c = parseNumeric(creativeGift);
    const sum = a + b + c;
    setTotal(sum.toFixed(2));
  }, [courageousGift, consistentGift, creativeGift]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const numericPhone = phone.replace(/\D/g, "");
    return numericPhone.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newErrors: Record<string, boolean> = {};

    // Validate required fields
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipcode = formData.get("zipcode") as string;
    const notes = formData.get("notes") as string;

    if (!firstName?.trim()) newErrors.firstName = true;
    if (!lastName?.trim()) newErrors.lastName = true;
    if (!email?.trim() || !validateEmail(email)) newErrors.email = true;
    if (!phone?.trim() || !validatePhone(phone)) newErrors.phone = true;
    if (!address?.trim()) newErrors.address = true;
    if (!city?.trim()) newErrors.city = true;
    if (!zipcode?.trim() || zipcode.length !== 5) newErrors.zipcode = true;

    // Validate at least one gift field has value > 0
    const a = parseNumeric(courageousGift);
    const b = parseNumeric(consistentGift);
    const c = parseNumeric(creativeGift);

    if (a === 0 && b === 0 && c === 0) {
      newErrors.courageous_gift = true;
      newErrors.consistent_gift = true;
      newErrors.creative_gift = true;
    }

    setErrors(newErrors);

    // If no errors, proceed with form submission
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitMessage(null);

      const pledgeData: PledgeFormData = {
        campaignId: 115,
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipcode,
        courageous_gift: courageousGift,
        consistent_gift: consistentGift,
        creative_gift: creativeGift,
        total_gift: total,
        notes: notes || undefined,
      };

      const result = await savePledge(pledgeData);

      setIsSubmitting(false);

      if (result.success) {
        setIsSuccess(true);
      } else {
        setSubmitMessage({ 
          type: "error", 
          text: result.error || "Failed to save pledge. Please try again." 
        });
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-[600px] mx-auto bg-white rounded-2xl overflow-hidden">
        <div className="bg-[#002B55] text-white p-10 text-center">
          <div className="text-4xl font-bold mb-6">Thank You!</div>
          <p className="text-lg mb-8">
            Thank you for your commitment to the Now is the time Campaign.
          </p>
        </div>
        <div className="p-10 text-center">
          <div className="mb-6">
            <div className="text-gray-600 text-sm uppercase tracking-wide mb-2">
              Total Commitment
            </div>
            <div className="text-5xl font-bold text-[#002B55]">
              ${parseFloat(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-gray-700 leading-relaxed">
            <p>Your commitment has been recorded successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form 
      className="max-w-[600px] mx-auto bg-white rounded-2xl overflow-hidden"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Header Section */}
      <div className="bg-[#002B55] text-white p-5">
        <div className="text-[28px] font-bold text-center mb-5">MY COMMITMENT</div>
        
        {/* Hidden CampaignID Field */}
        <input type="hidden" name="campaignId" value="115" />
        
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="firstName" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
              FIRST NAME
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className={`w-full px-4 py-3 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50 ${
                errors.firstName ? 'border-2 border-red-500' : 'border border-gray-300'
              }`}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
              LAST NAME
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className={`w-full px-4 py-3 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50 ${
                errors.lastName ? 'border-2 border-red-500' : 'border border-gray-300'
              }`}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            EMAIL
          </label>
          <EmailInput
            id="email"
            name="email"
            required
            hasError={errors.email}
            className="w-full px-4 py-3 border rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            PHONE
          </label>
          <PhoneInput
            id="phone"
            name="phone"
            required
            hasError={errors.phone}
            className="w-full px-4 py-3 border rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            ADDRESS
          </label>
          <input
            type="text"
            id="address"
            name="address"
            required
            className={`w-full px-4 py-3 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50 ${
              errors.address ? 'border-2 border-red-500' : 'border border-gray-300'
            }`}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div>
            <label htmlFor="city" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
              CITY
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              className={`w-full px-4 py-3 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50 ${
                errors.city ? 'border-2 border-red-500' : 'border border-gray-300'
              }`}
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
              STATE
            </label>
            <StateSelect
              id="state"
              name="state"
              defaultValue="IL"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="zipcode" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
              ZIPCODE
            </label>
            <input
              type="text"
              id="zipcode"
              name="zipcode"
              required
              maxLength={5}
              pattern="[0-9]{5}"
              inputMode="numeric"
              placeholder="12345"
              className={`w-full px-4 py-3 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:bg-gray-50 ${
                errors.zipcode ? 'border-2 border-red-500' : 'border border-gray-300'
              }`}
            />
          </div>
        </div>

        <div className="text-white px-5 py-3 mb-0 text-lg font-bold text-center">
          WITH DEPENDENCE ON GOD I/WE COMMIT TO:
        </div>
      </div>

      {/* Commitment Section */}
      <div className="p-5">

        {/* Courageous Gift */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-2.5">
            <div className="text-base font-bold text-[#002B55]">COURAGEOUS GIFT</div>
            <div className="flex items-center gap-2.5">
              <span className="text-gray-600 mr-1">$</span>
              <input
                type="text"
                name="courageous_gift"
                value={courageousGift}
                onChange={(e) => handleCurrencyChange(e.target.value, setCourageousGift)}
                placeholder="0.00"
                className={`flex-1 px-4 py-3 border rounded-md bg-white text-sm focus:outline-none focus:bg-gray-50 ${
                  errors.courageous_gift ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="text-[13px] text-gray-700 leading-6 italic pl-6">
              Given on or before Commitment Sunday on Nov. 9. If using a check, make it payable to &quot;Northwoods&quot; with a memo of &quot;Now is the Time&quot;.
            </div>
          </div>
        </div>

        {/* Consistent Gift */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-2.5">
            <div className="text-base font-bold text-[#002B55]">CONSISTENT GIFT</div>
            <div className="flex items-center gap-2.5">
              <span className="text-gray-600 mr-1">$</span>
              <input
                type="text"
                name="consistent_gift"
                value={consistentGift}
                onChange={(e) => handleCurrencyChange(e.target.value, setConsistentGift)}
                placeholder="0.00"
                className={`flex-1 px-4 py-3 border rounded-md bg-white text-sm focus:outline-none focus:bg-gray-50 ${
                  errors.consistent_gift ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="text-[13px] text-gray-700 leading-6 italic pl-6">
              In addition to your Courageous Gift, the total over the next 25 months from Dec. 1, 2025 to Dec. 31, 2027.
            </div>
          </div>
        </div>

        {/* Creative Gift */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-2.5">
            <div className="text-base font-bold text-[#002B55]">CREATIVE GIFT</div>
            <div className="flex items-center gap-2.5">
              <span className="text-gray-600 mr-1">$</span>
              <input
                type="text"
                name="creative_gift"
                value={creativeGift}
                onChange={(e) => handleCurrencyChange(e.target.value, setCreativeGift)}
                placeholder="0.00"
                className={`flex-1 px-4 py-3 border rounded-md bg-white text-sm focus:outline-none focus:bg-gray-50 ${
                  errors.creative_gift ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="text-[13px] text-gray-700 leading-6 italic pl-6">
              Provide an estimated value.
            </div>
          </div>
          {creativeGift && (
            <>
              <div className="text-xs text-gray-600 mb-2 leading-relaxed mt-4">
                Describe the creative gift(s) of stocks, bonds, or other assets.
              </div>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:bg-gray-50"
              />
            </>
          )}
        </div>

        {/* Total Gift */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-8 mb-8">
          <div className="text-lg font-bold text-[#002B55]">TOTAL GIFT</div>
          <div className="flex items-center gap-2.5">
            <span className="text-gray-600 mr-1">$</span>
            <input
              type="text"
              name="total_gift"
              value={total}
              readOnly
              className="flex-1 px-4 py-3 border-none rounded-md bg-white text-xl font-bold text-[#002B55] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-5 bg-[#002B55]">
        {submitMessage && (
          <div className={`mb-4 p-3 rounded-md text-center ${
            submitMessage.type === "success" 
              ? "bg-[#86AD3F] text-white border border-[#86AD3F]" 
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {submitMessage.text}
          </div>
        )}
        {submitMessage?.type !== "success" && (
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-white text-[#002B55] font-bold rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "MAKE MY PLEDGE"
              )}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
