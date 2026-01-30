<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class MediaPageMigrationRollback extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media-page:rollback {--backup : Create backup before rollback}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rollback media page migrations with optional backup';

    /**
     * Media page migration files in rollback order
     */
    private array $mediaPageMigrations = [
        'create_media_process_steps_table',
        'create_media_testimonials_table', 
        'create_media_service_media_table',
        'create_media_service_features_table',
        'create_media_services_table',
        'create_media_page_content_table'
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $this->info('Media Page Migration Rollback');
            $this->info('================================');

            // Create backup if requested
            if ($this->option('backup')) {
                $this->info('Creating backup before rollback...');
                $exitCode = Artisan::call('media-page:backup');
                if ($exitCode !== 0) {
                    $this->error('Backup failed. Aborting rollback.');
                    return Command::FAILURE;
                }
                $this->info('✓ Backup created successfully');
            }

            // Check which migrations exist
            $existingMigrations = $this->getExistingMediaPageMigrations();
            
            if (empty($existingMigrations)) {
                $this->info('No media page migrations found to rollback.');
                return Command::SUCCESS;
            }

            $this->info('Found media page migrations:');
            foreach ($existingMigrations as $migration) {
                $this->info("  - {$migration}");
            }

            // Confirm rollback
            if (!$this->confirm('This will rollback all media page migrations and delete all data. Continue?')) {
                $this->info('Rollback cancelled');
                return Command::SUCCESS;
            }

            // Perform rollback
            $this->info('Rolling back media page migrations...');
            
            foreach ($existingMigrations as $migration) {
                $this->info("Rolling back: {$migration}");
                
                // Find the migration file and rollback
                $exitCode = Artisan::call('migrate:rollback', [
                    '--path' => 'database/migrations',
                    '--step' => 1
                ]);

                if ($exitCode !== 0) {
                    $this->error("Failed to rollback migration: {$migration}");
                    return Command::FAILURE;
                }
            }

            $this->info('✓ All media page migrations rolled back successfully');
            $this->info('✓ All media page data has been removed');
            
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Rollback failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Get existing media page migrations from database
     */
    private function getExistingMediaPageMigrations(): array
    {
        try {
            $migrations = DB::table('migrations')
                ->where('migration', 'like', '%media_%')
                ->orderBy('batch', 'desc')
                ->orderBy('id', 'desc')
                ->pluck('migration')
                ->toArray();

            // Filter to only media page related migrations
            return array_filter($migrations, function($migration) {
                foreach ($this->mediaPageMigrations as $mediaPageMigration) {
                    if (str_contains($migration, $mediaPageMigration)) {
                        return true;
                    }
                }
                return false;
            });

        } catch (\Exception $e) {
            $this->error('Could not check existing migrations: ' . $e->getMessage());
            return [];
        }
    }
}
