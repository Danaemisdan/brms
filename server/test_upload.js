const fs = require('fs');
async function test() {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('images', Buffer.from('hello'), { filename: 'test.txt', contentType: 'text/plain' });
  const res = await fetch('http://localhost:5001/api/upload/products', {
    method: 'POST',
    body: form,
//  headers: we need auth token but wait, upload route has authMiddleware! So it returns 401. 
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
