const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Prices are stored in paise: ₹1,058 for whole rupees, ₹1,058.50 otherwise.
export const inr = (paise) => ((paise || 0) % 100 === 0 ? whole : exact).format((paise || 0) / 100);

export const savingsPercent = (price, compareAt) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

export const toPaise = (rupeesValue) => Math.round(Number(rupeesValue) * 100);
export const toRupees = (paise) => (paise == null ? '' : String(paise / 100));

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
export const dateTime = (iso) => (iso ? dateFmt.format(new Date(iso)) : '');

// Description text: blank lines separate paragraphs.
export const paragraphs = (text) =>
  String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
