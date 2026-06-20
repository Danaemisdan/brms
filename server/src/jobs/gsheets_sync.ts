import cron from 'node-cron';
import { pullUpdatesFromSheet } from '../services/googleSheets.service';

let isSyncing = false;

export function startGoogleSheetsSyncJob() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        if (isSyncing) {
            console.log('[Google Sheets Sync] Skip: Sync already in progress.');
            return;
        }

        try {
            isSyncing = true;
            await pullUpdatesFromSheet();
        } catch (error) {
            console.error('[Google Sheets Sync] Job Failed:', error);
        } finally {
            isSyncing = false;
        }
    });

    console.log('[Google Sheets Sync] Scheduled job initialized (runs every 5m).');
}
