export type DocumentStatus = "draft" | "finalized";

export type Discount =
  | { type: "percent"; value: number }
  | { type: "fixed"; amountCents: number }
  | null;

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount: Discount;
  taxPercent: number | null;
};

export type LineItem = LineItemInput & {
  id: string;
  documentId: string;
};

export type DocumentRecord = {
  id: string;
  userId: string;
  title: string;
  description: string;
  customer: string;
  issueDate: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  lineItems: LineItem[];
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type LineTotals = {
  subtotalCents: number;
  discountCents: number;
  afterDiscountCents: number;
  taxCents: number;
  totalCents: number;
};

export type DocumentTotals = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
  lines: Array<LineItem & { totals: LineTotals }>;
};

export type AppDb = {
  users: UserRecord[];
  documents: DocumentRecord[];
};
