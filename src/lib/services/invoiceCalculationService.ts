import { SellerMetadata, InvoiceItem, TaxInvoice } from '../../types/invoice';

/**
 * Module 14: Default Legal Seller Metadata for MM Book House (Item 2)
 */
export const DEFAULT_SELLER_METADATA: SellerMetadata = {
  legal_name: 'MM ENTERPRISE',
  trade_name: 'M.M. BOOK HOUSE',
  address_line1: 'Netaji Subhash Road, English Bazar',
  city: 'Malda',
  district: 'Malda',
  state: 'West Bengal',
  state_code: '19',
  pincode: '732101',
  gstin: '19ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  phone: '+91 97330 00000',
  email: 'support@mmbookhouse.com',
  website: 'https://mmbookhouse.com',
};

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

/**
 * Helper to convert numbers less than 1000 to Indian English words
 */
function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ONES[n % 10] : '');
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

/**
 * Converts currency amount into Indian English Words using Lakhs and Crores standard (Item 6).
 * e.g. 150250.50 -> "Indian Rupees One Lakh Fifty Thousand Two Hundred Fifty and Fifty Paise Only"
 */
export function convertAmountToIndianWords(amount: number): string {
  if (amount === 0) {
    return 'Indian Rupees Zero Only';
  }

  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const parts = rounded.toString().split('.');
  const whole = parseInt(parts[0], 10);
  const decimal = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;

  if (isNaN(whole)) {
    return 'Indian Rupees Zero Only';
  }

  let words = '';

  const crore = Math.floor(whole / 10000000);
  let remainder = whole % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) {
    words += convertBelowThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertBelowThousand(remainder) + ' ';
  }

  words = words.trim();
  let result = words ? `Indian Rupees ${words}` : 'Indian Rupees Zero';

  if (decimal > 0) {
    const paiseWords = convertBelowThousand(decimal);
    result += ` and ${paiseWords} Paise`;
  }

  return `${result} Only`;
}

export interface CalculateInvoiceInputItem {
  itemId: string;
  title: string;
  titleBn?: string;
  author?: string;
  isbn13?: string;
  hsnCode?: string;
  quantity: number;
  unitSellingPrice: number;
  unitMrp: number;
}

export interface CalculateInvoiceInput {
  orderId: string;
  financialYear: string;
  customerName: string;
  customerPhone: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  pincode: string;
  customerGstin?: string;
  companyName?: string;
  items: CalculateInvoiceInputItem[];
  couponDiscount?: number;
  shippingFee?: number;
  codHandlingFee?: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';
  paymentStatus: 'PAID' | 'COD_COLLECT';
  utrOrRrn?: string;
  sellerMetadata?: SellerMetadata;
}

/**
 * Zero-client-trust Server-side GST Calculation & Itemized Breakdown Engine
 * (Items 1, 4, 6, 7, 48)
 */
export function calculateInvoiceBreakdown(
  input: CalculateInvoiceInput,
  invoiceNumber: string,
  verificationQrUrl: string
): TaxInvoice {
  const seller = input.sellerMetadata || DEFAULT_SELLER_METADATA;
  const isInterstate = input.stateCode !== seller.state_code;
  const isB2B = Boolean(input.customerGstin && input.customerGstin.trim().length === 15);

  let subtotalMrp = 0;
  let subtotalSellingPrice = 0;

  const items: InvoiceItem[] = input.items.map((it) => {
    const hsn = it.hsnCode || '4901';
    const taxableValue = Math.round(it.unitSellingPrice * it.quantity * 100) / 100;
    subtotalMrp += Math.round(it.unitMrp * it.quantity * 100) / 100;
    subtotalSellingPrice += taxableValue;

    // Printed books (HSN 4901) are Nil-rated (0% GST) under Indian GST Law
    const isBookHsn = hsn.startsWith('4901');
    const cgstRate = isBookHsn ? 0 : isInterstate ? 0 : 0.09;
    const sgstRate = isBookHsn ? 0 : isInterstate ? 0 : 0.09;
    const igstRate = isBookHsn ? 0 : isInterstate ? 0.18 : 0;

    const cgstAmount = Math.round(taxableValue * cgstRate * 100) / 100;
    const sgstAmount = Math.round(taxableValue * sgstRate * 100) / 100;
    const igstAmount = Math.round(taxableValue * igstRate * 100) / 100;
    const totalItemAmount = taxableValue + cgstAmount + sgstAmount + igstAmount;

    return {
      item_id: it.itemId,
      book_title: it.title,
      book_title_bn: it.titleBn,
      author_name: it.author,
      isbn13: it.isbn13,
      hsn_code: hsn,
      quantity: it.quantity,
      unit_mrp: it.unitMrp,
      unit_selling_price: it.unitSellingPrice,
      taxable_value: taxableValue,
      cgst_rate: cgstRate,
      cgst_amount: cgstAmount,
      sgst_rate: sgstRate,
      sgst_amount: sgstAmount,
      igst_rate: igstRate,
      igst_amount: igstAmount,
      total_item_amount: totalItemAmount,
    };
  });

  const couponDiscount = Math.max(0, input.couponDiscount || 0);
  const shippingFee = Math.max(0, input.shippingFee || 0);
  const codHandlingFee = Math.max(0, input.codHandlingFee || 0);

  // Calculate taxes across all items
  const totalCgst = items.reduce((sum, item) => sum + item.cgst_amount, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgst_amount, 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igst_amount, 0);

  const totalTaxableAmount = Math.max(
    0,
    Math.round((subtotalSellingPrice - couponDiscount + shippingFee + codHandlingFee) * 100) / 100
  );

  const totalPayableAmount = Math.round((totalTaxableAmount + totalCgst + totalSgst + totalIgst) * 100) / 100;
  const amountInWords = convertAmountToIndianWords(totalPayableAmount);

  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    invoice_number: invoiceNumber,
    financial_year: input.financialYear,
    order_id: input.orderId,
    invoice_date: new Date().toISOString().split('T')[0],
    seller,
    customer: {
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      street_address: input.streetAddress,
      landmark: input.landmark,
      city: input.city,
      district: input.district,
      state: input.state,
      state_code: input.stateCode,
      pincode: input.pincode,
      gstin: input.customerGstin,
      company_name: input.companyName,
    },
    items,
    subtotal_mrp: subtotalMrp,
    subtotal_selling_price: subtotalSellingPrice,
    coupon_discount: couponDiscount,
    shipping_fee: shippingFee,
    cod_handling_fee: codHandlingFee,
    total_taxable_amount: totalTaxableAmount,
    total_cgst: totalCgst,
    total_sgst: totalSgst,
    total_igst: totalIgst,
    total_payable_amount: totalPayableAmount,
    amount_in_words: amountInWords,
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    utr_or_rrn: input.utrOrRrn,
    verification_qr_url: verificationQrUrl,
    is_b2b: isB2B,
    is_interstate: isInterstate,
    created_at: new Date().toISOString(),
  };
}
