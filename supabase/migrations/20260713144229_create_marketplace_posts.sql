/*
# Create marketplace_posts table

## Summary
Adds the marketplace_posts table to support a peer-to-peer business connections board on the
/marketplace page. Authenticated users can post funding requests, partnership offers, hiring ads,
or general business connection requests. All active posts are publicly readable (anon + authenticated).
Expired posts are hidden from public feeds but remain visible to their owner so they can renew them.

## New Table: marketplace_posts
- id           (uuid, PK, auto-generated)
- user_id      (uuid, FK → auth.users, NOT NULL, DEFAULT auth.uid() — set by DB so the RLS insert check passes)
- user_email   (text, NOT NULL — denormalized from the poster's account at insert time, exposed to responders)
- type         (text, NOT NULL — one of: funding | partnership | hiring | general)
- title        (text, NOT NULL)
- description  (text, NOT NULL)
- created_at   (timestamptz, DEFAULT now())
- expires_at   (timestamptz, DEFAULT now() + 7 days)

## Security — RLS Policies (4 separate, one per verb)
1. SELECT (anon + authenticated): active posts visible to all (expires_at > now())
   OR the post belongs to the current user (owner sees all their posts incl. expired)
2. INSERT (authenticated only): WITH CHECK ensures user_id = auth.uid()
3. UPDATE (authenticated only): owner can only update their own rows
4. DELETE (authenticated only): owner can only delete their own rows

## Notes
- user_email is denormalized intentionally — it lets the "Respond" button surface the poster's
  contact without requiring a privileged join to auth.users.
- expires_at defaults to 7 days from creation; Renew sets it to now() + 7 days.
- type is constrained to the four allowed values via a CHECK constraint.
*/

CREATE TABLE IF NOT EXISTS marketplace_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email  text NOT NULL,
  type        text NOT NULL CHECK (type IN ('funding', 'partnership', 'hiring', 'general')),
  title       text NOT NULL,
  description text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE marketplace_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS marketplace_posts_user_id_idx   ON marketplace_posts (user_id);
CREATE INDEX IF NOT EXISTS marketplace_posts_expires_at_idx ON marketplace_posts (expires_at);
CREATE INDEX IF NOT EXISTS marketplace_posts_type_idx       ON marketplace_posts (type);

-- SELECT: active posts are public; owners always see their own posts (including expired)
DROP POLICY IF EXISTS "select_marketplace_posts" ON marketplace_posts;
CREATE POLICY "select_marketplace_posts" ON marketplace_posts FOR SELECT
  TO anon, authenticated
  USING (
    expires_at > now()
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- INSERT: only authenticated users, owner = session user
DROP POLICY IF EXISTS "insert_marketplace_posts" ON marketplace_posts;
CREATE POLICY "insert_marketplace_posts" ON marketplace_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: owner only
DROP POLICY IF EXISTS "update_marketplace_posts" ON marketplace_posts;
CREATE POLICY "update_marketplace_posts" ON marketplace_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: owner only
DROP POLICY IF EXISTS "delete_marketplace_posts" ON marketplace_posts;
CREATE POLICY "delete_marketplace_posts" ON marketplace_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
