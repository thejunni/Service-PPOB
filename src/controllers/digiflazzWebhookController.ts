import { Request, Response } from "express";
import { handleDigiflazzWebhook } from "../services/digiFlazzService";

export async function digiflazzWebhook(req: Request, res: Response) {
  try {
    await handleDigiflazzWebhook(req.body);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
}
