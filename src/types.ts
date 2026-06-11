export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalAnalyses: number;
}

export interface SuspiciousClaim {
  claim: string;
  analysis: string;
  rating: 'Verified' | 'Needs Verification' | 'Suspicious';
}

export interface Analysis {
  id: string;
  userId: string;
  content: string;
  headline?: string;
  url?: string;
  analyzedAt: string;
  isFavorite?: boolean;
  
  // AI Metrics
  authenticityScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  classification: 'Real' | 'Fake' | 'Misleading' | 'Clickbait' | 'Partially True';
  sourceCredibilityScore: number; // 0 - 100
  politicalBias: {
    bias: 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right';
    explanation: string;
  };
  emotionalManipulationScore: number; // 0 - 100
  riskLevel: 'Low' | 'Medium' | 'High';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  
  // lists of factors
  suspiciousClaims: SuspiciousClaim[];
  missingEvidence: string[];
  clickbaitIndicators: string[];
  
  // explanations
  explanation: string;
  recommendations: string[];
  
  // Why conclusion reached details
  explanationDetails: {
    keywords: string[];
    manipulationTactics: string[];
    unsupportedPhrases: string[];
  };
}

export interface QuizProgress {
  userId: string;
  completedModules: string[];
  quizScores: { [key: string]: number }; // moduleId -> score
  certified: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAnalyses: number;
  accuracyRate: number;
  activeUsers24h: number;
  fakeRatio: number; // Percentage of analyses classified as suspicious or fake
  categoryDistribution: { name: string; value: number }[];
  weeklyTrends: { name: string; real: number; fake: number }[];
  monthlyTrends: { name: string; count: number }[];
}
