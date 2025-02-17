import { getDb } from './index';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(),
}));

describe('Database Connection', () => {
  let clientMock: jest.Mocked<Client>;

  beforeEach(() => {
    clientMock = new Client() as jest.Mocked<Client>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should establish a database connection', async () => {
    await getDb();

    expect(Client).toHaveBeenCalledTimes(1);
    expect(clientMock.connect).toHaveBeenCalledTimes(1);
    expect(drizzle).toHaveBeenCalledWith(clientMock, { schema });
  });

  it('should return the same database instance on subsequent calls', async () => {
    const db1 = await getDb();
    const db2 = await getDb();

    expect(db1).toBe(db2);
    expect(Client).toHaveBeenCalledTimes(1);
    expect(clientMock.connect).toHaveBeenCalledTimes(1);
  });
});
