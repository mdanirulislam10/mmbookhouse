import { supabase } from '@/lib/supabase/client';
import { HeroBanner } from '@/types/banner';
import { DEFAULT_HERO_BANNERS } from '@/lib/data/heroBanners';
import { DbHeroBanner, AdminBannerInput, DbHomepageSection } from '@/types/adminBanner';

// Helper to map Supabase database record to frontend HeroBanner interface
export const mapDbBannerToHeroBanner = (db: DbHeroBanner): HeroBanner => ({
  id: db.id,
  title: db.title,
  titleBn: db.title_bn,
  subtitle: db.subtitle || '',
  subtitleBn: db.subtitle_bn || '',
  description: db.description || undefined,
  descriptionBn: db.description_bn || undefined,
  imageUrl: db.image_url,
  mobileImageUrl: db.mobile_image_url || undefined,
  targetUrl: db.target_url,
  ctaText: db.cta_text,
  ctaTextBn: db.cta_text_bn,
  badgeText: db.badge_text || undefined,
  badgeTextBn: db.badge_text_bn || undefined,
  badgeColor: db.badge_color || undefined,
  bgGradient: db.bg_gradient,
  priority: db.display_order === 1,
});

/**
 * Task 17: Banner & Homepage Section Admin Data Service
 * Provides full dynamic CMS capabilities with zero-downtime offline fallback
 */
export const bannerService = {
  /**
   * Fetches active banners for the homepage hero carousel
   * Automatically falls back to offline curated dataset if Supabase connection fails
   */
  async getActiveBanners(): Promise<HeroBanner[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        // Safe graceful fallback to local data
        return DEFAULT_HERO_BANNERS;
      }

      return (data as DbHeroBanner[]).map(mapDbBannerToHeroBanner);
    } catch (err) {
      console.warn('Supabase banner fetch failed, using local fallback:', err);
      return DEFAULT_HERO_BANNERS;
    }
  },

  /**
   * Fetches all banners for the seller/admin management dashboard
   */
  async getAllBanners(): Promise<DbHeroBanner[]> {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data as DbHeroBanner[];
    } catch (err) {
      console.error('Failed to fetch all banners:', err);
      return [];
    }
  },

  /**
   * Creates or updates a hero banner from the admin interface
   */
  async upsertBanner(input: AdminBannerInput): Promise<{ success: boolean; data?: DbHeroBanner; error?: string }> {
    try {
      const payload: Partial<DbHeroBanner> = {
        title: input.title,
        title_bn: input.title_bn,
        subtitle: input.subtitle || null,
        subtitle_bn: input.subtitle_bn || null,
        description: input.description || null,
        description_bn: input.description_bn || null,
        image_url: input.image_url,
        mobile_image_url: input.mobile_image_url || null,
        target_url: input.target_url,
        cta_text: input.cta_text,
        cta_text_bn: input.cta_text_bn,
        badge_text: input.badge_text || null,
        badge_text_bn: input.badge_text_bn || null,
        badge_color: input.badge_color || 'bg-amber-400 text-gray-950',
        bg_gradient: input.bg_gradient,
        display_order: input.display_order,
        is_active: input.is_active,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
      };

      if (input.id) {
        payload.id = input.id;
      }

      const { data, error } = await supabase
        .from('hero_banners')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as DbHeroBanner };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unknown error during banner upsert' };
    }
  },

  /**
   * Updates display order of a banner
   */
  async updateBannerOrder(bannerId: string, displayOrder: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update({ display_order: displayOrder })
        .eq('id', bannerId);

      return !error;
    } catch (err) {
      console.error('Failed to update banner order:', err);
      return false;
    }
  },

  /**
   * Toggles active status of a banner
   */
  async toggleBannerStatus(bannerId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update({ is_active: isActive })
        .eq('id', bannerId);

      return !error;
    } catch (err) {
      console.error('Failed to toggle banner status:', err);
      return false;
    }
  },

  /**
   * Deletes a banner by ID
   */
  async deleteBanner(bannerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', bannerId);

      return !error;
    } catch (err) {
      console.error('Failed to delete banner:', err);
      return false;
    }
  },

  /**
   * Fetches homepage sections configuration
   */
  async getHomepageSections(): Promise<DbHomepageSection[]> {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data as DbHomepageSection[];
    } catch (err) {
      console.warn('Failed to fetch homepage sections:', err);
      return [];
    }
  },
};
