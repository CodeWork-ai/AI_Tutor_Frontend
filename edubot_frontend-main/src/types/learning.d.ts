interface BaseCourseSection {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface SectionDetailResponse extends BaseCourseSection {
  content?: string;
  video_links?: Array<{
    title: string;
    description: string;
    thumbnail: string;
    link: string;
    duration: string;
  }>;
  is_completed?: boolean;
  completed_at?: string;
}
