'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { BASE_URL, buildJsonHeaders, readApiResponse } from '@/utils/api';

export interface CourseCategory {
  category_id: number | string;
  owner_id: number | string;
  category_name: string;
}

type CourseCategoryResponse = {
  tableData?: CourseCategory[];
  message?: string;
};

type UseCourseCategoriesParams = {
  ownerId?: string | number;
  onUnauthorized?: () => void;
  onError?: (message: string) => void;
};

function normalizeCategories(value: unknown): CourseCategory[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is CourseCategory => {
      if (!item || typeof item !== 'object') return false;
      const row = item as Record<string, unknown>;
      return Boolean(row.category_id) && Boolean(row.category_name);
    })
    .map((item) => ({
      category_id: item.category_id,
      owner_id: item.owner_id,
      category_name: String(item.category_name),
    }));
}

export function useCourseCategories({
  ownerId,
  onUnauthorized,
  onError,
}: UseCourseCategoriesParams) {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const onUnauthorizedRef = useRef(onUnauthorized);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetchCategories = useCallback(async () => {
    const cleanOwnerId = String(ownerId || '').trim();

    if (!BASE_URL || !cleanOwnerId) {
      setCategories([]);
      return;
    }

    try {
      setIsCategoryLoading(true);

      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
      const response = await fetch(`${BASE_URL}/table/course_category/${cleanOwnerId}/1`, {
        method: 'GET',
        headers: buildJsonHeaders(token),
      });

      if (response.status === 401 || response.status === 403) {
        onUnauthorizedRef.current?.();
        return;
      }

      const result = await readApiResponse<CourseCategoryResponse>(response);

      if (!response.ok) {
        const message =
          typeof result === 'object' && result !== null && 'message' in result
            ? String(result.message)
            : `Gagal mengambil kategori (Status ${response.status})`;

        throw new Error(message);
      }

      const nextCategories =
        typeof result === 'object' && result !== null
          ? normalizeCategories(result.tableData)
          : [];

      setCategories(nextCategories);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengambil kategori kelas.';
      setCategories([]);
      onErrorRef.current?.(message);
    } finally {
      setIsCategoryLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isCategoryLoading,
    refetchCategories: fetchCategories,
  };
}