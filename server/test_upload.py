import urllib.request
import json
import sqlite3

# Get admin token using the API
data = json.dumps({"identifier":"9999999999","password":"password123"}).encode("utf-8")
req = urllib.request.Request("http://localhost:5001/api/auth/login", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as response:
    res = json.loads(response.read().decode())
    token = res.get("token")

print("User Token:", token)

# Now test upload (using multipart/form-data)
import uuid
boundary = uuid.uuid4().hex

# We are going to upload dummy.png
with open("dummy.png", "wb") as f:
    f.write(b"fake image")

body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="images"; filename="dummy.png"\r\n'
    f"Content-Type: image/png\r\n\r\n"
    f"fake image\r\n"
    f"--{boundary}--\r\n"
).encode('utf-8')

req2 = urllib.request.Request("http://localhost:5001/api/upload/products", data=body, headers={
    "Content-Type": f"multipart/form-data; boundary={boundary}",
    "Authorization": f"Bearer {token}"
})

try:
    with urllib.request.urlopen(req2) as resp:
        print("Upload Status:", resp.getcode())
        print(resp.read().decode())
except urllib.error.HTTPError as e:
    print("Upload Failed:", e.code)
    print(e.read().decode())
