'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SeasonalCampaign } from '@/types/campaign';
import { SCHEDULED_CAMPAIGNS } from '@/lib/data/campaigns';

const DISMISSED_CAMPAIGN_KEY = 'mm_dismissed_campaign_id';

export function useCampaignController() {
  const [now, setNow] = useState<number>(Date.now());
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    // Check if dismissed in this browser session
    try {
      const stored = sessionStorage.getItem(DISMISSED_CAMPAIGN_KEY);
      if (stored) {
        setDismissedId(stored);
      }
    } catch {
      // Ignore
    }

    // Tick every minute to re-check scheduled windows
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Determine currently active scheduled campaign
  const activeCampaign = useMemo<SeasonalCampaign | null>(() => {
    const validCampaigns = SCHEDULED_CAMPAIGNS.filter((campaign) => {
      if (!campaign.isActive) return false;
      const start = new Date(campaign.startDate).getTime();
      const end = new Date(campaign.endDate).getTime();
      return now >= start && now <= end;
    });

    if (validCampaigns.length === 0) return null;

    // Highest priority first
    validCampaigns.sort((a, b) => b.priority - a.priority);
    return validCampaigns[0];
  }, [now]);

  const isDismissed = useMemo(() => {
    if (!activeCampaign) return false;
    return dismissedId === activeCampaign.id;
  }, [activeCampaign, dismissedId]);

  const dismissCampaign = useCallback(() => {
    if (activeCampaign) {
      setDismissedId(activeCampaign.id);
      try {
        sessionStorage.setItem(DISMISSED_CAMPAIGN_KEY, activeCampaign.id);
      } catch {
        // Ignore
      }
    }
  }, [activeCampaign]);

  return {
    activeCampaign: isDismissed ? null : activeCampaign,
    rawCampaign: activeCampaign,
    isDismissed,
    dismissCampaign,
    hasActiveCampaign: !!activeCampaign && !isDismissed,
  };
}
