import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { db } from "@/db";
import { checkpoints } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Custom Checkpointer implementation using Neon Postgres
 * Stores conversation state snapshots in the database for event-based memory
 */
export class NeonCheckpointer extends BaseCheckpointSaver {
  private chatId: string;

  constructor(chatId: string) {
    super();
    this.chatId = chatId;
  }

  /**
   * Save a checkpoint to the database
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointId = checkpoint.id;
    const messageCount = (checkpoint.channel_values?.messages as unknown[])?.length || 0;

    console.log(`[Checkpointer] Saving checkpoint: ${checkpointId} for thread ${threadId}`);

    try {
      await db.insert(checkpoints).values({
        chatId: this.chatId,
        threadId,
        checkpointId,
        state: checkpoint as any,
        metadata: metadata as any,
        messageCount,
      });

      console.log(`[Checkpointer] ✓ Checkpoint saved successfully: ${checkpointId}`);

      return {
        configurable: {
          thread_id: threadId,
          checkpoint_id: checkpointId,
        },
      };
    } catch (error) {
      console.error("[Checkpointer] ✗ Error saving checkpoint:", error);
      throw error;
    }
  }

  /**
   * Get a checkpoint tuple from the database
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointId = config.configurable?.checkpoint_id as string;

    try {
      let query;

      if (checkpointId) {
        // Get specific checkpoint
        query = db
          .select()
          .from(checkpoints)
          .where(
            and(
              eq(checkpoints.chatId, this.chatId),
              eq(checkpoints.threadId, threadId),
              eq(checkpoints.checkpointId, checkpointId)
            )
          )
          .limit(1);
      } else {
        // Get latest checkpoint for thread
        query = db
          .select()
          .from(checkpoints)
          .where(
            and(
              eq(checkpoints.chatId, this.chatId),
              eq(checkpoints.threadId, threadId)
            )
          )
          .orderBy(desc(checkpoints.createdAt))
          .limit(1);
      }

      const [result] = await query;

      if (!result) {
        return undefined;
      }

      return {
        config: {
          configurable: {
            thread_id: result.threadId,
            checkpoint_id: result.checkpointId,
          },
        },
        checkpoint: result.state as Checkpoint,
        metadata: result.metadata as CheckpointMetadata,
        parentConfig: undefined,
        pendingWrites: undefined,
      };
    } catch (error) {
      console.error("[Checkpointer] Error getting checkpoint:", error);
      return undefined;
    }
  }

  /**
   * List all checkpoints for a thread
   */
  async *list(
    config: RunnableConfig,
    options?: { limit?: number; before?: RunnableConfig }
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id as string;

    try {
      const results = await db
        .select()
        .from(checkpoints)
        .where(
          and(
            eq(checkpoints.chatId, this.chatId),
            eq(checkpoints.threadId, threadId)
          )
        )
        .orderBy(desc(checkpoints.createdAt))
        .limit(options?.limit || 100);

      for (const result of results) {
        yield {
          config: {
            configurable: {
              thread_id: result.threadId,
              checkpoint_id: result.checkpointId,
            },
          },
          checkpoint: result.state as Checkpoint,
          metadata: result.metadata as CheckpointMetadata,
          parentConfig: undefined,
          pendingWrites: undefined,
        };
      }
    } catch (error) {
      console.error("[Checkpointer] Error listing checkpoints:", error);
    }
  }

  /**
   * Put checkpoint writes (for atomic operations)
   * This is called during graph execution to save incremental state updates.
   * For basic checkpoint functionality, we rely on the main `put` method.
   */
  async putWrites(
    config: RunnableConfig,
    writes: [string, unknown][],
    taskId: string
  ): Promise<void> {
    // Incremental writes are handled by LangGraph's internal state management
    // The final checkpoint is saved via the `put` method
    // This is a no-op for basic checkpointing
  }

  /**
   * Delete all checkpoints for a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    try {
      await db.delete(checkpoints).where(eq(checkpoints.threadId, threadId));
      console.log(`[Checkpointer] Deleted thread: ${threadId}`);
    } catch (error) {
      console.error("[Checkpointer] Error deleting thread:", error);
      throw error;
    }
  }
}
