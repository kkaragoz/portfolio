import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

const PG_DUMP_PATH = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
const BACKUP_DIR = 'C:\\dbs';

export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL tanımlı değil' }, { status: 500 });
    }

    // Ensure backup directory exists
    const fs = await import('fs/promises');
    const path = await import('path');

    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Run pg_dump
    return new Promise<NextResponse>((resolve) => {
      const pgDump = spawn(PG_DUMP_PATH, [
        '--no-owner',
        '--no-privileges',
        '--format=plain',
        '--file', filePath,
        databaseUrl,
      ]);

      let stderr = '';

      pgDump.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pgDump.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(
            NextResponse.json({
              ok: true,
              message: `Yedek başarıyla alındı`,
              path: filePath,
              filename,
            })
          );
        } else {
          console.error('pg_dump stderr:', stderr);
          resolve(
            NextResponse.json(
              { error: `pg_dump hata kodu: ${code}`, detail: stderr },
              { status: 500 }
            )
          );
        }
      });

      pgDump.on('error', (err: Error) => {
        console.error('pg_dump spawn error:', err);
        resolve(
          NextResponse.json(
            {
              error: 'pg_dump çalıştırılamadı. Dosya bulunamadı veya erişim hatası.',
              detail: err.message,
            },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
