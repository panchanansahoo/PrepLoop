import { supabaseAdmin } from '../db/supabaseClient.js';

const PAGE_SIZE = 1000;

const toSignedAmount = (row) => {
  const amount = Number(row?.amount || 0);
  if (!Number.isFinite(amount)) return 0;
  if (row?.type === 'earn') return amount;
  if (row?.type === 'spend') return -amount;
  return 0;
};

async function fetchAllCoinTransactions() {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabaseAdmin
      .from('coin_transactions')
      .select('user_id, amount, type')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function main() {
  try {
    console.log('Reconciling profile coin balances from coin_transactions ledger via Supabase Admin API...');

    const rows = await fetchAllCoinTransactions();
    console.log(`Fetched ${rows.length} ledger rows.`);

    const balanceByUser = new Map();
    for (const row of rows) {
      const userId = row?.user_id;
      if (!userId) continue;

      const next = (balanceByUser.get(userId) || 0) + toSignedAmount(row);
      balanceByUser.set(userId, Math.max(0, next));
    }

    let updated = 0;
    for (const [userId, balance] of balanceByUser.entries()) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ coins: balance })
        .eq('id', userId);

      if (error) {
        console.error(`Failed updating profile ${userId}:`, error.message || error);
        continue;
      }
      updated += 1;
    }

    console.log(`Reconciliation completed. Updated ${updated} profile balances.`);
  } catch (error) {
    console.error('Coin reconciliation failed:', error?.message || error);
    process.exitCode = 1;
  }
}

main();
