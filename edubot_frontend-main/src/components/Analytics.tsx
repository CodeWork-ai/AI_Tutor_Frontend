import { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Progress } from 'antd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import {
  MessageSquare,
  BookOpen,
  FileText,
  CheckCircle,
  Loader2,
  TrendingUp,
  Award,
  Activity,
  BarChart3,
  Rocket,
  PieChart,
  Target,
  Zap,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { apiService } from '../services/api';
 
export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}
 
export interface Summary {
  total_chats: number;
  courses_created: number;
  courses_enrolled: number;
  sections_completed: number;
  total_submissions: number;
  graded_submissions: number;
  pending_submissions: number;
  learning_streak_days: number;
  total_time_spent_minutes: number;
}
 
export interface PerformanceMetrics {
  average_grade: number;
  completion_rate: number;
  submission_completion_rate: number;
}
 
export interface CourseCreated {
  id: string;
  title: string;
  description: string;
  created_at: string;
  enrollment_count: number;
}
 
export interface CourseEnrolled {
  id: string;
  title: string;
  description: string | null;
  enrolled_at: string;
  progress_percentage: number;
  total_sections: number;
  completed_sections: number;
  submissions_count: number;
  average_grade: number | null;
}
 
export interface ActivityItem {
  activity_type: string;
  description: string;
  timestamp: string;
  related_id: string;
  section_title?: string;
  course_title?: string;
  grade?: string;
}
 
export interface Achievement {
  name: string;
  description: string;
}
 
export interface AnalyticsPayload {
  user_profile: UserProfile;
  summary: Summary;
  performance_metrics: PerformanceMetrics;
  courses_created: CourseCreated[];
  courses_enrolled: CourseEnrolled[];
  recent_activities: ActivityItem[];
  achievements: Achievement[];
}
 
interface AnalyticsProps {
  initialData?: AnalyticsPayload | null;
}
 
const CHART_COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  pink: '#ec4899',
  teal: '#14b8a6',
};
 
const PIE_COLORS = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.red,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.teal,
];
 
const fmtInt = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));
const fmtPct = (n: number, decimals = 1) => `${(n || 0).toFixed(decimals)}%`;
const fmtDateTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return 'Invalid date';
  }
};
 
function useTweenedNumber(target: number, durationMs = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let rafId: number;
    const start = performance.now();
    const from = value;
    const delta = target - from;
    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / durationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      setValue(from + delta * easedProgress);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);
  return Math.round(value);
}
 
const formatActivityType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
 
