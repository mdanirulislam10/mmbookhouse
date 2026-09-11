'use server';

/**
 * Module 11 Task 5: Customer Address Book Server Actions & CRUD Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 21, 22, 23, 24, 38, 40):
 * - Max 15 addresses limit per customer (Item 21)
 * - Single default address enforcement & 1-click switch (Items 22, 23)
 * - Intelligent auto-default promotion on default deletion (Item 24)
 * - Soft delete (deleted_at) for historical and invoice integrity (Item 38)
 * - PostgreSQL customer_addresses schema alignment (Item 40)
 */

import { supabase } from '@/lib/supabase/client';
import {
  addressFormSchema,
  combineStreetAddress,
  splitStreetAddress,
  type ValidatedAddressFormData,
} from '@/lib/validations/address';
import {
  type AddressFormData,
  type CustomerAddress,
  MAX_ADDRESSES_PER_USER,
  DEFAULT_USER_ID,
} from '@/types/address';

// In-Memory Storage for Demo, Offline, and Unit Test environments
const inMemoryAddressStore = new Map<string, CustomerAddress[]>();

// Seed initial demo address if store is empty
function getSeedAddresses(userId: string): CustomerAddress[] {
  return [
    {
      id: 'addr-demo-001',
      user_id: userId,
      recipient_name: 'সাবির আহমেদ',
      recipient_phone: '9800123456',
      alternate_phone: '9733098765',
      address_line1: 'Holding No. 14, সুকান্ত পল্লী',
      address_line2: 'রথবাড়ি মোড়, পুরাতন জেল রোড',
      street_address: 'Holding No. 14, সুকান্ত পল্লী, রথবাড়ি মোড়, পুরাতন জেল রোড',
      landmark: 'গৌড় কলেজ মেন গেটের পাশে',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
      address_type: 'home',
      is_default: true,
      delivery_preferences: {
        callBeforeDelivery: true,
        leaveWithSecurity: false,
        doNotRingBell: false,
        preferredTimeSlot: 'morning_10_to_1',
      },
      created_at: '2025-01-10T10:00:00.000Z',
      updated_at: '2025-01-10T10:00:00.000Z',
      deleted_at: null,
    },
    {
      id: 'addr-demo-002',
      user_id: userId,
      recipient_name: 'সাবির আহমেদ (অফিস)',
      recipient_phone: '9800123456',
      alternate_phone: null,
      address_line1: 'এম.এম বুক হাউস মালদা, সেন্ট্রাল স্টোর',
      address_line2: 'ফোয়ারা মোড়, নেতাজি সুভাষ রোড',
      street_address: 'এম.এম বুক হাউস মালদা, সেন্ট্রাল স্টোর, ফোয়ারা মোড়, নেতাজি সুভাষ রোড',
      landmark: 'মালদা জেলা আদালত চত্বর',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
      address_type: 'work',
      is_default: false,
      delivery_preferences: {
        callBeforeDelivery: true,
        leaveWithSecurity: true,
        isWeekendClosed: true,
        preferredTimeSlot: 'evening_4_to_7',
      },
      created_at: '2025-02-15T14:30:00.000Z',
      updated_at: '2025-02-15T14:30:00.000Z',
      deleted_at: null,
    },
  ];
}

const isPlaceholderSupabase =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

// customer_addresses.user_id is a UUID referencing profiles(id). Guard every DB
// call so a non-UUID demo/placeholder id cannot trigger a PostgREST 22P02 error
// and silently drop the whole request onto the in-memory fallback store.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function canUseSupabaseForUser(userId: string): boolean {
  return !isPlaceholderSupabase && UUID_REGEX.test(userId);
}

function getUserStore(userId: string): CustomerAddress[] {
  if (!inMemoryAddressStore.has(userId)) {
    inMemoryAddressStore.set(userId, userId === DEFAULT_USER_ID ? getSeedAddresses(userId) : []);
  }
  return inMemoryAddressStore.get(userId)!;
}

/**
 * Normalizes raw database row into fully-typed CustomerAddress with address_line1 and line2
 */
function normalizeAddressRow(row: Record<string, unknown>): CustomerAddress {
  const street = (row.street_address as string) || '';
  const split = splitStreetAddress(street);

  return {
    id: (row.id as string) || `addr-${Date.now()}`,
    user_id: (row.user_id as string) || DEFAULT_USER_ID,
    recipient_name: (row.recipient_name as string) || '',
    recipient_phone: (row.recipient_phone as string) || '',
    alternate_phone: (row.alternate_phone as string) || null,
    address_line1: (row.address_line1 as string) || split.address_line1,
    address_line2: (row.address_line2 as string) || split.address_line2,
    street_address: street,
    landmark: (row.landmark as string) || '',
    city: (row.city as string) || 'Malda',
    district: (row.district as string) || 'Malda',
    state: (row.state as string) || 'West Bengal',
    pincode: (row.pincode as string) || '732101',
    address_type: ((row.address_type as string) || 'home') as CustomerAddress['address_type'],
    is_default: Boolean(row.is_default),
    delivery_preferences: (row.delivery_preferences as CustomerAddress['delivery_preferences']) || null,
    created_at: (row.created_at as string) || new Date().toISOString(),
    updated_at: (row.updated_at as string) || new Date().toISOString(),
    deleted_at: (row.deleted_at as string) || null,
  };
}

