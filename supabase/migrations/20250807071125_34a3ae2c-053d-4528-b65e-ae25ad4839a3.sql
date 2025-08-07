-- Create function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(user_id uuid, amount_change numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.accounts 
  SET balance = balance + amount_change
  WHERE accounts.user_id = update_user_balance.user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_balance(uuid, numeric) TO authenticated;