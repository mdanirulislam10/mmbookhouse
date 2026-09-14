import { generateCode128Svg } from '../src/lib/services/barcodeGenerator';
import { 
  generateThermalShippingLabelHtml, 
  generatePackingSlipHtml 
} from '../src/lib/services/thermalLabelService';
import { ThermalShippingLabelData, PackingSlipData } from '../src/types/invoice';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 14 - Task 4 Test Suite: 4x6" Thermal Label, Code 128 Barcode & Packing Slip...\n');

// 1. Test Code 128 Barcode Generator (Item 22)
const awb = 'DEL123456789IN';
const barcodeSvg = generateCode128Svg(awb, 55, 1.8);
assert(Boolean(barcodeSvg.includes('<svg') && barcodeSvg.includes('</svg>')), 'Barcode generates valid SVG');
assert(Boolean(barcodeSvg.includes('<rect') && barcodeSvg.includes('fill="#000000"')), 'Barcode contains black bar rects');
assert(Boolean(barcodeSvg.includes(awb)), 'Barcode contains human-readable text');

// 2. Test Thermal Shipping Label HTML (Items 21, 23, 24, 25, 26, 28, 29)
const labelData: ThermalShippingLabelData = {
  awb_tracking_number: awb,
  courier_name: 'Delhivery Express',
  order_id: 'ORD-2026-8877',
  invoice_number: 'INV-MMB-2026-0045',
  recipient_name: 'Subhas Chandra Bose',
  recipient_phone: '9830098300',
  recipient_address: '12/4 Subhas Pally, Rathbari',
  recipient_landmark: 'Opposite Malda Town Railway Station', // Item 23
  recipient_pincode: '732101',
  recipient_city: 'Malda',
  recipient_district: 'Malda',
  recipient_state: 'West Bengal',
  seller_return_address: 'M.M. BOOK HOUSE, Netaji Subhash Road, English Bazar, Malda, WB - 732101, Phone: +91 97330 00000', // Item 24
  payment_mode: 'COD', // Item 25
  collectable_amount: 540,
  weight_kg: 0.48, // Item 28
  otp_badge: 'SECURE OTP REQUIRED', // Item 29
};

const labelHtml = generateThermalShippingLabelHtml(labelData);
assert(Boolean(labelHtml.includes('100mm 150mm')), 'Complies with 4x6" (100mm x 150mm) thermal page size (Item 21)');
assert(Boolean(labelHtml.includes('Delhivery Express')), 'Displays Courier Partner');
assert(Boolean(labelHtml.includes('MALDA / CCU')), 'Displays Hub routing badge (Item 26)');
assert(Boolean(labelHtml.includes('Opposite Malda Town Railway Station')), 'Displays Landmark prominently (Item 23)');
assert(Boolean(labelHtml.includes('RETURN IF UNDELIVERED TO (RTO):')), 'Displays RTO address (Item 24)');
assert(Boolean(labelHtml.includes('COD COLLECT: ₹540')), 'Displays COD Collectable Amount (Item 25)');
assert(Boolean(labelHtml.includes('WT: 0.48 KG')), 'Displays Package Dead/Volumetric Weight (Item 28)');
assert(Boolean(labelHtml.includes('SECURE OTP REQUIRED')), 'Displays Secure OTP badge (Item 29)');

// 3. Test Prepaid Shipping Label variant
const prepaidLabelHtml = generateThermalShippingLabelHtml({
  ...labelData,
  payment_mode: 'PREPAID',
  collectable_amount: 0,
  otp_badge: '',
});
assert(Boolean(prepaidLabelHtml.includes('PREPAID')), 'Renders PREPAID badge correctly');
assert(Boolean(!prepaidLabelHtml.includes('COD COLLECT')), 'Prepaid label does not have COD collect banner');

// 4. Test Warehouse A5 Packing Slip Generator (Item 30)
const slipData: PackingSlipData = {
  order_id: 'ORD-2026-8877',
  invoice_number: 'INV-MMB-2026-0045',
  customer_name: 'Subhas Chandra Bose',
  delivery_speed: 'EXPRESS AIR',
  items: [
    {
      title: 'The Indian Struggle',
      title_bn: 'দ্য ইন্ডিয়ান স্ট্রাগল',
      author: 'Subhas Chandra Bose',
      isbn13: '9788172154432',
      quantity: 2,
      verified: false,
    }
  ],
  packer_note: 'Fragile: Double bubble wrap requested',
};

const slipHtml = generatePackingSlipHtml(slipData);
assert(Boolean(slipHtml.includes('size: A5;')), 'Packing slip adheres to A5 dimensions');
assert(Boolean(slipHtml.includes('The Indian Struggle')), 'Contains book item');
assert(Boolean(slipHtml.includes('RACK-B2')), 'Contains warehouse bin location');
assert(Boolean(slipHtml.includes('EXPRESS AIR')), 'Displays delivery priority');
assert(Boolean(slipHtml.includes('Double bubble wrap requested')), 'Contains packer instructions');

console.log('\n🎉 ALL MODULE 14 TASK 4 TESTS PASSED SUCCESSFULLY! (15/15 Checks)');
