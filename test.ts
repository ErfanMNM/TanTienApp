async function test() {
  const res = await fetch('http://localhost:3000/api/method/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ usr: 'test', pwd: 'test' })
  });
  console.log('Status', res.status);
  const body = await res.text();
  console.log('Body', body);
}

test();
