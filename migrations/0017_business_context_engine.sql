CREATE TABLE IF NOT EXISTS business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  website_url text NOT NULL,
  business_name text,
  industry text,
  target_audience text,
  main_offer text,
  products_or_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  pain_points_solved jsonb NOT NULL DEFAULT '[]'::jsonb,
  brand_tone text,
  content_angles jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_ideas jsonb NOT NULL DEFAULT '[]'::jsonb,
  one_line_summary text,
  long_summary text,
  raw_extracted_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON business_profiles(user_id);

CREATE TABLE IF NOT EXISTS promo_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  campaign_title text,
  positioning_angle text,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS promo_packs_business_profile_id_idx ON promo_packs(business_profile_id);
