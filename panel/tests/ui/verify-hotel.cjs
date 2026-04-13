(async () => {
  try {
    const id = process.argv[2] || '98938475';
    const url = `https://hotelroomsstay.com/api/hotels/get-by-id/${id}`;
    console.log('GET', url);
    const resp = await fetch(url);
    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log('Body:', text.slice(0,4000));
    process.exit(resp.ok ? 0 : 2);
  } catch (e) {
    console.error('Error:', e);
    process.exit(2);
  }
})();
