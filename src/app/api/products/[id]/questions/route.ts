import { NextRequest, NextResponse } from 'next/server';
import { askQuestionSchema, answerQuestionSchema } from '@/lib/validations/reviews';
import { sanitizeReviewContent } from '@/lib/services/reviewModerationService';
import { ProductQuestion, ProductAnswer } from '@/types/reviews';

const globalQuestionsMap = new Map<string, ProductQuestion[]>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const allQuestions = globalQuestionsMap.get(productId) || [];

    let filtered = allQuestions;
    if (search && search.trim()) {
      const qLower = search.toLowerCase().trim();
      filtered = filtered.filter((q) => {
        const questionMatch = q.question_text.toLowerCase().includes(qLower);
        const answerMatch = q.answers.some((a) => a.answer_text.toLowerCase().includes(qLower));
        return questionMatch || answerMatch;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: filtered,
        total: filtered.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch questions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();

    // Check if answering an existing question or asking a new one
    if (body.question_id) {
      // Answering existing question
      const parsedAnswer = answerQuestionSchema.safeParse(body);
      if (!parsedAnswer.success) {
        return NextResponse.json(
          { success: false, error: 'Validation Error', issues: parsedAnswer.error.issues },
          { status: 400 }
        );
      }

      const questionsList = globalQuestionsMap.get(productId) || [];
      const question = questionsList.find((q) => q.id === body.question_id);
      if (!question) {
        return NextResponse.json(
          { success: false, error: 'Question not found' },
          { status: 404 }
        );
      }

      const sanitizedAnswer = sanitizeReviewContent(body.answer_text).sanitizedText;

      const newAnswer: ProductAnswer = {
        id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question_id: body.question_id,
        author_name: body.author_name || (body.is_seller ? 'M.M Book House' : 'Customer'),
        is_seller: Boolean(body.is_seller),
        is_verified_buyer: Boolean(body.is_verified_buyer),
        answer_text: sanitizedAnswer,
        upvotes_count: 0,
        created_at: new Date().toISOString(),
      };

      question.answers.push(newAnswer);
      question.answers_count = question.answers.length;

      return NextResponse.json({
        success: true,
        data: newAnswer,
        message: 'উত্তর সফলভাবে প্রকাশিত হয়েছে।',
      });
    }

    // Asking a new question
    const parsedQuestion = askQuestionSchema.safeParse({
      ...body,
      product_id: productId,
    });

    if (!parsedQuestion.success) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', issues: parsedQuestion.error.issues },
        { status: 400 }
      );
    }

    const sanitizedQuestionText = sanitizeReviewContent(parsedQuestion.data.question_text).sanitizedText;

    const newQuestion: ProductQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: productId,
      asked_by_name: body.asked_by_name || 'Customer',
      question_text: sanitizedQuestionText,
      answers_count: 0,
      answers: [],
      upvotes_count: 0,
      created_at: new Date().toISOString(),
    };

    const currentList = globalQuestionsMap.get(productId) || [];
    currentList.unshift(newQuestion);
    globalQuestionsMap.set(productId, currentList);

    return NextResponse.json({
      success: true,
      data: newQuestion,
      message: 'আপনার প্রশ্ন সফলভাবে গৃহীত হয়েছে।',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post question';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
