import { POST } from './route';
import { getServerSession } from 'next-auth';
import { getDb } from '@/db';
import OpenAI from 'openai';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('openai', () => jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })));

describe('POST /api/transactions/process-csv', () => {
  let mockDb: any;
  let mockSession: any;
  let mockOpenAI: any;

  beforeEach(() => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
    };

    mockSession = {
      user: {
        id: 'test-user-id',
      },
    };

    mockOpenAI = new OpenAI();

    (getDb as jest.Mock).mockResolvedValue(mockDb);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/transactions/process-csv', {
      method: 'POST',
      body: JSON.stringify({ csvData: 'test-csv-data' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('should process CSV data and insert transactions into the database', async () => {
    const csvData = 'test-csv-data';
    const parsedTransactions = [
      {
        amount: 1000,
        date: '2023-01-01T00:00:00.000Z',
        categoryId: 'category-1',
        description: 'Test Transaction',
        aiTags: ['tag1', 'tag2'],
      },
    ];

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(parsedTransactions),
          },
        },
      ],
    });

    const req = new Request('http://localhost/api/transactions/process-csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(parsedTransactions);

    expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
    expect(mockDb.values).toHaveBeenCalledWith(
      parsedTransactions.map((tx) => ({
        userId: 'test-user-id',
        amount: tx.amount,
        date: new Date(tx.date),
        categoryId: tx.categoryId,
        description: tx.description,
        aiTags: tx.aiTags,
      })),
    );
  });

  it('should return 500 if CSV processing fails', async () => {
    (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(new Error('AI Error'));

    const req = new Request('http://localhost/api/transactions/process-csv', {
      method: 'POST',
      body: JSON.stringify({ csvData: 'test-csv-data' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Failed to process CSV' });
  });
});
