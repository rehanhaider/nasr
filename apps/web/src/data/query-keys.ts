export const queryKeys = {
  auth: {
    status: ['auth', 'status'] as const,
  },
  settings: ['settings'] as const,
  deen: {
    all: ['deen'] as const,
    days: ['deen', 'days'] as const,
    day: (date: string) => ['deen', 'day', date] as const,
    observations: ['deen', 'observations'] as const,
    content: ['deen', 'content'] as const,
  },
}
