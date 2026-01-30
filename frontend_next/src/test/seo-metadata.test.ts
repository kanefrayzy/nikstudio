import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import { StructuredDataGenerator } from '@/lib/structured-data';

describe('SEO Metadata Generation', () => {
  const mockGlobalSettings = {
    id: 1,
    site_title: 'NIK Studio',
    site_description: 'Комплексные решения для промышленных компаний',
    default_image: '/images/default-og.jpg',
    twitter_card_type: 'summary_large_image' as const,
    facebook_app_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockProjectContent = {
    seo_title: 'Тестовый проект SEO',
    seo_description: 'Описание тестового проекта для SEO',
    seo_image: '/images/project-seo.jpg',
    title: 'Тестовый проект',
    main_title: 'Основной заголовок проекта',
    description: 'Описание проекта',
    main_image: '/images/project-main.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    slug: 'test-project'
  };

  describe('SEOMetadataGenerator', () => {
    test('should generate metadata for project page', () => {
      const metadata = SEOMetadataGenerator.generateMetadata({
        content: mockProjectContent,
        globalSettings: mockGlobalSettings,
        pageType: 'project',
        slug: 'test-project'
      });

      expect(metadata.title).toBe('Тестовый проект SEO');
      expect(metadata.description).toBe('Описание тестового проекта для SEO');
      expect(metadata.openGraph?.title).toBe('Тестовый проект SEO');
      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });

    test('should generate fallback metadata when content is null', () => {
      const metadata = SEOMetadataGenerator.generateMetadata({
        content: null,
        globalSettings: mockGlobalSettings,
        pageType: 'home'
      });

      expect(metadata.title).toBe('NIK Studio');
      expect(metadata.description).toBe('Комплексные решения для промышленных компаний');
      expect(metadata.openGraph?.type).toBe('website');
    });

    test('should truncate long titles and descriptions', () => {
      const longContent = {
        ...mockProjectContent,
        seo_title: 'Очень длинный заголовок который превышает лимит в 60 символов и должен быть обрезан для тестирования',
        seo_description: 'Очень длинное описание которое превышает лимит в 160 символов и должно быть обрезано для соответствия требованиям поисковых систем и социальных сетей для тестирования функции обрезки'
      };

      const metadata = SEOMetadataGenerator.generateMetadata({
        content: longContent,
        globalSettings: mockGlobalSettings,
        pageType: 'project',
        slug: 'test-project'
      });

      expect(metadata.title?.length).toBeLessThanOrEqual(60);
      expect(metadata.description?.length).toBeLessThanOrEqual(160);
      expect(metadata.title).toContain('...');
      expect(metadata.description).toContain('...');
    });
  });

  describe('StructuredDataGenerator', () => {
    test('should generate organization schema', () => {
      const schema = StructuredDataGenerator.generateOrganizationSchema(mockGlobalSettings);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('NIK Studio');
      expect(schema.description).toBe('Комплексные решения для промышленных компаний');
    });

    test('should generate article schema for blog posts', () => {
      const schema = StructuredDataGenerator.generateArticleSchema(
        mockProjectContent,
        mockGlobalSettings,
        'test-blog-post'
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe('Тестовый проект SEO');
      expect(schema.description).toBe('Описание тестового проекта для SEO');
      expect(schema.author.name).toBe('NIK Studio');
    });

    test('should generate creative work schema for projects', () => {
      const schema = StructuredDataGenerator.generateCreativeWorkSchema(
        mockProjectContent,
        mockGlobalSettings,
        'test-project'
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('CreativeWork');
      expect(schema.name).toBe('Тестовый проект SEO');
      expect(schema.description).toBe('Описание тестового проекта для SEO');
      expect(schema.creator.name).toBe('NIK Studio');
    });

    test('should generate structured data for different content types', () => {
      const homeSchemas = StructuredDataGenerator.generateStructuredData('home', null, mockGlobalSettings);
      expect(homeSchemas).toHaveLength(2); // Organization + WebSite

      const blogSchemas = StructuredDataGenerator.generateStructuredData('blog', mockProjectContent, mockGlobalSettings, 'test-blog');
      expect(blogSchemas).toHaveLength(2); // Article + Organization

      const projectSchemas = StructuredDataGenerator.generateStructuredData('project', mockProjectContent, mockGlobalSettings, 'test-project');
      expect(projectSchemas).toHaveLength(2); // CreativeWork + Organization
    });
  });
});