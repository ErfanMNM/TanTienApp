async function test() {
  const res = await fetch('https://erp.mte.vn/api/method/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ usr: 'test', pwd: 'test' }),
  });
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log('Body:', text.substring(0, 200));
}

void test();
