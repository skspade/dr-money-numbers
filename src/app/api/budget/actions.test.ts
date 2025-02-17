import { upsertCategory, updateSpending, getCategories, getTransactions } from './actions';
import { getDb } from '@/db';
import { categories, transactions } from '@/db/schema';

jest.mock('@/db', () => ({
  getDb: jest.fn(),
}));

describe('Budget API Actions', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      onConflictDoUpdate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
    };

    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertCategory', () => {
    it('should insert a new category', async () => {
      const userId = 'test-user-id';
      const allocation = {
        id: 'new-category-id',
        category: 'Test Category',
        target: { amount: 10000, type: 'monthly' },
        available: 10000,
      };

      await upsertCategory(userId, allocation);

      expect(mockDb.insert).toHaveBeenCalledWith(categories);
      expect(mockDb.values).toHaveBeenCalledWith({
        id: allocation.id,
        userId,
        name: allocation.category,
        target: allocation.target.amount,
        frequency: 'MONTHLY',
        available: allocation.available,
      });
      expect(mockDb.onConflictDoUpdate).toHaveBeenCalledWith({
        target: categories.id,
        set: {
          target: allocation.target.amount,
          available: allocation.available,
        },
      });
    });

    it('should update an existing category', async () => {
      const userId = 'test-user-id';
      const allocation = {
        id: 'existing-category-id',
        category: 'Test Category',
        target: { amount: 10000, type: 'monthly' },
        available: 10000,
      };

      await upsertCategory(userId, allocation);

      expect(mockDb.insert).toHaveBeenCalledWith(categories);
      expect(mockDb.values).toHaveBeenCalledWith({
        id: allocation.id,
        userId,
        name: allocation.category,
        target: allocation.target.amount,
        frequency: 'MONTHLY',
        available: allocation.available,
      });
      expect(mockDb.onConflictDoUpdate).toHaveBeenCalledWith({
        target: categories.id,
        set: {
          target: allocation.target.amount,
          available: allocation.available,
        },
      });
    });
  });

  describe('updateSpending', () => {
    it('should create a transaction and update category available amount', async () => {
      const userId = 'test-user-id';
      const categoryId = 'test-category-id';
      const amount = 5000;

      mockDb.select.mockResolvedValueOnce([{ id: categoryId, available: 10000 }]);

      await updateSpending(userId, categoryId, amount);

      expect(mockDb.insert).toHaveBeenCalledWith(transactions);
      expect(mockDb.values).toHaveBeenCalledWith({
        userId,
        categoryId,
        amount,
        date: expect.any(Date),
      });
      expect(mockDb.update).toHaveBeenCalledWith(categories);
      expect(mockDb.set).toHaveBeenCalledWith({
        available: 5000,
      });
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('getCategories', () => {
    it('should fetch user categories', async () => {
      const userId = 'test-user-id';
      const userCategories = [
        {
          id: 'category-1',
          userId,
          name: 'Category 1',
          target: 20000,
          frequency: 'MONTHLY',
          available: 15000,
        },
      ];

      mockDb.select.mockResolvedValueOnce(userCategories);

      const result = await getCategories(userId);

      expect(result).toEqual({ success: true, data: userCategories });
      expect(mockDb.select).toHaveBeenCalledWith();
      expect(mockDb.from).toHaveBeenCalledWith(categories);
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('getTransactions', () => {
    it('should fetch user transactions', async () => {
      const userId = 'test-user-id';
      const userTransactions = [
        {
          id: 'transaction-1',
          userId,
          categoryId: 'category-1',
          amount: 5000,
          date: new Date(),
        },
      ];

      mockDb.select.mockResolvedValueOnce(userTransactions);

      const result = await getTransactions(userId);

      expect(result).toEqual({ success: true, data: userTransactions });
      expect(mockDb.select).toHaveBeenCalledWith();
      expect(mockDb.from).toHaveBeenCalledWith(transactions);
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should fetch user transactions for a specific category', async () => {
      const userId = 'test-user-id';
      const categoryId = 'category-1';
      const userTransactions = [
        {
          id: 'transaction-1',
          userId,
          categoryId,
          amount: 5000,
          date: new Date(),
        },
      ];

      mockDb.select.mockResolvedValueOnce(userTransactions);

      const result = await getTransactions(userId, categoryId);

      expect(result).toEqual({ success: true, data: userTransactions });
      expect(mockDb.select).toHaveBeenCalledWith();
      expect(mockDb.from).toHaveBeenCalledWith(transactions);
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
