declare module 'learning' {
  export interface BaseCourseSection {
    id: string;
    course_id: string;
    title: string;
    order_index: number;
  }

  export interface SectionDetailResponse extends BaseCourseSection {
    content?: string;
    video_links?: Array<{
      link: string;
      title: string;
      topic: string;
      duration: string;
    }>;
    is_completed?: boolean;
    completed_at?: string;
    examples?: string[];
    exercises?: string[];
    key_points?: string[];
    sub_topics?: Array<{
      subtitle: string;
      subexplanation: string;
    }>;
  }
}