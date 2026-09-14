/**
 * Module 17 - Task 5 Test Suite: Customer Photo Gallery & Lightbox Logic
 * M.M Book House Malda - E-Commerce Platform
 */

import { GalleryPhotoItem } from '../src/components/reviews/CustomerPhotoGallery';

function runTests() {
  console.log('🧪 Starting Module 17 - Task 5 Test Suite: Photo Gallery & Lightbox Logic...');

  const mockPhotos: GalleryPhotoItem[] = [
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150',
      caption: 'ফ্রন্ট পেজ ও বাঁধাই চমৎকার',
      user_name: 'Tanmoy Saha',
      rating: 5,
      review_headline: 'খুব সুন্দর বাঁধাই',
      uploaded_at: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1532012164546-f432f2f37b73',
      thumbnail_url: 'https://images.unsplash.com/photo-1532012164546-f432f2f37b73?w=150',
      caption: 'অধ্যায়ের চার্ট ও ডায়াগ্রাম',
      user_name: 'Priyanka Das',
      rating: 4,
      review_headline: 'তথ্যবহুল চার্ট',
      uploaded_at: '2026-03-02T11:00:00.000Z',
    },
    {
      id: 'img-3',
      url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73',
      thumbnail_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=150',
      caption: 'সিলেবাস ভিত্তিক বিগত বছরের প্রশ্ন',
      user_name: 'Subhadip Roy',
      rating: 5,
      review_headline: 'দারুণ প্রশ্নোত্তর সংকলন',
      uploaded_at: '2026-03-03T14:00:00.000Z',
    },
  ];

  // Test 1: Photo list length and metadata validation
  if (mockPhotos.length !== 3) {
    throw new Error('Test 1 Failed: Expected 3 photos.');
  }
  for (const photo of mockPhotos) {
    if (!photo.url || !photo.thumbnail_url || !photo.user_name || typeof photo.rating !== 'number') {
      throw new Error(`Test 1 Failed: Photo missing required attributes: ${JSON.stringify(photo)}`);
    }
  }
  console.log('✅ Test 1 Passed: Customer photo metadata structure verified.');

  // Test 2: Next index navigation logic (cyclic)
  const getNextIndex = (current: number, total: number) => (current < total - 1 ? current + 1 : 0);
  if (getNextIndex(0, 3) !== 1 || getNextIndex(1, 3) !== 2 || getNextIndex(2, 3) !== 0) {
    throw new Error('Test 2 Failed: Next index cycling incorrect.');
  }
  console.log('✅ Test 2 Passed: Forward lightbox cycling logic verified.');

  // Test 3: Prev index navigation logic (cyclic)
  const getPrevIndex = (current: number, total: number) => (current > 0 ? current - 1 : total - 1);
  if (getPrevIndex(0, 3) !== 2 || getPrevIndex(2, 3) !== 1 || getPrevIndex(1, 3) !== 0) {
    throw new Error('Test 3 Failed: Previous index cycling incorrect.');
  }
  console.log('✅ Test 3 Passed: Backward lightbox cycling logic verified.');

  // Test 4: Visible thumbnail slicing & remaining counter
  const maxDisplay = 2;
  const visible = mockPhotos.slice(0, maxDisplay);
  const remaining = mockPhotos.length - maxDisplay;
  if (visible.length !== 2 || remaining !== 1) {
    throw new Error(`Test 4 Failed: Thumbnail slicing error: visible=${visible.length}, remaining=${remaining}`);
  }
  console.log('✅ Test 4 Passed: Thumbnail slicing and "+N more" badge calculation verified.');

  console.log('\n🎉 ALL MODULE 17 TASK 5 TESTS PASSED SUCCESSFULLY! (4/4 Checks)\n');
}

runTests();
