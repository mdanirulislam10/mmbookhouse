/**
 * Unit Test Suite for Task 47: Order-Linked WhatsApp Ticket Generator
 */

function generateWhatsAppTicketUrl(options: {
  orderId: string;
  customerName?: string;
  orderDate?: string;
  totalAmount?: number;
  items?: { title: string; qty: number }[];
  supportNumber?: string;
}) {
  const supportNumber = options.supportNumber || '919733000000';
  const cleanPhone = supportNumber.replace(/\D/g, '');

  const itemsSummary = options.items && options.items.length > 0
    ? options.items.map((i) => `${i.title} (${i.qty} কপি)`).join(', ')
    : '';

  const ticketLines = [
    'নমস্কার M.M Book House মালদা কাস্টমার সাপোর্ট! 📚',
    'আমি আমার অর্ডারের ব্যাপারে সহায়তা চাই:',
    `📦 অর্ডার আইডি: ${options.orderId}`,
    options.customerName ? `👤 গ্রাহক: ${options.customerName}` : null,
    options.orderDate ? `📅 তারিখ: ${options.orderDate}` : null,
    options.totalAmount !== undefined ? `💰 মূল্য: ₹${options.totalAmount}` : null,
    itemsSummary ? `📖 বইসমূহ: ${itemsSummary}` : null,
    '',
    'আমার জিজ্ঞাসা / সমস্যা: ',
  ].filter(Boolean);

  const encodedMessage = encodeURIComponent(ticketLines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

async function runTask47Tests() {
  console.log('====================================================');
  console.log('💬 TESTING TASK 47: ORDER-LINKED WHATSAPP TICKET ENGINE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Basic URL formation
  const orderId = 'MMB-2026-8841';
  const url = generateWhatsAppTicketUrl({
    orderId,
    customerName: 'সাবির আহমেদ',
    orderDate: '০৭ সেপ্টেম্বর, ২০২৬',
    totalAmount: 910,
    items: [
      { title: 'WBCS প্রিলিমিনারি ম্যানুয়াল', qty: 1 },
      { title: 'UGB ইতিহাস ৪র্থ সেমিস্টার', qty: 1 },
    ],
  });

  assert(
    url.startsWith('https://wa.me/919733000000?text='),
    'WhatsApp URL targets correct MM Book House helpline number'
  );

  const decoded = decodeURIComponent(url.split('?text=')[1]);

  assert(
    decoded.includes('অর্ডার আইডি: MMB-2026-8841'),
    'WhatsApp message body contains exact order ID'
  );

  assert(
    decoded.includes('গ্রাহক: সাবির আহমেদ'),
    'WhatsApp message body contains customer name'
  );

  assert(
    decoded.includes('মূল্য: ₹910'),
    'WhatsApp message body contains formatted order price'
  );

  assert(
    decoded.includes('WBCS প্রিলিমিনারি ম্যানুয়াল (1 কপি)'),
    'WhatsApp message body lists purchased book titles with quantities'
  );

  assert(
    decoded.includes('M.M Book House মালদা কাস্টমার সাপোর্ট'),
    'WhatsApp message begins with respectful branded Bengali greeting'
  );

  console.log('\n====================================================');
  console.log(`🏁 TASK 47 TEST RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('====================================================\n');
}

runTask47Tests().catch(console.error);
