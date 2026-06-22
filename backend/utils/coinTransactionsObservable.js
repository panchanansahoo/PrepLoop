/**
 * Enhanced Coin Transactions Utility
 * 
 * Extends the atomic coin transaction helper with:
 * - Structured logging for coin operations
 * - Request tracing via requestId
 * - Detailed error categorization
 * - Performance metrics
 */

import { createLogger } from './structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const logger = createLogger('coin-transactions');

/**
 * Apply coin transaction atomically with full observability
 * 
 * @param {Object} params
 * @param {string} params.userId - User UUID
 * @param {number} params.amount - Coin amount (must be > 0)
 * @param {string} params.type - 'earn' or 'spend'
 * @param {string} params.description - Transaction description
 * @param {string} params.referenceKey - Idempotency key (e.g., problem_solve:userId:problemId)
 * @param {string} params.requestId - Request ID for tracing
 * 
 * @returns {Promise<{handled: boolean, success: boolean, balance: number, error: string|null, applied: boolean}>}
 */
export const applyCoinTransaction = async ({
  userId,
  amount,
  type,
  description = '',
  referenceKey = null,
  requestId = 'unknown',
}) => {
  const operationStart = Date.now();

  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      logger.warn('Invalid userId in coin transaction', {
        requestId,
        userId,
        type,
        amount,
      });
      return {
        handled: true,
        success: false,
        balance: 0,
        error: 'Invalid user ID',
        applied: false,
      };
    }

    if (amount <= 0 || typeof amount !== 'number') {
      logger.warn('Invalid amount in coin transaction', {
        requestId,
        userId,
        amount,
        type,
      });
      return {
        handled: true,
        success: false,
        balance: 0,
        error: 'Amount must be greater than 0',
        applied: false,
      };
    }

    if (!['earn', 'spend'].includes(type)) {
      logger.warn('Invalid transaction type', {
        requestId,
        userId,
        type,
        amount,
      });
      return {
        handled: true,
        success: false,
        balance: 0,
        error: 'Invalid transaction type',
        applied: false,
      };
    }

    // Call atomic RPC function
    logger.debug('Calling coin_apply_transaction RPC', {
      requestId,
      userId,
      amount,
      type,
      hasReferenceKey: !!referenceKey,
    });

    const { data, error: rpcError } = await supabaseAdmin.rpc(
      'coin_apply_transaction',
      {
        user_id_input: userId,
        amount_input: amount,
        txn_type_input: type,
        description_input: description,
        reference_key_input: referenceKey,
      }
    );

    const operationDuration = Date.now() - operationStart;

    // Handle RPC execution error
    if (rpcError) {
      const isMissingFunction = rpcError.message?.includes('does not exist');

      if (isMissingFunction) {
        logger.warn('coin_apply_transaction RPC not found, falling back to client-side logic', {
          requestId,
          userId,
          type,
          amount,
          duration: operationDuration,
        });
        return {
          handled: false,
          success: null, // Indicate fallback needed
          balance: null,
          error: 'RPC not available',
          applied: false,
        };
      }

      logger.error(
        'RPC execution failed',
        {
          requestId,
          userId,
          type,
          amount,
          duration: operationDuration,
        },
        rpcError
      );
      return {
        handled: true,
        success: false,
        balance: 0,
        error: rpcError.message || 'Database error',
        applied: false,
      };
    }

    // Extract result from RPC response
    const result = data?.[0] || {};
    const { success, new_balance: newBalance, applied } = result;

    logger.info('Coin transaction completed', {
      requestId,
      userId,
      type,
      amount,
      applied,
      newBalance,
      duration: operationDuration,
    });

    return {
      handled: true,
      success,
      balance: newBalance || 0,
      error: null,
      applied: !!applied,
    };
  } catch (error) {
    const operationDuration = Date.now() - operationStart;

    logger.error(
      'Coin transaction error',
      {
        requestId,
        userId,
        type,
        amount,
        duration: operationDuration,
      },
      error
    );

    return {
      handled: true,
      success: false,
      balance: 0,
      error: error.message,
      applied: false,
    };
  }
};

export default applyCoinTransaction;
