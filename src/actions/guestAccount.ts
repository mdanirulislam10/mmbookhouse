'use server';

/**
 * Module 12 - Item 49: Guest-to-Account Password Creation Server Action
 * Seamlessly creates a permanent customer account after order completion.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function createGuestAccountAction({
  orderNumber,
  recipientName,
  phone,
  password,
}: {
  orderNumber: string;
  recipientName?: string;
  phone: string;
  password: string;
}): Promise<{ success: boolean; error?: string; errorBn?: string }> {
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long',
      errorBn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
    };
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const syntheticEmail = `${cleanPhone}@mmbookhouse.customer`;

  try {
    // 1. Create or update user in Supabase Auth via Admin API
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      phone: `+91${cleanPhone}`,
      user_metadata: {
        full_name: recipientName || 'M.M Book House Customer',
      },
      email_confirm: true,
      phone_confirm: true,
    });

    if (authErr) {
      if (authErr.message?.toLowerCase().includes('already') || authErr.code === 'email_exists') {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userList?.users.find(
          (u) => u.email === syntheticEmail || u.phone === `+91${cleanPhone}`
        );
        if (existingUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
          await supabaseAdmin
            .from('orders')
            .update({ user_id: existingUser.id })
            .eq('order_number', orderNumber);
          return { success: true };
        }
      }
      return {
        success: false,
        error: authErr.message,
        errorBn: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে: ' + authErr.message,
      };
    }

    const userId = authUser?.user?.id;

    if (userId) {
      // 2. Link created user to the order
      await supabaseAdmin
        .from('orders')
        .update({ user_id: userId })
        .eq('order_number', orderNumber);

      // 3. Upsert profile record
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: recipientName || 'M.M Book House Customer',
        phone_number: `+91${cleanPhone}`,
        role: 'customer',
        preferred_language: 'bn',
        is_verified: true,
        updated_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Guest account creation error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to create guest account',
      errorBn: 'পাসওয়ার্ড সংরক্ষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
    };
  }
}
