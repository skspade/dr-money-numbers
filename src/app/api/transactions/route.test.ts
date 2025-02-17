import { GET } from './route';
import { getServerSession } from 'next-auth';
import { getDb } from '@/db';
import { NextResponse } from 'next/server';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/db', () => ({
  getDb: jest.fn(),
}));

describe('GET /api/transactions', () => {
  let mockDb: any;
  let mockSession: any;

  beforeEach(() => {
    mockDb = {
      query: {
        transactions: {
          findMany: jest.fn(),
        },
      },
    };

    mockSession = {
      user: {
        id: 'test-user-id',
      },
    };

    (getDb as jest.Mock).mockResolvedValue(mockDb);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('should fetch transactions for authenticated user', async () => {
    const userTransactions = [
      {
        id: 'transaction-1',
        userId: 'test-user-id',
        amount: 5000,
        date: new Date(),
        categoryId: 'category-1',
        description: 'Test Transaction',
        aiTags: ['tag1', 'tag2'],
      },
    ];

    mockDb.query.transactions.findMany.mockResolvedValue(userTransactions);

    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(userTransactions);

    expect(mockDb.query.transactions.findMany).toHaveBeenCalledWith({
      where: expect.any(Function),
      orderBy: expect.any(Array),
    });
  });

  it('should return 500 if fetching transactions fails', async () => {
    mockDb.query.transactions.findMany.mockRejectedValue(new Error('Database Error'));

    const res = await GET();

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Failed to fetch transactions' });
  });
});
