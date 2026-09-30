import { pullUpdatesFromSheet } from './lib/services/googleSheets.service';

async function main() {
    try {
        console.log("Starting local test of pullUpdatesFromSheet...");
        await pullUpdatesFromSheet();
        console.log("Local test finished successfully.");
    } catch (e) {
        console.error("Local test failed with error:", e);
    }
}

main().catch(console.error);
