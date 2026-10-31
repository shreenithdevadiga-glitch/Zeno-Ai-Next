export type AIMode = 
  | 'chat' 
  | 'research' 
  | 'deep_research' 
  | 'code' 
  | 'create' 
  | 'image' 
  | 'voice' 
  | 'study' 
  | 'analyze' 
  | 'write';

export type ModelCategory = 'auto' | 'fast' | 'smart' | 'reasoning' | 'coding' | 'vision' | 'creative' | 'free';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: ModelCategory;
  description: string;
  speed: string;
  contextWindow: string;
  capabilities: string[];
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  custom_instructions: string;
  temperature: number;
  default_model: string;
  theme: string;
  rgb_preset: string;
  rgb_mode: string;
  rgb_intensity: number;
  rgb_speed: number;
  is_rgb_on: number;
  accent_color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  profile?: UserProfile;
}

export interface Attachment {
  id?: string;
  name: string;
  file_type: string;
  file_path?: string;
  file_size: number;
  preview_url?: string;
}

export interface Citation {
  id?: string;
  title: string;
  url: string;
  snippet?: string;
  score?: number;
}

export interface ToolCall {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
  type?: string;
  data?: any;
}

export interface WeatherData {
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  temperature: number;
  temperatureUnit: string;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windSpeedUnit: string;
  windDirection?: number;
  pressure?: number;
  isDay?: boolean;
  condition?: string;
  conditionLabel?: string;
  icon?: string;
  updatedAt?: string;
  dailyMax?: number;
  dailyMin?: number;
  rainChance?: number;
}

export interface LocationData {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  embedUrl: string;
  googleEmbedUrl?: string;
  osmEmbedUrl?: string;
  googleMapsUrl: string;
  directionsUrl?: string;
  osmUrl: string;
  zoom?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  mode?: AIMode;
  reasoning?: string;
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
  citations?: Citation[];
  weather?: WeatherData;
  location?: LocationData;
  feedback?: { rating?: number; comment?: string };
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  project_id?: string | null;
  title: string;
  model: string;
  mode: AIMode;
  pinned: number;
  favorite: number;
  archived: number;
  share_token?: string;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  system_prompt: string;
  color: string;
  chatCount?: number;
  fileCount?: number;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  project_id?: string | null;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  preview?: string;
  chunkCount?: number;
  created_at: string;
}

export interface ResearchSource {
  id?: string;
  title: string;
  url: string;
  snippet?: string;
  content_snippet?: string;
  credibility_score?: number;
  score?: number;
}

export interface ResearchPlanStep {
  step: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ResearchJob {
  id: string;
  query: string;
  status: 'queued' | 'running' | 'synthesizing' | 'completed' | 'failed';
  depth: number;
  breadth: number;
  plan?: ResearchPlanStep[];
  sources?: ResearchSource[];
  sourcesCount?: number;
  report?: string;
  report_markdown?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  enhanced_prompt?: string;
  image_url: string;
  model: string;
  style: string;
  aspect_ratio: string;
  width: number;
  height: number;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'general' | 'preference' | 'technical' | 'fact' | 'instruction';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export type RGBPreset = 
  | 'aurora' 
  | 'cyber' 
  | 'ocean' 
  | 'nebula' 
  | 'emerald' 
  | 'sunset' 
  | 'monochrome' 
  | 'custom';

export interface RGBThemeConfig {
  preset: RGBPreset;
  mode: 'dynamic' | 'static' | 'off';
  intensity: number; // 0.1 to 1.0
  speed: number; // 0.5 to 3.0
  accentColor: string;
  isRgbOn: boolean;
}
