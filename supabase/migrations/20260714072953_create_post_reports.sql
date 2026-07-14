/*
# Create post_reports table

## Summary
Adds a post_reports table to support a passive flag/report system on marketplace posts.
Users can report posts they find inappropriate. Reports are for manual review only —
they do not remove or hide posts automatically, and no report data is displayed in the app.
Reports are only visible via the Supabase dashboard.

## New Table: post_reports
- id           (uuid, PK, auto-generated)
- post_id       (uuid, FK → marketplace_posts.id ON DELETE CASCADE — reports auto-deleted when the post is deleted)
- reporter_id   (uuid, FK → auth.users.id ON DELETE CASCADE)
- created_at    (timestamptz, DEFAULT now())

## Security — RLS Policies
1. INSERT (authenticated only): any authenticated user can report a post; WITH CHECK ensures reporter_id = auth.uid()
2. SELECT/UPDATE/DELETE: no policies — reports are NOT readable, updatable, or deletable from the client.
   Only the Supabase dashboard (service role, bypasses RLS) can view them.

## Notes
- One report per user per post is NOT enforced at the DB level to keep this simple —
  the frontend will track reported post IDs in local state to prevent duplicate submissions in a session.
- reporter_id defaults to auth.uid() so the client insert can omit it.
*/

CREATE TABLE IF NOT EXISTS post_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES marketplace_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS post_reports_post_id_idx ON post_reports (post_id);

-- INSERT: authenticated users can report; reporter must be the session user
DROP POLICY IF EXISTS "insert_post_reports" ON post_reports;
CREATE POLICY "insert_post_reports" ON post_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
