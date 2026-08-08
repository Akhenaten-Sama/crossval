export default function Totals({ totals }: { totals: { subtotal: string; discount: string; tax: string; grandTotal: string } }) {
  return (
    <div className="totals">
      <Total label="Subtotal" value={totals.subtotal} />
      <Total label="Discount" value={totals.discount} />
      <Total label="Tax" value={totals.tax} />
      <Total label="Grand total" value={totals.grandTotal} strong />
    </div>
  );
}

export function Total({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="total-box">
      <span>{label}</span>
      <strong className={strong ? "total-strong" : undefined}>{value}</strong>
    </div>
  );
}
