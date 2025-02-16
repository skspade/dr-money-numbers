import { pgTable, text, timestamp, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Create enum for target frequency
export const targetFrequencyEnum = pgEnum('target_frequency', ['WEEKLY', 'MONTHLY', 'ANNUAL']);

// User table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
});

// Category table
export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  target: real('target').notNull(),
  frequency: targetFrequencyEnum('frequency').notNull(),
  available: real('available').notNull(),
});

// Transaction table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  date: timestamp('date').notNull(),
  aiTags: text('ai_tags').array(),
});

// AI Settings table
export const aiSettings = pgTable('ai_settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  categories: many(categories),
  transactions: many(transactions),
  aiPreferences: one(aiSettings, {
    fields: [users.id],
    references: [aiSettings.userId],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const aiSettingsRelations = relations(aiSettings, ({ one }) => ({
  user: one(users, {
    fields: [aiSettings.userId],
    references: [users.id],
  }),
})); 