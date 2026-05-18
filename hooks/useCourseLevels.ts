'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { BASE_URL, buildJsonHeaders, readApiResponse } from '@/utils/api';

const DEFAULT_COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

type CourseLevelRow = {
  level?: string;
};

type CourseLevelResponse = {
  tableData?: CourseLevelRow[];
  message?: string;
};

type UseCourseLevelsParams = {
  ownerId?: string | number;
  onUnauthorized?: () => void;
  onError?: (message: string) => void;
};

function uniqueLevels(levels: string[]) {
  return Array.from(
    new Set(
      levels
        .map((level) => level.trim())
        .filter(Boolean),
    ),
  );
}

export function useCourseLevels({ ownerId, onUnauthorized, onError }: UseCourseLevelsParams) {
  const [levels, setLevels] = useState<string[]>([...DEFAULT_COURSE_LEVELS]);
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
      setLevels([...DEFAULT_COURSE_LEVELS]);
      return;
    }

    try {
      setIsLevelLoading(true);

      const token = Cookies.get('api_token') || process.env.NEXT_PUBLIC_API_TOKEN || '';
      const response = await fetch(`${BASE_URL}/table/course/${cleanOwnerId}/1`, {
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
            : `Gagal mengambil level kelas (Status ${response.status})`;

        throw new Error(message);
      }

      const apiLevels =
        typeof result === 'object' && result !== null && Array.isArray(result.tableData)
          ? result.tableData.map((course: CourseLevelRow) => course.level || '')
          : [];

      setLevels(uniqueLevels([...DEFAULT_COURSE_LEVELS, ...apiLevels]));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengambil level kelas.';
      setLevels([...DEFAULT_COURSE_LEVELS]);
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