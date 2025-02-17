import { saveBudgetAllocation, loadBudgetAllocations, saveBudgetSettings } from './budget';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';
import { categories, userBudget } from '@/db/schema';

jest.mock('@/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

describe('Budget Actions', () => {
  let mockDb: any;
  let mockSession: any;

  beforeEach(() => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      onConflictDoUpdate: jest.fn().mockReturnThis(),
    };

    mockSession = {
      user: {
        id: 'test-user-id',
      },
    };

    (getDb as jest.Mock).mockResolvedValue(mockDb);
    (auth as jest.Mock).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveBudgetAllocation', () => {
    it('should save a new budget allocation', async () => {
      const allocation = {
        category: 'Test Category',
        amount: 100,
        frequency: 'MONTHLY',
        allocated: 100,
        spent: 0,
        available: 100,
      };

      mockDb.select.mockResolvedValue([]);
      mockDb.insert.mockResolvedValue([{ id: 'new-category-id' }]);

      const result = await saveBudgetAllocation(allocation);

      expect(result).toBe('new-category-id');
      expect(mockDb.insert).toHaveBeenCalledWith(categories);
      expect(mockDb.values).toHaveBeenCalledWith({
        userId: 'test-user-id',
        name: allocation.category,
        target: 10000,
        frequency: allocation.frequency,
        available: 10000,
      });
    });

    it('should update an existing budget allocation', async () => {
      const allocation = {
        category: 'Test Category',
        amount: 100,
        frequency: 'MONTHLY',
        allocated: 100,
        spent: 0,
        available: 100,
      };

      mockDb.select.mockResolvedValue([{ id: 'existing-category-id' }]);
      mockDb.update.mockResolvedValue([{ id: 'existing-category-id' }]);

      const result = await saveBudgetAllocation(allocation);

      expect(result).toBe('existing-category-id');
      expect(mockDb.update).toHaveBeenCalledWith(categories);
      expect(mockDb.set).toHaveBeenCalledWith({
        target: 10000,
        frequency: allocation.frequency,
        available: 10000,
      });
    });

    it('should throw an error if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(saveBudgetAllocation({
        category: 'Test Category',
        amount: 100,
        frequency: 'MONTHLY',
        allocated: 100,
        spent: 0,
        available: 100,
      })).rejects.toThrow('Not authenticated');
    });
  });

  describe('loadBudgetAllocations', () => {
    it('should load budget allocations', async () => {
      const budgetSettings = {
        monthlyIncome: 500000,
        targetSavings: 100000,
      };

      const userCategories = [
        {
          id: 'category-1',
          userId: 'test-user-id',
          name: 'Category 1',
          target: 20000,
          frequency: 'MONTHLY',
          available: 15000,
        },
      ];

      mockDb.select.mockResolvedValueOnce([budgetSettings]);
      mockDb.select.mockResolvedValueOnce(userCategories);

      const result = await loadBudgetAllocations();

      expect(result).toEqual({
        totalIncome: 5000,
        targetSavings: 1000,
        allocations: [
          {
            id: 'category-1',
            userId: 'test-user-id',
            category: 'Category 1',
            amount: 200,
            frequency: 'MONTHLY',
            allocated: 200,
            spent: 0,
            available: 150,
          },
        ],
      });
    });

    it('should throw an error if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(loadBudgetAllocations()).rejects.toThrow('Not authenticated');
    });
  });

  describe('saveBudgetSettings', () => {
    it('should save budget settings', async () => {
      const settings = {
        monthlyIncome: 5000,
        targetSavings: 1000,
      };

      await saveBudgetSettings(settings);

      expect(mockDb.insert).toHaveBeenCalledWith(userBudget);
      expect(mockDb.values).toHaveBeenCalledWith({
        userId: 'test-user-id',
        monthlyIncome: 500000,
        targetSavings: 100000,
      });
      expect(mockDb.onConflictDoUpdate).toHaveBeenCalledWith({
        target: [userBudget.userId],
        set: {
          monthlyIncome: 500000,
          targetSavings: 100000,
        },
      });
    });

    it('should throw an error if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(saveBudgetSettings({
        monthlyIncome: 5000,
        targetSavings: 1000,
      })).rejects.toThrow('Not authenticated');
    });
  });
});
