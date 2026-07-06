/**
 * Webhook route — receives GitHub webhook POST requests.
 *
 * The @octokit/webhooks library handles HMAC-SHA256 signature verification
 * automatically, rejecting requests with invalid signatures.
 */

import { Router, Request, Response } from "express";
import { webhooks } from "../github/webhookHandler.js";

export const webhookRouter = Router();

webhookRouter.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const event = req.headers["x-github-event"] as string | undefined;
    const deliveryId = req.headers["x-github-delivery"] as string | undefined;

    if (!signature || !event) {
      res.status(400).json({ error: "Missing required webhook headers" });
      return;
    }

    try {
      // Verify signature and dispatch event handlers
      await webhooks.verifyAndReceive({
        id: deliveryId ?? "unknown",
        name: event as Parameters<typeof webhooks.verifyAndReceive>[0]["name"],
        signature,
        payload: req.body as string,
      });

      res.status(200).json({ ok: true, delivery: deliveryId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook processing failed";
      console.error("Webhook error:", message);
      // 200 for signature failures to prevent GitHub retries on invalid events
      res.status(200).json({ ok: false, error: message });
    }
  }
);
