export type Role = 'CITIZEN' | 'FIELD_OFFICER' | 'DISTRICT_ADMIN' | 'STATE_ADMIN';

export const Role = {
  CITIZEN: 'CITIZEN' as Role,
  FIELD_OFFICER: 'FIELD_OFFICER' as Role,
  DISTRICT_ADMIN: 'DISTRICT_ADMIN' as Role,
  STATE_ADMIN: 'STATE_ADMIN' as Role,
} as const;
