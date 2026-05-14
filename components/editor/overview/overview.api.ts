import type {
  CourseRoadmapApiItem,
  CourseRoadmapPayload,
  CourseUpdatePayload,
} from './overview.types';

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_DEV_URL ?? '';

export const API_BASE_URL = RAW_API_BASE_URL.endsWith('/')
  ? RAW_API_BASE_URL.slice(0, -1)
  : RAW_API_BASE_URL;

export function buildAuthHeaders(apiToken?: string): Record<string, string> {
  if (!apiToken) return {};
  return { Authorization: `Bearer ${apiToken}` };
}

export async function requestJson<T>(
  url: string,
  options?: RequestInit & { allowNonJsonFallback?: boolean },
): Promise<T> {
  const { allowNonJsonFallback, ...fetchOptions } = options ?? {};

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(fetchOptions.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    if (allowNonJsonFallback) {
      return {
        listData: [],
      } as T;
    }

    throw new Error(`Endpoint tidak mengembalikan JSON. Cek URL API: ${url}`);
  }

  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.data?.message ||
      payload?.error ||
      "Terjadi kesalahan pada server.";

    throw new Error(message);
  }

  return payload as T;
}

export async function updateCourseDescription(params: {
  courseId: number | string;
  payload: CourseUpdatePayload;
  apiToken?: string;
}) {
  return requestJson<{ data: { success: boolean; course_id: string; message: string } }>(
    `${API_BASE_URL}/update/course/${params.courseId}`,
    {
      method: 'PUT',
      headers: buildAuthHeaders(params.apiToken),
      body: JSON.stringify(params.payload),
    },
  );
}

export async function getCourseRoadmaps(params: {
  courseId: number | string;
  apiToken?: string;
}) {
  return requestJson<{ listData: CourseRoadmapApiItem[] }>(
    `${API_BASE_URL}/list/course_roadmap/${params.courseId}`,
    {
      method: "GET",
      headers: buildAuthHeaders(params.apiToken),
      allowNonJsonFallback: true,
    },
  );
}

export async function addCourseRoadmap(params: {
  payload: CourseRoadmapPayload;
  apiToken?: string;
}) {
  return requestJson<{ data: { success: boolean; id: number; message: string } }>(
    `${API_BASE_URL}/add/course_roadmap`,
    {
      method: 'POST',
      headers: buildAuthHeaders(params.apiToken),
      body: JSON.stringify(params.payload),
    },
  );
}

export async function updateCourseRoadmap(params: {
  roadmapId: number;
  payload: CourseRoadmapPayload;
  apiToken?: string;
}) {
  return requestJson<{ data: { success: boolean; roadmap_id: string; message: string } }>(
    `${API_BASE_URL}/update/course_roadmap/${params.roadmapId}`,
    {
      method: 'PUT',
      headers: buildAuthHeaders(params.apiToken),
      body: JSON.stringify(params.payload),
    },
  );
}

export async function deleteCourseRoadmap(params: {
  roadmapId: number;
  apiToken?: string;
}) {
  return requestJson<{ data: { success: boolean; id: string; message: string } }>(
    `${API_BASE_URL}/delete/course_roadmap/${params.roadmapId}`,
    {
      method: 'PUT',
      headers: buildAuthHeaders(params.apiToken),
    },
  );
}