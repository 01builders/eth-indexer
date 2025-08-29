import { ponder } from "ponder:registry";
import schema from "ponder:schema";

// Index all blocks and their transactions
ponder.on("AllTransactions:block", async ({ event, context }) => {
  const { block } = event;

  // First, insert the block data
  try {
    await context.db
      .insert(schema.blocks)
      .values({
        hash: block.hash,
        number: block.number,
        timestamp: block.timestamp,
        parentHash: block.parentHash,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        transactionCount: 0, // Will be calculated from actual transactions
      })
      .onConflictDoNothing();
  } catch (blockError) {
    console.error(`Failed to insert block ${block.number}:`, blockError instanceof Error ? blockError.message : String(blockError));
    return; // Skip processing transactions if block insertion fails
  }

  // Fetch the full block with transactions using the client
  const fullBlock = await context.client.getBlock({
    blockHash: block.hash,
    includeTransactions: true,
  });

  let transactionCount = 0;

  // Index all transactions in this block
  if (fullBlock.transactions && Array.isArray(fullBlock.transactions)) {
    for (const transaction of fullBlock.transactions) {
      // Skip if transaction is just a hash (shouldn't happen with includeTransactions: true)
      if (typeof transaction === 'string') continue;

      // Validate transaction object has required properties
      if (!transaction || !transaction.hash) {
        console.warn(`Skipping invalid transaction in block ${block.number}`);
        continue;
      }

      transactionCount++;

      // Get transaction receipt for gas used and status
      let gasUsed = 0n;
      let status = 1;
      try {
        const receipt = await context.client.getTransactionReceipt({
          hash: transaction.hash,
        });
        gasUsed = receipt.gasUsed || 0n;
        status = receipt.status === 'success' ? 1 : 0;
      } catch (error) {
        console.warn(`Could not get receipt for transaction ${transaction.hash}:`, error instanceof Error ? error.message : String(error));
      }

      try {
        await context.db
          .insert(schema.transactions)
          .values({
            hash: transaction.hash,
            blockNumber: block.number,
            blockHash: block.hash,
            transactionIndex: transaction.transactionIndex || 0,
            from: transaction.from,
            to: transaction.to || null,
            value: transaction.value || 0n,
            gasPrice: transaction.gasPrice || 0n,
            gasUsed: gasUsed,
            gasLimit: transaction.gas || 0n,
            input: transaction.input || '0x',
            nonce: transaction.nonce || 0,
            timestamp: block.timestamp,
            status: status,
          })
          .onConflictDoNothing();
      } catch (dbError) {
        console.error(`Failed to insert transaction ${transaction.hash}:`, dbError instanceof Error ? dbError.message : String(dbError));
      }
    }
  }

  // Update block with actual transaction count
  try {
    await context.db
      .update(schema.blocks, { hash: block.hash })
      .set({ transactionCount });
  } catch (updateError) {
    console.error(`Failed to update transaction count for block ${block.number}:`, updateError instanceof Error ? updateError.message : String(updateError));
  }

  console.log(`Indexed block ${block.number} with ${transactionCount} transactions`);
});
