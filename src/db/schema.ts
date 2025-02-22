import { pgTable, text, timestamp, integer, primaryKey, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const targetFrequencyEnum = pgEnum('target_frequency', ['WEEKLY', 'MONTHLY', 'ANNUAL']);
export type TargetFrequency = 'WEEKLY' | 'MONTHLY' | 'ANNUAL';

// NextAuth Tables
export const users = pgTable('users', {
  id: text('id').notNull().primaryKey().$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable('account', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  userIdIdx: index('account_userId_idx').on(account.userId),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (session) => ({
  userIdIdx: index('session_userId_idx').on(session.userId),
}));

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// Application Tables
export const categories = pgTable('category', {
  id: text('id').notNull().primaryKey().$defaultFn(() => createId()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  target: integer('target').notNull(),
  frequency: targetFrequencyEnum('frequency').notNull(),
  available: integer('available').notNull(),
});

export const transactions = pgTable('transaction', {
  id: text('id').notNull().primaryKey().$defaultFn(() => createId()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('categoryId')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  aiTags: text('aiTags').array(),
});

export const aiSettings = pgTable('aiSetting', {
  id: text('id').notNull().primaryKey().$defaultFn(() => createId()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const userBudget = pgTable('userBudget', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  monthlyIncome: integer('monthlyIncome').notNull().default(0),
  targetSavings: integer('targetSavings').notNull().default(0),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  categories: many(categories),
  transactions: many(transactions),
  aiSettings: many(aiSettings),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
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
