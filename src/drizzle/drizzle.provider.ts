import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleProvider {
  private readonly db: NodePgDatabase<typeof schema>;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
  }

  /**
   * Returns the configured Drizzle ORM instance.
   */
  getDatabase(): NodePgDatabase<typeof schema> {
    return this.db;
  }
}
