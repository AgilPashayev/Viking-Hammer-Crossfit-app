# Storage buckets and example policies

- Bucket: avatars
  - Public or private: private by default
  - Allowed mime types: image/png, image/jpeg
  - Max size: 5MB

Example policy (restrict uploads):

-- allow authenticated users to upload their own avatar via Edge Function or signed URL
-- implement checks in Edge Function to validate mime and size before upload