/**
 * 1. Fetch active customer addresses for the authenticated user
 */
export async function getCustomerAddresses(userId = DEFAULT_USER_ID): Promise<CustomerAddress[]> {
  if (canUseSupabaseForUser(userId)) {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(MAX_ADDRESSES_PER_USER);

      if (!error && data && data.length > 0) {
        return data.map(normalizeAddressRow);
      }
    } catch {
      // Supabase network error / offline fallback
    }
  }

  // Local Store Fallback
  const list = getUserStore(userId).filter((a) => !a.deleted_at);
  return list.sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * 2. Add a new customer address with max-15 limit & single-default enforcement
 */
export async function addCustomerAddress(
  formData: AddressFormData,
  userId = DEFAULT_USER_ID
): Promise<{ success: boolean; data?: CustomerAddress; error?: string }> {
  // 1. Zod Validation
  const validation = addressFormSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'অবৈধ ঠিকানার তথ্য (Invalid address data)',
    };
  }

  const validData: ValidatedAddressFormData = validation.data;

  // 2. Max 15 addresses check (Item 21)
  const existingAddresses = await getCustomerAddresses(userId);
  if (existingAddresses.length >= MAX_ADDRESSES_PER_USER) {
    return {
      success: false,
      error: `আপনি সর্বোচ্চ ১৫টি (${MAX_ADDRESSES_PER_USER}) ঠিকানা সংরক্ষণ করতে পারবেন। নতুন ঠিকানা যোগ করার পূর্বে অপ্রয়োজনীয় ঠিকানা মুছে ফেলুন।`,
    };
  }

  // 3. Auto-default rule: If it's the first address, it MUST be default
  const isDefault = existingAddresses.length === 0 ? true : Boolean(validData.is_default);

  const combinedStreet = combineStreetAddress(validData.address_line1, validData.address_line2);

  const newAddressId = `addr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newAddress: CustomerAddress = {
    id: newAddressId,
    user_id: userId,
    recipient_name: validData.recipient_name,
    recipient_phone: validData.recipient_phone,
    alternate_phone: validData.alternate_phone || null,
    address_line1: validData.address_line1,
    address_line2: validData.address_line2,
    street_address: combinedStreet,
    landmark: validData.landmark,
    city: validData.city,
    district: validData.district,
    state: validData.state,
    pincode: validData.pincode,
    address_type: validData.address_type,
    is_default: isDefault,
    delivery_preferences: validData.delivery_preferences || null,
    created_at: nowIso,
    updated_at: nowIso,
    deleted_at: null,
  };

  // 4. Update Supabase if available
  if (canUseSupabaseForUser(userId)) {
    try {
      if (isDefault) {
        // Unset previous default
        await supabase
          .from('customer_addresses')
          .update({ is_default: false, updated_at: nowIso })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      const { data: dbData, error: dbError } = await supabase
        .from('customer_addresses')
        .insert({
          id: newAddress.id,
          user_id: newAddress.user_id,
          recipient_name: newAddress.recipient_name,
          recipient_phone: newAddress.recipient_phone,
          alternate_phone: newAddress.alternate_phone,
          street_address: newAddress.street_address,
          landmark: newAddress.landmark,
          city: newAddress.city,
          district: newAddress.district,
          state: newAddress.state,
          pincode: newAddress.pincode,
          address_type: newAddress.address_type,
          is_default: newAddress.is_default,
          delivery_preferences: newAddress.delivery_preferences || {},
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (!dbError && dbData) {
        return { success: true, data: normalizeAddressRow(dbData) };
      }
    } catch {
      // Supabase offline: continue to local store
    }
  }

  // 5. Update local store
  const store = getUserStore(userId);
  if (isDefault) {
    store.forEach((a) => {
      a.is_default = false;
    });
  }
  store.unshift(newAddress);

  return { success: true, data: newAddress };
}

/**
 * 3. Update an existing address
 */
export async function updateCustomerAddress(
  addressId: string,
  formData: AddressFormData,
  userId = DEFAULT_USER_ID
): Promise<{ success: boolean; data?: CustomerAddress; error?: string }> {
  const validation = addressFormSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'অবৈধ ঠিকানার তথ্য',
    };
  }

  const validData: ValidatedAddressFormData = validation.data;
  const combinedStreet = combineStreetAddress(validData.address_line1, validData.address_line2);
  const nowIso = new Date().toISOString();

  // Try Supabase update
  if (canUseSupabaseForUser(userId)) {
    try {
      if (validData.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false, updated_at: nowIso })
          .eq('user_id', userId)
          .neq('id', addressId);
      }

      const { data: dbData, error: dbError } = await supabase
        .from('customer_addresses')
        .update({
          recipient_name: validData.recipient_name,
          recipient_phone: validData.recipient_phone,
          alternate_phone: validData.alternate_phone || null,
          street_address: combinedStreet,
          landmark: validData.landmark,
          city: validData.city,
          district: validData.district,
          state: validData.state,
          pincode: validData.pincode,
          address_type: validData.address_type,
          is_default: validData.is_default,
          delivery_preferences: validData.delivery_preferences || {},
          updated_at: nowIso,
        })
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (!dbError && dbData) {
        return { success: true, data: normalizeAddressRow(dbData) };
      }
    } catch {
      // Offline fallback
    }
  }

  // Update local store
  const store = getUserStore(userId);
  const target = store.find((a) => a.id === addressId && !a.deleted_at);
  if (!target) {
    return { success: false, error: 'ঠিকানাটি পাওয়া যায়নি (Address not found)' };
  }

  if (validData.is_default) {
    store.forEach((a) => {
      a.is_default = false;
    });
  }

  target.recipient_name = validData.recipient_name;
  target.recipient_phone = validData.recipient_phone;
  target.alternate_phone = validData.alternate_phone || null;
  target.address_line1 = validData.address_line1;
  target.address_line2 = validData.address_line2;
  target.street_address = combinedStreet;
  target.landmark = validData.landmark;
  target.city = validData.city;
  target.district = validData.district;
  target.state = validData.state;
  target.pincode = validData.pincode;
  target.address_type = validData.address_type;
  target.is_default = validData.is_default;
  target.delivery_preferences = validData.delivery_preferences || null;
  target.updated_at = nowIso;

  return { success: true, data: target };
}

/**
 * 4. 1-Click Set as Default Address (Item 23)
 */
export async function setDefaultAddress(
  addressId: string,
  userId = DEFAULT_USER_ID
): Promise<{ success: boolean; error?: string }> {
  const nowIso = new Date().toISOString();

  // Try Supabase update
  if (canUseSupabaseForUser(userId)) {
    try {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false, updated_at: nowIso })
        .eq('user_id', userId);

      const { error: dbError } = await supabase
        .from('customer_addresses')
        .update({ is_default: true, updated_at: nowIso })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (!dbError) {
        return { success: true };
      }
    } catch {
      // Offline fallback
    }
  }

  // Update local store
  const store = getUserStore(userId);
  const target = store.find((a) => a.id === addressId && !a.deleted_at);
  if (!target) {
    return { success: false, error: 'ঠিকানাটি পাওয়া যায়নি' };
  }

  store.forEach((a) => {
    a.is_default = a.id === addressId;
  });

  return { success: true };
}

/**
 * 5. Soft Delete Address with Intelligent Auto-Default Promotion (Items 24, 38)
 */
export async function deleteCustomerAddress(
  addressId: string,
  userId = DEFAULT_USER_ID
): Promise<{ success: boolean; newDefaultId?: string; error?: string }> {
  const nowIso = new Date().toISOString();
  let newDefaultId: string | undefined;

  // Check existing active addresses
  const store = getUserStore(userId);
  const target = store.find((a) => a.id === addressId && !a.deleted_at);

  if (!target) {
    return { success: false, error: 'ঠিকানাটি পাওয়া যায়নি' };
  }

  const wasDefault = target.is_default;
  target.deleted_at = nowIso;
  target.is_default = false;

  // Remaining active addresses
  const remaining = store.filter((a) => !a.deleted_at);

  // If deleted address was default, promote the first remaining address (Item 24)
  if (wasDefault && remaining.length > 0) {
    remaining[0].is_default = true;
    newDefaultId = remaining[0].id;
  }

  // Try Supabase soft delete
  if (canUseSupabaseForUser(userId)) {
    try {
      await supabase
        .from('customer_addresses')
        .update({ deleted_at: nowIso, is_default: false, updated_at: nowIso })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (newDefaultId) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: true, updated_at: nowIso })
          .eq('id', newDefaultId)
          .eq('user_id', userId);
      }
    } catch {
      // Offline fallback handled
    }
  }

  return { success: true, newDefaultId };
}
