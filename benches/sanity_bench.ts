// Minimal benchmark to validate bench task
Deno.bench({ name: 'string concatenation', baseline: true }, () => {
  let s = '';
  for (let i = 0; i < 1000; i++) s += 'a';
});

Deno.bench({ name: 'array join' }, () => {
  const arr = new Array(1000).fill('a');
  const s = arr.join('');
  if (s.length !== 1000) throw new Error('unexpected');
});
