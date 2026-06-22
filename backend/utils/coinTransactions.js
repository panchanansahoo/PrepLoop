import { supabaseAdmin } from '../db/supabaseClient.js';

const isMissingAtomicCoinFunction = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === 'PGRST202' || message.includes('coin_apply_transaction');
};

export const applyCoinTransaction = async ({ userId, amount, type, description, referenceKey = null }) => {
  const { data, error } = await supabaseAdmin.rpc('coin_apply_transaction', {
    user_id_input: userId,
    amount_input: amount,
    txn_type_input: type,
    description_input: description,
    reference_key_input: referenceKey,
  });

  if (error) {
    if (isMissingAtomicCoinFunction(error)) {
      return { handled: false };
    }
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    handled: true,
    success: Boolean(result?.success),
    balance: Number(result?.new_balance || 0),
    error: result?.error || null,
    applied: result?.applied !== false,
  };
};
