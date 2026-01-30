<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

trait PaginationTrait
{
    /**
     * Default pagination size
     */
    protected $defaultPerPage = 20;

    /**
     * Maximum pagination size
     */
    protected $maxPerPage = 100;

    /**
     * Apply pagination to query with validation
     * 
     * @param Builder $query
     * @param Request $request
     * @param int|null $defaultPerPage
     * @return LengthAwarePaginator
     */
    protected function paginateQuery(Builder $query, Request $request, ?int $defaultPerPage = null): LengthAwarePaginator
    {
        $perPage = $this->getValidatedPerPage($request, $defaultPerPage);
        
        return $query->paginate($perPage);
    }

    /**
     * Get validated per page value
     * 
     * @param Request $request
     * @param int|null $defaultPerPage
     * @return int
     */
    protected function getValidatedPerPage(Request $request, ?int $defaultPerPage = null): int
    {
        $perPage = $request->get('per_page', $defaultPerPage ?? $this->defaultPerPage);
        
        // Ensure per_page is numeric and within bounds
        $perPage = is_numeric($perPage) ? (int) $perPage : $this->defaultPerPage;
        
        return min(max($perPage, 1), $this->maxPerPage);
    }

    /**
     * Format paginated response
     * 
     * @param LengthAwarePaginator $paginator
     * @param string $message
     * @return array
     */
    protected function formatPaginatedResponse(LengthAwarePaginator $paginator, string $message = 'Данные успешно получены'): array
    {
        return [
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'has_more_pages' => $paginator->hasMorePages(),
                'next_page_url' => $paginator->nextPageUrl(),
                'prev_page_url' => $paginator->previousPageUrl()
            ],
            'message' => $message
        ];
    }

    /**
     * Apply search filters to query
     * 
     * @param Builder $query
     * @param Request $request
     * @param array $searchableFields
     * @return Builder
     */
    protected function applySearch(Builder $query, Request $request, array $searchableFields = []): Builder
    {
        $search = $request->get('search');
        
        if ($search && !empty($searchableFields)) {
            $query->where(function ($q) use ($search, $searchableFields) {
                foreach ($searchableFields as $field) {
                    $q->orWhere($field, 'ILIKE', "%{$search}%");
                }
            });
        }
        
        return $query;
    }

    /**
     * Apply sorting to query
     * 
     * @param Builder $query
     * @param Request $request
     * @param array $sortableFields
     * @param string $defaultSort
     * @param string $defaultDirection
     * @return Builder
     */
    protected function applySorting(
        Builder $query, 
        Request $request, 
        array $sortableFields = [], 
        string $defaultSort = 'created_at', 
        string $defaultDirection = 'desc'
    ): Builder {
        $sortBy = $request->get('sort_by', $defaultSort);
        $sortDirection = $request->get('sort_direction', $defaultDirection);
        
        // Validate sort field
        if (!in_array($sortBy, $sortableFields)) {
            $sortBy = $defaultSort;
        }
        
        // Validate sort direction
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = $defaultDirection;
        }
        
        return $query->orderBy($sortBy, $sortDirection);
    }

    /**
     * Get pagination parameters for caching
     * 
     * @param Request $request
     * @return string
     */
    protected function getPaginationCacheKey(Request $request): string
    {
        $params = [
            'page' => $request->get('page', 1),
            'per_page' => $this->getValidatedPerPage($request),
            'search' => $request->get('search', ''),
            'sort_by' => $request->get('sort_by', ''),
            'sort_direction' => $request->get('sort_direction', '')
        ];
        
        return md5(serialize($params));
    }
}