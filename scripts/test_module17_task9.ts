/**
 * Module 17 - Task 9 Test Suite: Reviews & Q&A REST API Endpoints
 * M.M Book House Malda - E-Commerce Platform
 */

import { NextRequest } from 'next/server';
import { GET as getReviews, POST as postReview } from '../src/app/api/products/[id]/reviews/route';
import { GET as getQuestions, POST as postQuestion } from '../src/app/api/products/[id]/questions/route';
import { POST as postVote } from '../src/app/api/reviews/[id]/vote/route';

async function runTests() {
  console.log('🧪 Starting Module 17 - Task 9 Test Suite: REST API Endpoints...');

  const productId = 'wbcs-manual-2026';

  // Test 1: GET reviews initially empty
  const req1 = new NextRequest(`http://localhost:3000/api/products/${productId}/reviews`);
  const res1 = await getReviews(req1, { params: Promise.resolve({ id: productId }) });
  const json1 = await res1.json();
  if (!json1.success || json1.data.reviews.length !== 0) {
    throw new Error('Test 1 Failed: Initial reviews list should be empty.');
  }
  console.log('✅ Test 1 Passed: Initial GET reviews endpoint verified.');

  // Test 2: POST a new review
  const reviewBody = {
    product_id: productId,
    order_id: 'order-deliv-889',
    user_id: 'user-77',
    user_name: 'Tanmoy Mukherjee',
    user_location: 'Malda Town',
    rating: 5,
    headline: 'অসাধারণ উপস্থাপনা ও বাঁধাই চমৎকার',
    body: 'বইটির ছাপা স্পষ্ট এবং সিলেবাস সম্পূর্ণ কভার করা হয়েছে। ফোন নম্বর 9876543210',
    aspect_ratings: {
      printing_quality: 5,
      content_quality: 5,
      syllabus_relevance: 5,
    },
    would_recommend: true,
  };

  const req2 = new NextRequest(`http://localhost:3000/api/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewBody),
  });
  const res2 = await postReview(req2, { params: Promise.resolve({ id: productId }) });
  const json2 = await res2.json();
  if (!json2.success || json2.data.rating !== 5) {
    throw new Error(`Test 2 Failed: Review creation failed: ${JSON.stringify(json2)}`);
  }
  // Verify contact masking
  if (json2.data.body.includes('9876543210')) {
    throw new Error('Test 2 Failed: Phone number was not sanitized in review body.');
  }
  const createdReviewId = json2.data.id;
  console.log('✅ Test 2 Passed: POST review endpoint with sanitization verified.');

  // Test 3: GET reviews after submission reflects updated histogram & review list
  const req3 = new NextRequest(`http://localhost:3000/api/products/${productId}/reviews?sort=top_reviews`);
  const res3 = await getReviews(req3, { params: Promise.resolve({ id: productId }) });
  const json3 = await res3.json();
  if (json3.data.reviews.length !== 1 || json3.data.summary.average_rating !== 5) {
    throw new Error('Test 3 Failed: GET reviews did not return updated review and summary.');
  }
  console.log('✅ Test 3 Passed: GET reviews returns updated histogram and review list.');

  // Test 4: POST and GET Q&A question
  const qBody = {
    asked_by_name: 'Anupam Kar',
    question_text: 'এই বইয়ের ডেলিভারি কি মালদায় ২৪ ঘণ্টার মধ্যে হবে?',
  };
  const req4 = new NextRequest(`http://localhost:3000/api/products/${productId}/questions`, {
    method: 'POST',
    body: JSON.stringify(qBody),
  });
  const res4 = await postQuestion(req4, { params: Promise.resolve({ id: productId }) });
  const json4 = await res4.json();
  if (!json4.success || !json4.data.id) {
    throw new Error('Test 4 Failed: Question creation failed.');
  }
  const createdQuestionId = json4.data.id;

  const req5 = new NextRequest(`http://localhost:3000/api/products/${productId}/questions`);
  const res5 = await getQuestions(req5, { params: Promise.resolve({ id: productId }) });
  const json5 = await res5.json();
  if (json5.data.questions.length !== 1 || json5.data.questions[0].id !== createdQuestionId) {
    throw new Error('Test 4 Failed: Question retrieval failed.');
  }
  console.log('✅ Test 4 Passed: POST & GET Question endpoints verified.');

  // Test 5: Answer the question
  const ansBody = {
    question_id: createdQuestionId,
    author_name: 'M.M Book House',
    is_seller: true,
    answer_text: 'হ্যাঁ, মালদা শহরের মধ্যে ২৪ ঘণ্টার মধ্যে হোম ডেলিভারি দেওয়া হয়।',
  };
  const req6 = new NextRequest(`http://localhost:3000/api/products/${productId}/questions`, {
    method: 'POST',
    body: JSON.stringify(ansBody),
  });
  const res6 = await postQuestion(req6, { params: Promise.resolve({ id: productId }) });
  const json6 = await res6.json();
  if (!json6.success || !json6.data.is_seller) {
    throw new Error('Test 5 Failed: Answer posting failed.');
  }
  console.log('✅ Test 5 Passed: Answering question with seller badge verified.');

  // Test 6: Helpful voting on review & self-vote prevention
  // Self vote should be blocked
  const selfVoteReq = new NextRequest(`http://localhost:3000/api/reviews/${createdReviewId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      vote_type: 'helpful',
      user_id: 'user-77',
      review_author_id: 'user-77',
    }),
  });
  const selfVoteRes = await postVote(selfVoteReq, { params: Promise.resolve({ id: createdReviewId }) });
  if (selfVoteRes.status !== 403) {
    throw new Error('Test 6 Failed: Self-voting must be blocked with 403 Forbidden.');
  }

  // Non-author vote should succeed
  const validVoteReq = new NextRequest(`http://localhost:3000/api/reviews/${createdReviewId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      vote_type: 'helpful',
      user_id: 'other-user-99',
      review_author_id: 'user-77',
    }),
  });
  const validVoteRes = await postVote(validVoteReq, { params: Promise.resolve({ id: createdReviewId }) });
  const validVoteJson = await validVoteRes.json();
  if (!validVoteJson.success || validVoteJson.data?.helpful_votes_count !== 1) {
    throw new Error(`Test 6 Failed: status=${validVoteRes.status}, body=${JSON.stringify(validVoteJson)}`);
  }
  console.log('✅ Test 6 Passed: Helpful voting and self-vote lock verified.');

  // Test 7: Abuse reporting & quarantine threshold
  for (let i = 1; i <= 3; i++) {
    const abuseReq = new NextRequest(`http://localhost:3000/api/reviews/${createdReviewId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        vote_type: 'report_abuse',
        user_id: `reporter-${i}`,
        reason: 'Spam or offensive content',
      }),
    });
    const abuseRes = await postVote(abuseReq, { params: Promise.resolve({ id: createdReviewId }) });
    const abuseJson = await abuseRes.json();
    if (!abuseJson.success) {
      throw new Error(`Test 7 Failed on report ${i}`);
    }
    if (i === 3 && !abuseJson.data.is_auto_quarantined) {
      throw new Error('Test 7 Failed: 3rd abuse report did not trigger auto-quarantine.');
    }
  }
  console.log('✅ Test 7 Passed: Abuse reporting and 3-report auto-quarantine verified.');

  console.log('\n🎉 ALL MODULE 17 TASK 9 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
