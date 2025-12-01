// Test if the helper types are working correctly
import type { Client } from './src/lib/types/client';

type AutoTimestampKeys<Row> = Extract<'id' | 'created_at' | 'updated_at', keyof Row>;
type Insertable<Row> = Omit<Row, AutoTimestampKeys<Row>> & Partial<Pick<Row, AutoTimestampKeys<Row>>>;
type Updatable<Row> = Partial<Omit<Row, AutoTimestampKeys<Row>>>;

// Test with Client type
type ClientAutoKeys = AutoTimestampKeys<Client>;
type ClientInsertable = Insertable<Client>;
type ClientUpdatable = Updatable<Client>;

// Check what these resolve to
const testAutoKeys: ClientAutoKeys = 'id'; // Should be 'id' | 'created_at' | 'updated_at'
const testInsertable: ClientInsertable = {
  name: 'Test',
  type: 'insurance',
  borderline_writeoff_percentage: 65,
  total_writeoff_percentage: 70,
  salvage_percentage: 28,
  is_active: true
};

console.log('Helper types work correctly');

