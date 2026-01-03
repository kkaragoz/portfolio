export async function ExecFifo() {
  const res = await fetch('/api/fifo', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'FIFO işlemi başarısız');
  }
}
