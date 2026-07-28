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
    sadaqah: ['deen', 'sadaqah'] as const,
  },
  pipeline: {
    all: ['pipeline'] as const,
    opportunities: ['pipeline', 'opportunities'] as const,
    opportunity: (id: string) => ['pipeline', 'opportunity', id] as const,
    touches: (opportunityId: string) => ['pipeline', 'touches', opportunityId] as const,
  },
}
