import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { Role } from '../../enum/roles.enum';

const roleValues: [string, ...string[]] = Object.values(Role) as [
  string,
  ...string[],
];

// Define PostgreSQL enumeration using enum values
export const rolesEnum = pgEnum('roles', roleValues);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  roles: jsonb('roles').default(JSON.stringify([Role.USER])),
  isActive: boolean().default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
