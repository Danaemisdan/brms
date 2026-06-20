import { Request, Response } from "express";
import { pullUpdatesFromSheet } from "../../services/googleSheets.service";

export class AdminController {
    static async forceSyncGoogleSheets(req: Request, res: Response): Promise<void> {
        try {
            await pullUpdatesFromSheet();
            res.json({ success: true, message: "Successfully synced with Google Sheets." });
        } catch (error) {
            console.error("Force sync failed:", error);
            res.status(500).json({ success: false, message: "Failed to sync with Google Sheets." });
        }
    }
}
