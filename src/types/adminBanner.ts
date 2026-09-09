export interface DbHeroBanner {
  id: string;
  title: string;
  title_bn: string;
  subtitle?: string | null;
  subtitle_bn?: string | null;
  description?: string | null;
  description_bn?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  target_url: string;
  cta_text: string;
  cta_text_bn: string;
  badge_text?: string | null;
  badge_text_bn?: string | null;
  badge_color?: string | null;
  bg_gradient: string;
  display_order: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminBannerInput {
  id?: string;
  title: string;
  title_bn: string;
  subtitle?: string;
  subtitle_bn?: string;
  description?: string;
  description_bn?: string;
  image_url: string;
  mobile_image_url?: string;
  target_url: string;
  cta_text: string;
  cta_text_bn: string;
  badge_text?: string;
  badge_text_bn?: string;
  badge_color?: string;
  bg_gradient: string;
  display_order: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface DbHomepageSection {
  id: string;
  section_key: string;
  title: string;
  title_bn: string;
  subtitle?: string | null;
  subtitle_bn?: string | null;
  display_order: number;
  is_active: boolean;
  config: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
