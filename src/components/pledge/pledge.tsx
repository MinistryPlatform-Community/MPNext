"use client";

export function Pledge() {
  return (
    <form className="max-w-[600px] mx-auto bg-white rounded-2xl overflow-hidden">
      {/* Header Section */}
      <div className="bg-[#1a3a5c] text-white p-5">
        <div className="text-[28px] font-bold text-center mb-5">MY COMMITMENT</div>
        
        <div className="mb-4">
          <label htmlFor="name" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            NAME
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            EMAIL
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            PHONE
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
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
            className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
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
              className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
              STATE
            </label>
            <input
              type="text"
              id="state"
              name="state"
              maxLength={2}
              className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
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
              className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm text-gray-900 focus:outline-none focus:bg-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Commitment Section */}
      <div className="p-5 bg-[#e8f0f7]">
        <div className="bg-[#1a3a5c] text-white px-5 py-3 -mx-5 -mt-5 mb-5 text-lg font-bold">
          WITH DEPENDENCE ON GOD I/WE COMMIT TO:
        </div>

        {/* Courageous Gift */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-2.5">
            <div className="text-base font-bold text-[#1a3a5c]">COURAGEOUS GIFT</div>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                name="courageous_gift"
                className="flex-1 px-4 py-3 border-none rounded-md bg-gray-100 text-sm focus:outline-none focus:bg-gray-200"
              />
              <span className="text-xs text-gray-600 font-bold">A</span>
            </div>
          </div>
          <div className="text-[13px] text-gray-700 leading-6 italic">
            Given on or before Commitment Sunday on Nov. 9. If using a check, make it payable to &quot;Northwoods&quot; with a memo of &quot;Now is the Time&quot;.
          </div>
        </div>

        {/* Consistent Gift */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-2.5">
            <div className="text-base font-bold text-[#1a3a5c]">CONSISTENT GIFT</div>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                name="consistent_gift"
                className="flex-1 px-4 py-3 border-none rounded-md bg-gray-100 text-sm focus:outline-none focus:bg-gray-200"
              />
              <span className="text-xs text-gray-600 font-bold">B</span>
            </div>
          </div>
          <div className="text-[13px] text-gray-700 leading-6 italic">
            In addition to your Courageous Gift, the total over the next 25 months from Dec. 1, 2025 to Dec. 31, 2027.
          </div>
        </div>

        {/* Creative Gift */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-2.5">
            <div className="text-base font-bold text-[#1a3a5c]">CREATIVE GIFT</div>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                name="creative_gift"
                className="flex-1 px-4 py-3 border-none rounded-md bg-gray-100 text-sm focus:outline-none focus:bg-gray-200"
              />
              <span className="text-xs text-gray-600 font-bold">C</span>
            </div>
          </div>
          <div className="text-[13px] text-gray-700 leading-6 italic">
            Provide an estimated value.
          </div>
          <div className="border-b border-gray-400 my-4"></div>
          <div className="text-xs text-gray-600 my-5 leading-relaxed">
            Describe the creative gift(s) of stocks, bonds, or other assets.
          </div>
        </div>

        {/* Total Gift */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-8 mb-8">
          <div className="text-lg font-bold text-[#1a3a5c]">TOTAL GIFT</div>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              name="total_gift"
              placeholder="A+B+C"
              readOnly
              className="flex-1 px-4 py-3 border-none rounded-md bg-gray-100 text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 p-5 bg-[#1a3a5c]">
        <div>
          <label htmlFor="signature" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            SIGNATURE
          </label>
          <input
            type="text"
            id="signature"
            name="signature"
            className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm focus:outline-none focus:bg-gray-200"
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-xs text-gray-300 mb-1.5 uppercase tracking-wide">
            DATE
          </label>
          <input
            type="date"
            id="date"
            name="date"
            className="w-full px-4 py-3 border-none rounded-md bg-gray-100 text-sm focus:outline-none focus:bg-gray-200"
          />
        </div>
      </div>
    </form>
  );
}
