Supabase avatar bucket setup

This project expects a Supabase Storage bucket named `avatars` used to store user profile images. Follow these steps to create and configure it:

1. Install Supabase CLI and authenticate:

   ```bash
   npm i -g supabase
   supabase login
   ```

2. Create the bucket (public if you want direct image URLs):

   ```bash
   supabase storage bucket create avatars --public
   ```

3. If you prefer signed URLs, keep the bucket private and generate signed URLs server-side with `supabase.storage.from('avatars').createSignedUrl(path, expiresInSec)`.

4. Ensure your `SUPABASE_SERVICE_ROLE_KEY` has storage permissions when running server-side uploads.

5. Optionally add a lifecycle policy or size limits to avoid uncontrolled storage growth.

If you cannot run the CLI, create the bucket using the Supabase web console: Storage → New bucket → Name: `avatars` → Public: On/Off as desired.
