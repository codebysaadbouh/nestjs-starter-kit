import { integer, serial, text, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const profilePictures = pgTable('profile_pictures', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(), // Unique fileName
  bucket: text('bucket').notNull(), // MinIO bucket name
  size: integer('size').notNull(), // File size
  format: text('format').notNull(), // MIME file format
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
