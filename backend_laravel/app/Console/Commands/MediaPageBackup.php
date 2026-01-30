<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MediaPageContent;
use App\Models\MediaService;
use App\Models\MediaServiceFeature;
use App\Models\MediaServiceMedia;
use App\Models\MediaTestimonial;
use App\Models\MediaProcessStep;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class MediaPageBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media-page:backup {--restore= : Restore from backup file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup or restore media page content to/from JSON file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('restore')) {
            return $this->restoreFromBackup($this->option('restore'));
        }

        return $this->createBackup();
    }

    /**
     * Create a backup of all media page content
     */
    private function createBackup(): int
    {
        try {
            $this->info('Creating media page backup...');

            $backup = [
                'created_at' => Carbon::now()->toISOString(),
                'version' => '1.0',
                'data' => [
                    'media_page_content' => MediaPageContent::all()->toArray(),
                    'media_services' => MediaService::with(['features', 'mediaItems'])->orderBy('order')->get()->toArray(),
                    'media_testimonials' => MediaTestimonial::orderBy('order')->get()->toArray(),
                    'media_process_steps' => MediaProcessStep::orderBy('order')->get()->toArray()
                ]
            ];

            $filename = 'media_page_backup_' . Carbon::now()->format('Y_m_d_H_i_s') . '.json';
            $backupPath = 'backups/' . $filename;

            // Ensure backups directory exists
            if (!Storage::disk('local')->exists('backups')) {
                Storage::disk('local')->makeDirectory('backups');
            }

            // Save backup file
            Storage::disk('local')->put($backupPath, json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $fullPath = storage_path('app/' . $backupPath);
            $this->info("✓ Backup created successfully: {$fullPath}");
            $this->info("Records backed up:");
            $this->info("  - Media page content: " . count($backup['data']['media_page_content']));
            $this->info("  - Media services: " . count($backup['data']['media_services']));
            $this->info("  - Testimonials: " . count($backup['data']['media_testimonials']));
            $this->info("  - Process steps: " . count($backup['data']['media_process_steps']));

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Backup failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Restore media page content from backup
     */
    private function restoreFromBackup(string $filename): int
    {
        try {
            $this->info("Restoring media page from backup: {$filename}");

            // Check if file exists
            $backupPath = 'backups/' . $filename;
            if (!Storage::disk('local')->exists($backupPath)) {
                $this->error("Backup file not found: {$backupPath}");
                return Command::FAILURE;
            }

            // Load backup data
            $backupContent = Storage::disk('local')->get($backupPath);
            $backup = json_decode($backupContent, true);

            if (!$backup || !isset($backup['data'])) {
                $this->error('Invalid backup file format');
                return Command::FAILURE;
            }

            // Confirm restoration
            if (!$this->confirm('This will replace all current media page data. Continue?')) {
                $this->info('Restoration cancelled');
                return Command::SUCCESS;
            }

            // Clear existing data
            $this->info('Clearing existing data...');
            MediaServiceMedia::truncate();
            MediaServiceFeature::truncate();
            MediaService::truncate();
            MediaTestimonial::truncate();
            MediaProcessStep::truncate();
            MediaPageContent::truncate();

            // Restore data
            $data = $backup['data'];

            // Restore media page content
            if (isset($data['media_page_content'])) {
                foreach ($data['media_page_content'] as $content) {
                    unset($content['id']); // Let database assign new IDs
                    MediaPageContent::create($content);
                }
                $this->info('✓ Media page content restored');
            }

            // Restore media services with features and media
            if (isset($data['media_services'])) {
                foreach ($data['media_services'] as $serviceData) {
                    $features = $serviceData['features'] ?? [];
                    $mediaItems = $serviceData['media_items'] ?? [];
                    
                    // Remove relations from service data
                    unset($serviceData['features'], $serviceData['media_items'], $serviceData['id']);
                    
                    $service = MediaService::create($serviceData);

                    // Restore features
                    foreach ($features as $featureData) {
                        unset($featureData['id']);
                        $featureData['service_id'] = $service->id;
                        MediaServiceFeature::create($featureData);
                    }

                    // Restore media items
                    foreach ($mediaItems as $mediaData) {
                        unset($mediaData['id']);
                        $mediaData['service_id'] = $service->id;
                        MediaServiceMedia::create($mediaData);
                    }
                }
                $this->info('✓ Media services restored');
            }

            // Restore testimonials
            if (isset($data['media_testimonials'])) {
                foreach ($data['media_testimonials'] as $testimonial) {
                    unset($testimonial['id']);
                    MediaTestimonial::create($testimonial);
                }
                $this->info('✓ Testimonials restored');
            }

            // Restore process steps
            if (isset($data['media_process_steps'])) {
                foreach ($data['media_process_steps'] as $step) {
                    unset($step['id']);
                    MediaProcessStep::create($step);
                }
                $this->info('✓ Process steps restored');
            }

            $this->info("✓ Media page restored successfully from backup created at: {$backup['created_at']}");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Restoration failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
