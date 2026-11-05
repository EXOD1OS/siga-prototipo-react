import { Prisma } from '@prisma/client';

type DatabaseReader = Pick<Prisma.TransactionClient, '$queryRaw'>;
type TableOccupancy = { tableName: string; hasRows: boolean };

// Obtener las tablas desde Prisma evita olvidar nuevos modelos al proteger el seed.
// _prisma_migrations no forma parte de los datos de la aplicación.
export async function occupiedDomainTables(db: DatabaseReader): Promise<string[]> {
  const checks = Prisma.dmmf.datamodel.models.map(model => {
    const tableName = model.dbName ?? model.name;
    const identifier = Prisma.raw('"' + tableName.replace(/"/g, '""') + '"');
    return Prisma.sql`SELECT ${tableName}::text AS "tableName", EXISTS (SELECT 1 FROM ${identifier}) AS "hasRows"`;
  });
  if (!checks.length) throw new Error('No se encontraron los modelos de Prisma. Generá el cliente antes de preparar la base.');
  const tables = await db.$queryRaw<TableOccupancy[]>(Prisma.join(checks, ' UNION ALL '));
  if (tables.length !== checks.length) throw new Error('No se pudo comprobar el estado completo de la base. No se cargarán datos de demostración.');
  return tables.filter(table => table.hasRows).map(table => table.tableName);
}

export async function domainDatabaseIsEmpty(db: DatabaseReader): Promise<boolean> {
  return (await occupiedDomainTables(db)).length === 0;
}

export async function assertDomainDatabaseEmpty(db: DatabaseReader): Promise<void> {
  const occupied = await occupiedDomainTables(db);
  if (occupied.length) {
    throw new Error(
      'La base ya contiene datos. Se canceló la carga de demostración para conservarlos. ' +
      'Para actualizar ejecutá las migraciones y la conversión de PAAD, sin volver a sembrar la base. ' +
      `Tablas con registros: ${occupied.join(', ')}.`
    );
  }
}
