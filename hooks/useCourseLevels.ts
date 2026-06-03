'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { BASE_URL, buildJsonHeaders, readApiResponse } from '@/utils/api';
import type { CourseLevel } from './useCourseEditor'; // ✨ Import Tipe Data yang benar

type CourseLevelResponse = {
  tableData?: CourseLevel[];
  message?: string;
};

type UseCourseLevelsParams = {
  ownerId?: string | number;
  onUnauthorized?: () => void;
  onError?: (message: string) => void;
};

export function useCourseLevels({ ownerId, onUnauthorized, onError }: UseCourseLevelsParams) {
  // ✨ FIX 1: Gunakan tipe CourseLevel[], bukan string[]
  const [levels, setLevels] = useState<CourseLevel[]>([]); 
  const [isLevelLoading, setIsLevelLoading] = useState(false);

  const onUnauthorizedRef = useRef(onUnauthorized);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetchLevels = useCallback(async () => {
    const cleanOwnerId = String(ownerId || '').trim();

    if (!BASE_URL || !cleanOwnerId) {
      setLevels([]); // Kosongkan jika ownerId belum siap
      return;
    }

    try {
      setIsLevelLoading(true);

      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
      
      // ✨ FIX 2: Tembak ke endpoint Master Level yang benar!
      const response = await fetch(`${BASE_URL}/table/course_level/${cleanOwnerId}/1`, {
        method: 'GET',
        headers: buildJsonHeaders(token),
      });

      if (response.status === 401 || response.status === 403) {
        onUnauthorizedRef.current?.();
        return;
      }

      const result = await readApiResponse<CourseLevelResponse>(response);

      if (!response.ok) {
        const message =
          typeof result === 'object' && result !== null && 'message' in result
            ? String(result.message)
            : `Gagal mengambil master level (Status ${response.status})`;

        throw new Error(message);
      }

      // ✨ FIX: Yakinkan TypeScript bahwa result adalah objek (bukan string)
      if (typeof result === 'object' && result !== null && 'tableData' in result && Array.isArray(result.tableData)) {
        setLevels(result.tableData);
      } else {
        setLevels([]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengambil master level.';
      setLevels([]);
      onErrorRef.current?.(message);
    } finally {
      setIsLevelLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  return {
    levels,
    isLevelLoading,
    refetchLevels: fetchLevels,
  };
}