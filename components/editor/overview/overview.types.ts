export type ActiveOverviewSubTab = 'description' | 'roadmap' | 'profile';

export type CourseRoadmapApiItem = {
  roadmap_id: number;
  course_id: number;
  step_order: number;
  title: string;
  deskripsi: string;
  items: string[];
};

export type RoadmapStep = CourseRoadmapApiItem & {
  isSaving?: boolean;
};

export type OverviewLandingData = {
  deskripsi: string;
  tech_stack: string[];
  target_audience: string[];
  instructor: string;
  role: string;
  bio: string;
};

export type OverviewInitialData = Partial<OverviewLandingData>;

export type OverviewTabProps = {
  courseSlug?: string;
  courseId?: number | string;
  initialData?: OverviewInitialData;
  apiToken?: string;
};

export type CourseUpdatePayload = {
  deskripsi: string;
  tech_stack: string[];
  target_audience: string[];
};

export type CourseRoadmapPayload = {
  course_id: number;
  step_order: number;
  title: string;
  deskripsi: string;
  items: string[];
};