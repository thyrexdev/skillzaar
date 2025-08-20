export interface CreatePortfolioProjectInput {
  title: string;
  description?: string;
  imageUrls: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface UpdatePortfolioProjectInput {
  title?: string;
  description?: string;
  imageUrls?: string[];
  githubUrl?: string;
  liveUrl?: string;
}
