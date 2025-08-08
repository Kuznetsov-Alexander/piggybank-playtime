-- Create a SECURITY DEFINER function to search profiles by name, returning limited columns
CREATE OR REPLACE FUNCTION public.search_profiles(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles AS p
  WHERE p.full_name ILIKE ('%' || search_query || '%')
  ORDER BY p.full_name
  LIMIT 20;
$$;

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;