export function Analytics({ initialData }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsPayload | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
 
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      return;
    }
 
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserAnalytics();
        if (mounted) {
          setData(response);
        }
      } catch (e) {
        console.error('❌ Analytics load failed:', e);
        if (mounted) setData(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [initialData]);
 
  const summary = data?.summary;
  const performance = data?.performance_metrics;
  const coursesEnrolled = data?.courses_enrolled ?? [];
  const coursesCreated = data?.courses_created ?? [];
  const activities = data?.recent_activities ?? [];
  const achievements = data?.achievements ?? [];
  const userProfile = data?.user_profile;
 
  const twChats = useTweenedNumber(summary?.total_chats ?? 0);
  const twCourses = useTweenedNumber(summary?.courses_enrolled ?? 0);
  const twSections = useTweenedNumber(summary?.sections_completed ?? 0);
  const twSubmissions = useTweenedNumber(summary?.total_submissions ?? 0);
  const twStreak = useTweenedNumber(summary?.learning_streak_days ?? 0);
 
  const courseProgressData = useMemo(() => {
    const data = coursesEnrolled
      .filter(c => c.title !== "General Submissions" && c.progress_percentage >= 0)
      .map(course => ({
        name: course.title.length > 25 ? course.title.substring(0, 22) + '...' : course.title,
        Progress: Number(course.progress_percentage.toFixed(1)),
        completed: course.completed_sections,
        total: course.total_sections,
        fullName: course.title,
      }));
   
    console.log('📈 Course Progress Data:', data);
    return data;
  }, [coursesEnrolled]);
 
  const performanceRadarData = useMemo(() => {
    const data = [
      {
        metric: 'Grade',
        Score: Number((performance?.average_grade ?? 0).toFixed(1)),
      },
      {
        metric: 'Completion',
        Score: Number((performance?.completion_rate ?? 0).toFixed(1)),
      },
      {
        metric: 'Submissions',
        Score: Number((performance?.submission_completion_rate ?? 0).toFixed(1)),
      },
    ];
   
    console.log('🎯 Performance Radar Data:', data);
    return data;
  }, [performance]);
 
  const activityPieData = useMemo(() => {
    const activityTypeData = activities.reduce((acc, activity) => {
      const type = activity.activity_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
 
    const data = Object.entries(activityTypeData)
      .map(([name, value]) => ({
        name: formatActivityType(name),
        value,
      }))
      .sort((a, b) => b.value - a.value);
   
    console.log('🥧 Activity Pie Data:', data);
    return data;
  }, [activities]);
 
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
 
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="size-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your analytics...</p>
        </div>
      </div>
    );
  }
 
  if (!data || !summary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="text-center">
          <BarChart3 className="size-16 mx-auto mb-4 text-slate-300" />
          <h3 className="font-semibold text-xl text-slate-700 mb-2">No Analytics Data Available</h3>
          <p className="text-sm text-slate-500">Start learning to see your analytics.</p>
        </div>
      </motion.div>
    );
  }
 
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex-shrink-0"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 ">
            <motion.div
              className="size-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            >
              <TrendingUp className="text-green-600 size-6 " />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Learning Analytics
              </h1>
              <p className="text-slate-600 mt-1">Welcome back, <span className="font-semibold">{userProfile?.name}</span></p>
            </div>
          </div>
          {achievements.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {achievements.slice(0, 3).map((achievement, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-3 py-2 shadow-sm"
                >
                  <Award className="size-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">{achievement.name}</p>
                    <p className="text-xs text-amber-700">{achievement.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.header>
 
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6"
          >
            {/* Left Column - Stats Cards */}
            <div className="lg:col-span-1 xl:col-span-1 space-y-4">
              <StatCard title="Total Chats" value={twChats} icon={MessageSquare} color="blue" />
              <StatCard title="Courses Enrolled" value={twCourses} icon={BookOpen} color="green" />
              <StatCard title="Sections Done" value={twSections} icon={CheckCircle} color="purple" />
              <StatCard title="Submissions" value={twSubmissions} icon={FileText} color="orange" />
              <StatCard title="Learning Streak" value={twStreak} icon={Calendar} color="pink" suffix=" days" />
          </div>
 
            {/* Middle Column - Charts */}
            <div className="lg:col-span-2 xl:col-span-2 space-y-6">
              {/* Performance Overview Cards */}
              <GlassCard className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PerformanceCard
                  title="Average Grade"
                  value={(performance?.average_grade ?? 0).toFixed(1)}
                  percent={performance?.average_grade ?? 0}
                  icon={Target}
                  color={CHART_COLORS.blue}
                />
                <PerformanceCard
                  title="Completion Rate"
                  value={fmtPct(performance?.completion_rate ?? 0)}
                  percent={performance?.completion_rate ?? 0}
                  icon={Zap}
                  color={CHART_COLORS.green}
                />
                <PerformanceCard
                  title="Submission Rate"
                  value={fmtPct(performance?.submission_completion_rate ?? 0)}
                  percent={performance?.submission_completion_rate ?? 0}
                  icon={CheckCircle}
                  color={CHART_COLORS.purple}
                />
              </GlassCard>
 
              {/* Course Progress Bar Chart */}
              <GlassCard>
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="size-5 text-blue-500" />
                    Course Progress
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Your progress across {courseProgressData.length} enrolled course(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {courseProgressData.length > 0 ? (
                    <div style={{ width: '100%', height: '320px' }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={courseProgressData}
                          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '12px'
                            }}
                          />
                          <Bar
                            dataKey="Progress"
                            fill={CHART_COLORS.blue}
                            radius={[8, 8, 0, 0]}
                            maxBarSize={80}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-center">
                        <BookOpen className="size-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">No course data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </GlassCard>
 
              {/* Performance Radar Chart */}
              <GlassCard>
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="size-5 text-purple-500" />
                    Performance Overview
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Your overall learning metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div style={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer>
                      <RadarChart data={performanceRadarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                          dataKey="metric"
                          tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <Radar
                          name="Score"
                          dataKey="Score"
                          stroke={CHART_COLORS.purple}
                          fill={CHART_COLORS.purple}
                          fillOpacity={0.6}
                          strokeWidth={2}
                        />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </GlassCard>
            </div>
 
            {/* Right Column */}
            <div className="lg:col-span-3 xl:col-span-1 space-y-6">
              {/* Activity Pie Chart */}
              <GlassCard>
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="size-5 text-green-500" />
                    Activity Types
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Distribution of your {activities.length} activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {activityPieData.length > 0 ? (
                    <div style={{ width: '100%', height: '288px' }}>
                      <ResponsiveContainer>
                        <RechartsPie>
                          <Pie
                            data={activityPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={85}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {activityPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-72 flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="size-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">No activity data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </GlassCard>
 
              {/* Recent Activities */}
              <GlassCard>
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="size-5 text-purple-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {activities.length > 0 ? (
                    <ScrollArea className="h-96">
                      <ul className="space-y-3 pr-4">
                        {activities.slice(0, 15).map((activity, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-start gap-3 group"
                          >
                            <div className="mt-1.5 size-2 bg-slate-300 group-hover:bg-blue-500 rounded-full transition-colors flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 font-medium">{activity.description}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="size-3" />
                                {fmtDateTime(activity.timestamp)}
                              </p>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </GlassCard>
 
              {/* Courses Created */}
              {coursesCreated.filter(c => c.title !== "General Submissions").length > 0 && (
                <GlassCard>
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Rocket className="size-5 text-amber-500" />
                      Courses Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="space-y-2">
                      {coursesCreated
                        .filter(c => c.title !== "General Submissions")
                        .map((course) => (
                          <li
                            key={course.id}
                            className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 hover:border-blue-300 transition-all"
                          >
                            <p className="text-sm font-semibold text-slate-800">{course.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{course.enrollment_count} enrollments</p>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </GlassCard>
              )}
            </div>
          </motion.div>
        </ScrollArea>
      </div>
    </div>
  );
}
 
// Sub-components
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: 'easeOut' 
    } 
  },
};
 
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={cardVariants}
      className={`bg-white/80 backdrop-blur-xl p-6 border border-slate-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow ${className}`}
    >
      {children}
    </motion.div>
  );
}
 
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix = '',
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  suffix?: string;
}) {
  const colors = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600' },
  };
 
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {fmtInt(value)}{suffix}
          </p>
        </div>
        <div className={`p-3 ${colors[color].bg} rounded-xl shadow-md`}>
          <Icon className={`size-6 ${colors[color].icon}`} />
        </div>
      </div>
    </GlassCard>
  );
}
 
function PerformanceCard({
  title,
  value,
  percent,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  percent: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div>
      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2 mb-2">
        <Icon className="size-5" style={{ color }} />
        {title}
      </CardTitle>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className="mt-3">
        <Progress percent={Math.min(percent, 100)} strokeColor={color} size={[0, 8]} showInfo={false} />
      </div>
    </div>
  );
}
