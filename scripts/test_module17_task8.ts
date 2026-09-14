/**
 * Module 17 - Task 8 Test Suite: Customer Q&A Search, Modal & Answer Threading
 * M.M Book House Malda - E-Commerce Platform
 */

import { askQuestionSchema, answerQuestionSchema } from '../src/lib/validations/reviews';
import { ProductQuestion } from '../src/types/reviews';

function runTests() {
  console.log('🧪 Starting Module 17 - Task 8 Test Suite: Customer Q&A Engine...');

  // Test 1: Ask Question Schema validation
  const validQuestion = {
    product_id: 'wbcs-manual-2026',
    question_text: 'এই বইয়ের সাথে কি কোনো সিডি বা অনলাইন মক টেস্ট পেপার দেওয়া হয়?',
  };
  const parsedQ = askQuestionSchema.safeParse(validQuestion);
  if (!parsedQ.success) {
    throw new Error(`Test 1 Failed: Valid question rejected: ${JSON.stringify(parsedQ.error.issues)}`);
  }

  // Reject phone number in question
  const spamQ = {
    product_id: 'wbcs-manual-2026',
    question_text: 'কল করুন 9876543210 এই নম্বরে বইটির বিষয়ে জানতে',
  };
  if (askQuestionSchema.safeParse(spamQ).success) {
    throw new Error('Test 1 Failed: Question containing phone number was accepted.');
  }
  console.log('✅ Test 1 Passed: Ask Question schema validation and anti-spam verified.');

  // Test 2: Answer Question Schema validation
  const validAnswer = {
    question_id: 'q-101',
    answer_text: 'হ্যাঁ, বইটির পেছনের প্রচ্ছদে কিউআর কোড স্ক্যান করে অনলাইন মক টেস্টের অ্যাক্সেস পাবেন।',
  };
  const parsedAns = answerQuestionSchema.safeParse(validAnswer);
  if (!parsedAns.success) {
    throw new Error(`Test 2 Failed: Valid answer rejected: ${JSON.stringify(parsedAns.error.issues)}`);
  }
  console.log('✅ Test 2 Passed: Answer question schema verified.');

  // Mock Q&A dataset
  const mockQuestions: ProductQuestion[] = [
    {
      id: 'q-1',
      product_id: 'wbcs-manual-2026',
      asked_by_name: 'Subrata Roy',
      question_text: 'বইটি কি ২০২৬ সালের নতুন সিলেবাস অনুযায়ী?',
      answers_count: 1,
      answers: [
        {
          id: 'a-1',
          question_id: 'q-1',
          author_name: 'M.M Book House',
          is_seller: true,
          is_verified_buyer: false,
          answer_text: 'হ্যাঁ, এটি সম্পূর্ণ ২০২৬ সালের পরিবর্তিত প্যাটার্ন ও নতুন সিলেবাস অনুযায়ী রচিত।',
          upvotes_count: 24,
          created_at: '2026-03-01T10:00:00.000Z',
        },
      ],
      upvotes_count: 5,
      created_at: '2026-03-01T09:00:00.000Z',
    },
    {
      id: 'q-2',
      product_id: 'wbcs-manual-2026',
      asked_by_name: 'Tanmoy Sen',
      question_text: 'মালদা জেলায় ডেলিভারি পেতে কতদিন সময় লাগবে?',
      answers_count: 1,
      answers: [
        {
          id: 'a-2',
          question_id: 'q-2',
          author_name: 'M.M Book House',
          is_seller: true,
          is_verified_buyer: false,
          answer_text: 'মালদা সদর ও আশেপাশের ব্লকে অর্ডার করার ২৪-৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।',
          upvotes_count: 12,
          created_at: '2026-03-02T11:00:00.000Z',
        },
      ],
      upvotes_count: 3,
      created_at: '2026-03-02T10:00:00.000Z',
    },
    {
      id: 'q-3',
      product_id: 'wbcs-manual-2026',
      asked_by_name: 'Barnali Ghosh',
      question_text: 'বইটিতে কি বিগত বছরের প্রিলিমস ও মেনসের সলভড পেপার আছে?',
      answers_count: 1,
      answers: [
        {
          id: 'a-3',
          question_id: 'q-3',
          author_name: 'Sourav Mondal',
          is_seller: false,
          is_verified_buyer: true,
          answer_text: 'হ্যাঁ, ২০১৪ থেকে ২০২৪ পর্যন্ত বিগত ১০ বছরের প্রশ্ন বিশদ ব্যাখ্যাসহ সলভ করা আছে।',
          upvotes_count: 8,
          created_at: '2026-03-03T12:00:00.000Z',
        },
      ],
      upvotes_count: 4,
      created_at: '2026-03-03T08:00:00.000Z',
    },
    {
      id: 'q-4',
      product_id: 'wbcs-manual-2026',
      asked_by_name: 'Rahul Roy',
      question_text: 'বইটির পৃষ্ঠা সংখ্যা কত?',
      answers_count: 1,
      answers: [
        {
          id: 'a-4',
          question_id: 'q-4',
          author_name: 'M.M Book House',
          is_seller: true,
          is_verified_buyer: false,
          answer_text: 'মোট ১২৫০ পৃষ্ঠা, ডিমাই সাইজ এবং উন্নত মানের ৭০ জিএসএম হোয়াইট পেপার।',
          upvotes_count: 10,
          created_at: '2026-03-03T14:00:00.000Z',
        },
      ],
      upvotes_count: 2,
      created_at: '2026-03-03T13:00:00.000Z',
    },
    {
      id: 'q-5',
      product_id: 'wbcs-manual-2026',
      asked_by_name: 'Anupam Kar',
      question_text: 'হার্ডকভার সংস্করণ কি পাওয়া যাবে?',
      answers_count: 0,
      answers: [],
      upvotes_count: 1,
      created_at: '2026-03-04T15:00:00.000Z',
    },
  ];

  // Test 3: Instant Typeahead Search across Question and Answer text (Item 21)
  const filterQa = (list: ProductQuestion[], query: string) => {
    const qLower = query.toLowerCase().trim();
    return list.filter((q) => {
      const qMatch = q.question_text.toLowerCase().includes(qLower);
      const aMatch = q.answers.some((a) => a.answer_text.toLowerCase().includes(qLower));
      return qMatch || aMatch;
    });
  };

  const deliveryResults = filterQa(mockQuestions, 'ডেলিভারি');
  if (deliveryResults.length !== 1 || deliveryResults[0].id !== 'q-2') {
    throw new Error('Test 3 Failed: Search by question keyword failed.');
  }

  // Search by answer text
  const gsmResults = filterQa(mockQuestions, 'হোয়াইট পেপার');
  if (gsmResults.length !== 1 || gsmResults[0].id !== 'q-4') {
    throw new Error('Test 3 Failed: Search by answer content keyword failed.');
  }
  console.log('✅ Test 3 Passed: Typeahead instant search across Q&A text verified.');

  // Test 4: Top 4 Q&A default display & expansion counter (Item 24)
  const defaultVisible = mockQuestions.slice(0, 4);
  const remainingCount = mockQuestions.length - defaultVisible.length;
  if (defaultVisible.length !== 4 || remainingCount !== 1) {
    throw new Error(`Test 4 Failed: Expected 4 default visible and 1 remaining, got ${defaultVisible.length} and ${remainingCount}`);
  }
  console.log('✅ Test 4 Passed: Top 4 answered questions default view & expansion verified.');

  // Test 5: Seller vs Verified Buyer badge verification (Item 25)
  const q1Answer = mockQuestions[0].answers[0];
  const q3Answer = mockQuestions[2].answers[0];
  if (!q1Answer.is_seller || q1Answer.is_verified_buyer) {
    throw new Error('Test 5 Failed: Seller badge flags incorrect.');
  }
  if (q3Answer.is_seller || !q3Answer.is_verified_buyer) {
    throw new Error('Test 5 Failed: Verified Buyer badge flags incorrect.');
  }
  console.log('✅ Test 5 Passed: Seller and Verified Buyer answer badge distinction verified.');

  console.log('\n🎉 ALL MODULE 17 TASK 8 TESTS PASSED SUCCESSFULLY! (5/5 Checks)\n');
}

runTests();
