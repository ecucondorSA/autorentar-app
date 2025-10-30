-- ============================================
-- WALLET ATOMIC OPERATIONS
-- Prevents race conditions in money operations
-- ============================================

-- 1) Hold funds atomically
CREATE OR REPLACE FUNCTION wallet_hold_funds(
  p_user_id uuid,
  p_amount numeric,
  p_reference_type text,
  p_reference_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet record;
  v_tx_id uuid;
BEGIN
  -- Lock wallet row (prevents concurrent modifications)
  SELECT * INTO v_wallet
  FROM user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Validate wallet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- Check available balance
  IF v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds: % available, % required',
      v_wallet.available_balance, p_amount
      USING ERRCODE = '53000'; -- insufficient_resources
  END IF;

  -- Update balances atomically
  UPDATE user_wallets
  SET
    available_balance = available_balance - p_amount,
    locked_balance = locked_balance + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id, amount, type, status,
    reference_type, reference_id,
    description, currency, is_withdrawable
  ) VALUES (
    p_user_id, -p_amount, 'hold', 'completed',
    p_reference_type, p_reference_id,
    'Funds held for ' || p_reference_type,
    v_wallet.currency, false
  )
  RETURNING id INTO v_tx_id;

  -- Apply to ledger (if function exists)
  BEGIN
    PERFORM apply_ledger_entry(
      p_user_id,
      -p_amount,
      'rental_charge',
      p_reference_type,
      p_reference_id
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- Ledger function doesn't exist yet, skip
      NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'available_balance', v_wallet.available_balance - p_amount,
    'locked_balance', v_wallet.locked_balance + p_amount
  );
END;
$$;

-- 2) Capture held funds and transfer
CREATE OR REPLACE FUNCTION wallet_capture_hold(
  p_user_id uuid,
  p_amount numeric,
  p_reference_id uuid,
  p_recipient_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payer_wallet record;
  v_recipient_wallet record;
  v_tx_id uuid;
BEGIN
  -- Lock both wallets (ordered by user_id to prevent deadlocks)
  IF p_user_id < p_recipient_id THEN
    SELECT * INTO v_payer_wallet FROM user_wallets WHERE user_id = p_user_id FOR UPDATE;
    SELECT * INTO v_recipient_wallet FROM user_wallets WHERE user_id = p_recipient_id FOR UPDATE;
  ELSE
    SELECT * INTO v_recipient_wallet FROM user_wallets WHERE user_id = p_recipient_id FOR UPDATE;
    SELECT * INTO v_payer_wallet FROM user_wallets WHERE user_id = p_user_id FOR UPDATE;
  END IF;

  -- Validate wallets exist
  IF v_payer_wallet IS NULL THEN
    RAISE EXCEPTION 'Payer wallet not found';
  END IF;

  IF v_recipient_wallet IS NULL THEN
    RAISE EXCEPTION 'Recipient wallet not found';
  END IF;

  -- Validate locked balance
  IF v_payer_wallet.locked_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient locked funds: % locked, % required',
      v_payer_wallet.locked_balance, p_amount
      USING ERRCODE = '53000';
  END IF;

  -- Update payer wallet (reduce locked)
  UPDATE user_wallets
  SET
    locked_balance = locked_balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Credit recipient (increase available)
  UPDATE user_wallets
  SET
    available_balance = available_balance + p_amount,
    updated_at = now()
  WHERE user_id = p_recipient_id;

  -- Create transaction for payer
  INSERT INTO wallet_transactions (
    user_id, amount, type, status,
    reference_type, reference_id,
    description, currency, is_withdrawable
  ) VALUES (
    p_user_id, -p_amount, 'capture', 'completed',
    'booking', p_reference_id,
    'Payment captured and transferred',
    v_payer_wallet.currency, false
  )
  RETURNING id INTO v_tx_id;

  -- Create transaction for recipient
  INSERT INTO wallet_transactions (
    user_id, amount, type, status,
    reference_type, reference_id,
    description, currency, is_withdrawable
  ) VALUES (
    p_recipient_id, p_amount, 'credit', 'completed',
    'booking', p_reference_id,
    'Payment received',
    v_recipient_wallet.currency, true
  );

  -- Apply to ledger (if function exists)
  BEGIN
    PERFORM apply_ledger_entry(
      p_recipient_id,
      p_amount,
      'rental_payment',
      'booking',
      p_reference_id
    );
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'payer_locked', v_payer_wallet.locked_balance - p_amount,
    'recipient_available', v_recipient_wallet.available_balance + p_amount
  );
END;
$$;

-- 3) Release hold (refund)
CREATE OR REPLACE FUNCTION wallet_release_hold(
  p_user_id uuid,
  p_amount numeric,
  p_reference_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet record;
  v_tx_id uuid;
BEGIN
  -- Lock wallet
  SELECT * INTO v_wallet
  FROM user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Validate wallet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- Validate locked balance
  IF v_wallet.locked_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient locked funds: % locked, % required',
      v_wallet.locked_balance, p_amount
      USING ERRCODE = '53000';
  END IF;

  -- Release funds (locked → available)
  UPDATE user_wallets
  SET
    available_balance = available_balance + p_amount,
    locked_balance = locked_balance - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id, amount, type, status,
    reference_type, reference_id,
    description, currency, is_withdrawable
  ) VALUES (
    p_user_id, p_amount, 'release', 'completed',
    'booking', p_reference_id,
    'Hold released (refund)',
    v_wallet.currency, false
  )
  RETURNING id INTO v_tx_id;

  -- Apply to ledger (if function exists)
  BEGIN
    PERFORM apply_ledger_entry(
      p_user_id,
      p_amount,
      'refund',
      'booking',
      p_reference_id
    );
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'available_balance', v_wallet.available_balance + p_amount,
    'locked_balance', v_wallet.locked_balance - p_amount
  );
END;
$$;

-- Grants (adjust based on your RLS setup)
GRANT EXECUTE ON FUNCTION wallet_hold_funds TO authenticated;
GRANT EXECUTE ON FUNCTION wallet_capture_hold TO authenticated;
GRANT EXECUTE ON FUNCTION wallet_release_hold TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference
  ON wallet_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_status
  ON wallet_transactions(user_id, status);

-- Comments
COMMENT ON FUNCTION wallet_hold_funds IS 'Atomically holds funds in user wallet. Prevents race conditions via row-level locks.';
COMMENT ON FUNCTION wallet_capture_hold IS 'Captures held funds and transfers to recipient. Uses ordered locking to prevent deadlocks.';
COMMENT ON FUNCTION wallet_release_hold IS 'Releases held funds back to available balance (refund).';
