-- Secure profile search function
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

GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;

-- Secure server-side transfer function to avoid RLS violations on direct inserts/updates
CREATE OR REPLACE FUNCTION public.transfer_funds(
  to_user uuid,
  amount numeric,
  description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  sender uuid := auth.uid();
  sender_balance numeric;
BEGIN
  IF sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF to_user IS NULL THEN
    RAISE EXCEPTION 'Recipient is required';
  END IF;
  IF to_user = sender THEN
    RAISE EXCEPTION 'Cannot transfer to self';
  END IF;

  -- Lock both accounts to prevent race conditions
  PERFORM 1 FROM public.accounts a WHERE a.user_id = sender FOR UPDATE;
  PERFORM 1 FROM public.accounts a WHERE a.user_id = to_user FOR UPDATE;

  SELECT balance INTO sender_balance FROM public.accounts WHERE user_id = sender;
  IF sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender account not found';
  END IF;
  IF sender_balance < amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Update balances
  UPDATE public.accounts SET balance = balance - amount WHERE user_id = sender;
  UPDATE public.accounts SET balance = balance + amount WHERE user_id = to_user;

  -- Record transaction
  INSERT INTO public.transactions(type, amount, from_user_id, to_user_id, description)
  VALUES ('transfer', amount, sender, to_user, COALESCE(description, 'Перевод'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_funds(uuid, numeric, text) TO authenticated;