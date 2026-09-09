'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { UserAddress } from '@/types/header';

interface UseUserAddressSyncProps {
  onAddressFound?: (pincode: string, customerName: string) => void;
}

export function useUserAddressSync({ onAddressFound }: UseUserAddressSyncProps = {}) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<UserAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkUserAndSyncAddress() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setDefaultAddress(null);
          }
          return;
        }

        if (isMounted) {
          setUser({ id: session.user.id, email: session.user.email });
          setIsLoading(true);
        }

        // 1. Fetch user profile for full name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        // 2. Fetch user default address
        const { data: addressData } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (addressData && isMounted) {
          const customerName = addressData.recipient_name || profile?.full_name || 'Customer';

          setDefaultAddress({
            id: addressData.id,
            fullName: addressData.recipient_name || profile?.full_name || 'Customer',
            phoneNumber: addressData.recipient_phone || '',
            addressLine1: addressData.street_address || '',
            addressLine2: addressData.address_line2 || addressData.area || '',
            landmark: addressData.landmark,
            city: addressData.city,
            district: addressData.district,
            state: addressData.state,
            pincode: addressData.pincode,
            isDefault: true,
            addressType: addressData.address_type || 'home',
          });

          if (onAddressFound && addressData.pincode) {
            onAddressFound(addressData.pincode, customerName);
          }
        }
      } catch (err) {
        console.warn('Could not sync user address from Supabase:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkUserAndSyncAddress();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUserAndSyncAddress();
      } else {
        setUser(null);
        setDefaultAddress(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [onAddressFound]);

  return {
    user,
    defaultAddress,
    isLoading,
  };
}
