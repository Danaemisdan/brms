import sys
import traceback
from src.tools.playwright_whatsapp import send_whatsapp_message_playwright

print("starting script")
try:
    res = send_whatsapp_message_playwright("shruti", "Test injection", "/Users/sanjeevn/Downloads/review process/brms/server/uploads/products/1772648222493-303987915.png")
    print("RESULT:", res)
except Exception as e:
    print("FATAL ERROR", e)
    traceback.print_exc()
