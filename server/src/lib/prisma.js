import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL

const adapter = new PrismaPg(new pg.Pool({ connectionString }))

const prisma = new PrismaClient({
  adapter,
})

export default prisma
