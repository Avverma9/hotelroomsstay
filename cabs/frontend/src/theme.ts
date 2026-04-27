/**
 * Theme & Constants — Vibrant Travel (Sunset Coral + Midnight Navy)
 */
export const colors = {
  primary: "#FF5A5F",
  primaryDark: "#E04347",
  primarySoft: "#FFECEC",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#0A1128",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  inputBg: "#F1F5F9",
  success: "#059669",
  warning: "#D97706",
  info: "#2563EB",
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "#FEF3C7", text: "#D97706" },
  Confirmed: { bg: "#D1FAE5", text: "#059669" },
  InProgress: { bg: "#DBEAFE", text: "#2563EB" },
  AwaitingPickup: { bg: "#DBEAFE", text: "#2563EB" },
  AwaitingConfirmation: { bg: "#FEF3C7", text: "#D97706" },
  Completed: { bg: "#E0E7FF", text: "#4F46E5" },
  Cancelled: { bg: "#FEE2E2", text: "#DC2626" },
  Failed: { bg: "#FEE2E2", text: "#DC2626" },
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const IMAGES = {
  authHero:
    "https://images.unsplash.com/photo-1721499774867-c00b65036c35?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxyb2FkJTIwdHJpcCUyMGNhciUyMHN1bnNldHxlbnwwfHx8fDE3NzY0OTI1MzN8MA&ixlib=rb-4.1.0&q=85",
  empty:
    "https://images.unsplash.com/photo-1562804239-0bd8346b9eaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMHJvYWQlMjBsYW5kc2NhcGV8ZW58MHx8fHwxNzc2NDkyNTM1fDA&ixlib=rb-4.1.0&q=85",
  carPlaceholder:
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
};
