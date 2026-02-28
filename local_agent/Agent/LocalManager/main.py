import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
import threading
from src.bot import build_app
from src.jobs.brms_poller import start_polling_loop
from src.jobs.brms_campaign_poller import start_campaign_polling_loop
from src.jobs.brms_review_verifier import start_verification_polling_loop

def main():
    logging.info("Starting Local Manager Agent...")
    try:
        app = build_app()
        
        # Start BRMS automatic refund polling in background
        refund_poller_thread = threading.Thread(target=start_polling_loop, daemon=True)
        refund_poller_thread.start()
        
        # Start WhatsApp Campaign poller in background
        campaign_poller_thread = threading.Thread(target=start_campaign_polling_loop, daemon=True)
        campaign_poller_thread.start()

        # Start Amazon Verification poller in background
        verification_thread = threading.Thread(target=start_verification_polling_loop, daemon=True)
        verification_thread.start()
        
        logging.info("Bot is polling...")
        app.run_polling()
    except Exception as e:
        logging.error(f"Failed to start bot: {e}")

if __name__ == '__main__':
    main()
