export type FieldType = "signature" | "initials" | "date" | "text" | "checkbox";
export type Field = {
  id: string; recipientId: string; type: FieldType; page: number; // 0-based
  x: number; y: number; w: number; h: number; // fractions of page width/height, origin top-left
  required: boolean; label?: string;
};
export type Recipient = { id: string; name: string; email: string; order: number; token: string; status: "pending" | "signed"; signedAt?: number };
export type EnvStatus = "draft" | "sent" | "completed" | "voided";
export type EnvEvent = { at: number; who: string; what: string };
export type Envelope = {
  id: string; ownerId: string; title: string; status: EnvStatus; createdAt: number; updatedAt: number;
  pages: { w: number; h: number }[]; recipients: Recipient[]; fields: Field[]; events: EnvEvent[];
  /** Sequential routing: recipient n+1 can only sign after recipient n. */
  sequential: boolean; message: string; voidReason?: string; folderId?: string;
};
/** What a signer is allowed to see (never other recipients' tokens). */
export type SignerView = {
  title: string; status: EnvStatus; me: { id: string; name: string; email: string; status: Recipient["status"] }; myTurn: boolean; waitingFor?: string;
  pages: Envelope["pages"]; fields: Field[]; message: string; others: { name: string; status: Recipient["status"] }[];
};
export type SignatureValue = { kind: "typed"; text: string } | { kind: "drawn"; png: string };
export type SignPayload = { signature?: SignatureValue; initials?: string; values: Record<string, string> };
export const FIELD_META: Record<FieldType, { label: string; w: number; h: number }> = {
  signature: { label: "Signature", w: 0.28, h: 0.055 }, initials: { label: "Initials", w: 0.1, h: 0.04 }, date: { label: "Date signed", w: 0.18, h: 0.03 },
  text: { label: "Text", w: 0.3, h: 0.03 }, checkbox: { label: "Checkbox", w: 0.03, h: 0.022 },
};
