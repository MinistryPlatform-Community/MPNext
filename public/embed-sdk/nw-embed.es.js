class w extends HTMLElement {
  constructor() {
    var e, i;
    super(), this.root = this.attachShadow({ mode: "open" });
    const t = document.querySelector(
      "script[data-api-host]"
    );
    this.apiHost = this.getAttribute("api-host") || (t == null ? void 0 : t.dataset.apiHost) || "https://northwoods.vercel.app", this.tenantId = this.getAttribute("tenant") || (t == null ? void 0 : t.dataset.tenant) || "", console.log("🔧 Widget constructor - checking for token provider..."), console.log("window.__nwTokenProvider exists?", !!window.__nwTokenProvider), console.log("window.__nwTokenProvider.get exists?", !!((e = window.__nwTokenProvider) != null && e.get)), this.tokenProvider = ((i = window.__nwTokenProvider) == null ? void 0 : i.get) || (async () => (console.warn("⚠️ No token provider initialized. Call init() before using the widget."), this.getAttribute("token") || ""));
  }
  /**
   * Fetch wrapper with automatic token injection and refresh on 401
   */
  async fetch(t, e) {
    var n;
    let i;
    try {
      i = await this.tokenProvider();
    } catch (o) {
      throw console.error("❌ Error getting token from tokenProvider:", o), new Error(`Failed to get authentication token: ${o instanceof Error ? o.message : "Unknown error"}`);
    }
    if (!i)
      throw console.error("❌ No token received from tokenProvider"), console.error("Make sure you called init() with a tokenProvider before mounting the widget"), new Error("Authentication token not available. Did you call init()?");
    console.log("🔑 Token received:", i.substring(0, 20) + "...");
    const s = {
      ...e == null ? void 0 : e.headers,
      Authorization: `Bearer ${i}`
    };
    this.tenantId && (s["X-Tenant-ID"] = this.tenantId);
    const r = await fetch(`${this.apiHost}${t}`, {
      ...e,
      headers: s,
      credentials: "omit",
      mode: "cors"
    });
    if (r.status === 401 && ((n = window.__nwTokenProvider) != null && n.refresh)) {
      const o = await window.__nwTokenProvider.refresh();
      return fetch(`${this.apiHost}${t}`, {
        ...e,
        headers: {
          ...e == null ? void 0 : e.headers,
          Authorization: `Bearer ${o}`,
          "X-Tenant-ID": this.tenantId
        },
        credentials: "omit",
        mode: "cors"
      });
    }
    return r;
  }
  /**
   * Inject CSS into Shadow DOM
   * Uses Constructable Stylesheets when available, fallback to <style> tag
   */
  injectStyles(t) {
    if ("adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype)
      try {
        const e = new CSSStyleSheet();
        e.replaceSync(t), this.root.adoptedStyleSheets = [e];
      } catch {
        this.injectStyleTag(t);
      }
    else
      this.injectStyleTag(t);
  }
  /**
   * Fallback style injection via <style> tag
   */
  injectStyleTag(t) {
    const e = document.createElement("style");
    e.textContent = t, this.root.appendChild(e);
  }
  /**
   * Emit custom event from widget
   */
  emit(t, e) {
    this.dispatchEvent(
      new CustomEvent(t, {
        detail: e,
        bubbles: !0,
        composed: !0
      })
    );
  }
}
class S {
  constructor(t) {
    this.config = t;
  }
  async request(t, e = {}) {
    const { skipRetry: i, ...s } = e, r = await this.config.getToken(), n = {
      "Content-Type": "application/json",
      ...s.headers,
      Authorization: `Bearer ${r}`
    };
    this.config.tenantId && (n["X-Tenant-ID"] = this.config.tenantId);
    const o = await fetch(`${this.config.apiHost}${t}`, {
      ...s,
      headers: n,
      credentials: "omit",
      mode: "cors"
    });
    if (o.status === 401 && !i && this.config.onTokenRefresh && await this.refreshToken())
      return this.request(t, { ...e, skipRetry: !0 });
    if (!o.ok) {
      const l = await o.json().catch(() => ({
        error: o.statusText
      }));
      throw new Error(l.error || `Request failed: ${o.statusText}`);
    }
    return o.json();
  }
  async post(t, e, i) {
    return this.request(t, {
      ...i,
      method: "POST",
      body: JSON.stringify(e)
    });
  }
  async get(t, e) {
    return this.request(t, {
      ...e,
      method: "GET"
    });
  }
  async refreshToken() {
    return null;
  }
}
class y extends w {
  constructor() {
    super(), this.state = {
      courageousGift: "",
      consistentGift: "",
      creativeGift: "",
      total: "0.00",
      errors: {},
      isSubmitting: !1,
      isSuccess: !1,
      errorMessage: ""
    }, this.campaignId = parseInt(this.getAttribute("campaign-id") || "115");
  }
  connectedCallback() {
    this.injectStyles(this.getStyles()), this.render(), this.attachEventListeners();
  }
  attachEventListeners() {
    this.root.addEventListener("input", (t) => this.handleInput(t)), this.root.addEventListener("submit", (t) => this.handleSubmit(t));
  }
  handleInput(t) {
    const e = t.target;
    if (e.name === "courageous_gift" || e.name === "consistent_gift" || e.name === "creative_gift") {
      const i = this.formatCurrency(e.value);
      e.value = i, e.name === "courageous_gift" && (this.state.courageousGift = i), e.name === "consistent_gift" && (this.state.consistentGift = i), e.name === "creative_gift" && (this.state.creativeGift = i), this.updateTotal();
    }
    if (e.name === "phone") {
      const i = this.formatPhoneNumber(e.value);
      e.value = i;
    }
  }
  formatCurrency(t) {
    const e = t.replace(/[^0-9.]/g, ""), i = e.split(".");
    if (i.length > 2) return t;
    const s = i[1];
    return s !== void 0 && s.length > 2 ? t : e;
  }
  parseNumeric(t) {
    const e = t.replace(/[^0-9.]/g, "");
    return parseFloat(e) || 0;
  }
  formatPhoneNumber(t) {
    const i = t.replace(/\D/g, "").substring(0, 10);
    return i.length <= 3 ? i : i.length <= 6 ? `${i.slice(0, 3)}-${i.slice(3)}` : `${i.slice(0, 3)}-${i.slice(3, 6)}-${i.slice(6)}`;
  }
  updateErrorStates() {
    this.root.querySelectorAll("input, select, textarea").forEach((e) => {
      const i = e.name;
      this.state.errors[i] ? e.classList.add("error") : e.classList.remove("error");
    });
  }
  updateTotal() {
    const t = this.parseNumeric(this.state.courageousGift), e = this.parseNumeric(this.state.consistentGift), i = this.parseNumeric(this.state.creativeGift), s = t + e + i;
    this.state.total = s.toFixed(2);
    const r = this.root.querySelector('input[name="total_gift"]');
    r && (r.value = this.state.total);
  }
  validateEmail(t) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }
  validatePhone(t) {
    return t.replace(/\D/g, "").length === 10;
  }
  async handleSubmit(t) {
    var m, u, g, f, h, v, b;
    t.preventDefault();
    const e = t.target, i = new FormData(e), s = {
      firstName: i.get("firstName"),
      lastName: i.get("lastName"),
      email: i.get("email"),
      phone: i.get("phone"),
      address: i.get("address"),
      city: i.get("city"),
      state: i.get("state"),
      zipcode: i.get("zipcode"),
      notes: i.get("notes") || void 0
    }, r = {};
    (m = s.firstName) != null && m.trim() || (r.firstName = !0), (u = s.lastName) != null && u.trim() || (r.lastName = !0), (!((g = s.email) != null && g.trim()) || !this.validateEmail(s.email)) && (r.email = !0), (!((f = s.phone) != null && f.trim()) || !this.validatePhone(s.phone)) && (r.phone = !0), (h = s.address) != null && h.trim() || (r.address = !0), (v = s.city) != null && v.trim() || (r.city = !0), (!((b = s.zipcode) != null && b.trim()) || s.zipcode.length !== 5) && (r.zipcode = !0);
    const n = this.parseNumeric(this.state.courageousGift), o = this.parseNumeric(this.state.consistentGift), l = this.parseNumeric(this.state.creativeGift);
    if (n === 0 && o === 0 && l === 0 && (r.courageous_gift = !0, r.consistent_gift = !0, r.creative_gift = !0), this.state.errors = r, Object.keys(r).length > 0) {
      this.updateErrorStates();
      return;
    }
    this.state.isSubmitting = !0, this.state.errorMessage = "", this.render();
    try {
      const c = crypto.randomUUID(), T = this.apiHost || "http://localhost:3000", d = await this.fetch("/api/embed/pledge/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": c
        },
        body: JSON.stringify({
          campaignId: this.campaignId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone,
          address: s.address,
          city: s.city,
          state: s.state,
          zipcode: s.zipcode,
          courageous_gift: this.state.courageousGift,
          consistent_gift: this.state.consistentGift,
          creative_gift: this.state.creativeGift,
          total_gift: this.state.total,
          notes: s.notes
        })
      });
      if (!d.ok) {
        const x = await d.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(x.error || `HTTP ${d.status}: ${d.statusText}`);
      }
      const p = await d.json();
      p.success ? (this.state.isSuccess = !0, this.emit("pledgeSubmitted", {
        pledgeId: p.pledgeId,
        total: this.state.total
      })) : (this.state.errorMessage = p.error || "Failed to save pledge. Please try again.", this.emit("pledgeError", { error: this.state.errorMessage }));
    } catch (c) {
      this.state.errorMessage = c.message || "Failed to save pledge. Please try again.", this.emit("pledgeError", { error: this.state.errorMessage });
    } finally {
      this.state.isSubmitting = !1, this.render();
    }
  }
  render() {
    this.state.isSuccess ? this.root.innerHTML = this.renderSuccess() : this.root.innerHTML = this.renderForm(), this.attachEventListeners();
  }
  renderSuccess() {
    return `
      <div class="nw-pledge">
        <div class="pledge-header success-header">
          <div class="success-title">Thank You!</div>
          <p class="success-message">
            We are grateful for your commitment to God's work.
          </p>
        </div>
        <div class="pledge-success-content">
          <div class="total-commitment">
            <div class="commitment-label">Total Commitment</div>
            <div class="commitment-amount">$${parseFloat(this.state.total).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}</div>
          </div>
          <div class="success-text">
            <p>Your commitment has been recorded successfully.</p>
          </div>
        </div>
      </div>
    `;
  }
  renderForm() {
    const { errors: t, isSubmitting: e, errorMessage: i } = this.state;
    return `
      <form class="nw-pledge" novalidate>
        <div class="pledge-header">
          <div class="pledge-title">MY COMMITMENT</div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="firstName">FIRST NAME</label>
              <input type="text" id="firstName" name="firstName" required 
                class="${t.firstName ? "error" : ""}" ${e ? "disabled" : ""}>
            </div>
            <div class="form-field">
              <label for="lastName">LAST NAME</label>
              <input type="text" id="lastName" name="lastName" required 
                class="${t.lastName ? "error" : ""}" ${e ? "disabled" : ""}>
            </div>
          </div>

          <div class="form-field">
            <label for="email">EMAIL</label>
            <input type="email" id="email" name="email" required 
              class="${t.email ? "error" : ""}" ${e ? "disabled" : ""}>
          </div>

          <div class="form-field">
            <label for="phone">PHONE</label>
            <input type="tel" id="phone" name="phone" required placeholder="555-555-5555"
              class="${t.phone ? "error" : ""}" ${e ? "disabled" : ""}>
          </div>

          <div class="form-field">
            <label for="address">ADDRESS</label>
            <input type="text" id="address" name="address" required 
              class="${t.address ? "error" : ""}" ${e ? "disabled" : ""}>
          </div>

          <div class="form-row form-row-3">
            <div class="form-field">
              <label for="city">CITY</label>
              <input type="text" id="city" name="city" required 
                class="${t.city ? "error" : ""}" ${e ? "disabled" : ""}>
            </div>
            <div class="form-field">
              <label for="state">STATE</label>
              <select id="state" name="state" ${e ? "disabled" : ""}>
                ${this.renderStateOptions()}
              </select>
            </div>
            <div class="form-field">
              <label for="zipcode">ZIPCODE</label>
              <input type="text" id="zipcode" name="zipcode" required maxlength="5" pattern="[0-9]{5}" placeholder="12345"
                class="${t.zipcode ? "error" : ""}" ${e ? "disabled" : ""}>
            </div>
          </div>
        </div>

        <div class="pledge-body">
          <div class="commitment-header">WITH DEPENDENCE ON GOD I/WE COMMIT:</div>

          <div class="gift-section">
            <div class="gift-row">
              <div class="gift-label">COURAGEOUS GIFT</div>
              <div class="gift-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="text" name="courageous_gift" placeholder="0.00" 
                  class="${t.courageous_gift ? "error" : ""}" ${e ? "disabled" : ""}>
              </div>
            </div>
            <div class="gift-description">
              Given on or before Commitment Sunday on Nov. 9. If using a check, make it payable to "Northwoods" with a memo of "Now is the Time".
            </div>
          </div>

          <div class="gift-section">
            <div class="gift-row">
              <div class="gift-label">CONSISTENT GIFT</div>
              <div class="gift-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="text" name="consistent_gift" placeholder="0.00" 
                  class="${t.consistent_gift ? "error" : ""}" ${e ? "disabled" : ""}>
              </div>
            </div>
            <div class="gift-description">
              In addition to your Courageous Gift, the total over the next 25 months from Dec. 1, 2025 to Dec. 31, 2027.
            </div>
          </div>

          <div class="gift-section">
            <div class="gift-row">
              <div class="gift-label">CREATIVE GIFT</div>
              <div class="gift-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="text" name="creative_gift" placeholder="0.00" 
                  class="${t.creative_gift ? "error" : ""}" ${e ? "disabled" : ""}>
              </div>
            </div>
            <div class="gift-description">
              Provide an estimated value.
            </div>
            ${this.state.creativeGift ? `
              <div class="notes-section">
                <label for="notes">Describe the creative gift(s) of stocks, bonds, or other assets.</label>
                <textarea id="notes" name="notes" rows="3" ${e ? "disabled" : ""}></textarea>
              </div>
            ` : ""}
          </div>

          <div class="total-section">
            <div class="total-label">TOTAL GIFT</div>
            <div class="total-input-wrapper">
              <span class="currency-symbol">$</span>
              <input type="text" name="total_gift" value="${this.state.total}" readonly class="total-amount">
            </div>
          </div>
        </div>

        <div class="pledge-footer">
          ${i ? `
            <div class="error-message">${i}</div>
          ` : ""}
          <button type="submit" ${e ? "disabled" : ""}>
            ${e ? "Saving..." : "Make My Pledge"}
          </button>
        </div>
      </form>
    `;
  }
  renderStateOptions() {
    return [
      "AL",
      "AK",
      "AZ",
      "AR",
      "CA",
      "CO",
      "CT",
      "DE",
      "FL",
      "GA",
      "HI",
      "ID",
      "IL",
      "IN",
      "IA",
      "KS",
      "KY",
      "LA",
      "ME",
      "MD",
      "MA",
      "MI",
      "MN",
      "MS",
      "MO",
      "MT",
      "NE",
      "NV",
      "NH",
      "NJ",
      "NM",
      "NY",
      "NC",
      "ND",
      "OH",
      "OK",
      "OR",
      "PA",
      "RI",
      "SC",
      "SD",
      "TN",
      "TX",
      "UT",
      "VT",
      "VA",
      "WA",
      "WV",
      "WI",
      "WY"
    ].map(
      (e) => `<option value="${e}" ${e === "IL" ? "selected" : ""}>${e}</option>`
    ).join("");
  }
  getStyles() {
    return `
      :host {
        all: initial;
        display: block;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      }

      .nw-pledge {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .pledge-header {
        background: #002855;
        color: white;
        padding: 40px 32px;
      }

      .success-header {
        text-align: center;
      }

      .pledge-title, .success-title {
        font-size: 28px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 32px;
      }

      .success-title {
        font-size: 36px;
        margin-bottom: 24px;
      }

      .success-message {
        font-size: 18px;
        line-height: 1.6;
        margin: 0;
      }

      .pledge-success-content {
        padding: 40px 32px;
        text-align: center;
      }

      .total-commitment {
        margin-bottom: 24px;
      }

      .commitment-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }

      .commitment-amount {
        font-size: 48px;
        font-weight: bold;
        color: #002855;
      }

      .success-text {
        color: #374151;
        line-height: 1.6;
      }

      .form-field {
        margin-bottom: 16px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .form-row-3 {
        grid-template-columns: 2fr 1fr 1fr;
      }

      label {
        display: block;
        font-size: 12px;
        color: #d1d5db;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }

      input, select, textarea {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        color: #1f2937;
        background: white;
        box-sizing: border-box;
      }

      input:focus, select:focus, textarea:focus {
        outline: none;
        background: #f9fafb;
        border-color: #004C97;
      }

      input.error, select.error, textarea.error {
        border: 2px solid #FF6D6A;
      }

      input:disabled, select:disabled, textarea:disabled, button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pledge-body {
        padding: 32px;
      }

      .commitment-header {
        background: #002855;
        color: white;
        padding: 12px 20px;
        margin: -32px -32px 32px -32px;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
      }

      .gift-section {
        margin-bottom: 32px;
      }

      .gift-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: center;
        margin-bottom: 12px;
      }

      .gift-label {
        font-size: 16px;
        font-weight: bold;
        color: #002855;
      }

      .gift-input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .currency-symbol {
        color: #6b7280;
        font-size: 16px;
      }

      .gift-input-wrapper input {
        flex: 1;
      }

      .gift-description {
        font-size: 13px;
        color: #374151;
        font-style: italic;
        line-height: 1.5;
        padding-left: calc(50% + 8px);
      }

      .notes-section {
        margin-top: 16px;
      }

      .notes-section label {
        color: #6b7280;
        font-size: 12px;
        text-transform: none;
        margin-bottom: 8px;
      }

      .total-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: center;
        margin-top: 32px;
        padding-top: 32px;
        border-top: 2px solid #e5e7eb;
      }

      .total-label {
        font-size: 18px;
        font-weight: bold;
        color: #002855;
      }

      .total-input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .total-amount {
        font-size: 20px;
        font-weight: bold;
        color: #002855;
        border: none !important;
        background: transparent !important;
        padding-left: 0 !important;
      }

      .pledge-footer {
        background: #002855;
        padding: 32px;
        text-align: center;
      }

      .error-message {
        background: #fee;
        color: #c00;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        text-align: center;
      }

      button[type="submit"] {
        padding: 12px 32px;
        background: white;
        color: #002855;
        font-weight: bold;
        font-size: 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      button[type="submit"]:hover:not(:disabled) {
        background: #f3f4f6;
      }

      @media (max-width: 640px) {
        .form-row, .gift-row, .total-section {
          grid-template-columns: 1fr;
        }

        .form-row-3 {
          grid-template-columns: 1fr;
        }

        .gift-description {
          padding-left: 24px;
        }

        .pledge-header, .pledge-body, .pledge-footer {
          padding: 24px;
        }

        .commitment-header {
          margin: -24px -24px 24px -24px;
        }
      }
    `;
  }
}
customElements.define("nw-pledge", y);
function k(a) {
  console.log("✅ Northwoods SDK initialized with token provider"), typeof window != "undefined" && (window.__nwTokenProvider = a.tokenProvider, console.log("✅ Token provider set on window.__nwTokenProvider")), a.tokenProvider.get().then((t) => {
    t ? console.log("✅ Token provider test successful, token length:", t.length) : console.error("❌ Token provider returned empty token");
  }).catch((t) => {
    console.error("❌ Token provider test failed:", t);
  });
}
typeof window != "undefined" && (window.NorthwoodsEmbed = {
  init: k,
  setTokenProvider: (a) => {
    window.__nwTokenProvider = a;
  }
});
export {
  S as ApiClient,
  w as NorthwoodsWidget,
  y as PledgeWidget,
  k as init
};
//# sourceMappingURL=nw-embed.es.js.map
