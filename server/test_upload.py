import requests

url = "http://localhost:5001/api/upload/products"
files = [('images', ('test.txt', b'hello world', 'text/plain'))]
response = requests.post(url, files=files)
print(response.status_code)
print(response.text)
