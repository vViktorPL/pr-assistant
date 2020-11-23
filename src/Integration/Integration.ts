import * as React from 'react';

export interface Integration<Source> {
  id: string;
  fetchPullRequests(source: Source): Promise<PullRequest[]>;
  // sourceSetupComponent: React.JSXElementConstructor<{ onSave: (source: Source) => void }>;
  extraRoutes?: Record<string, () => void>;
};

export type PullRequest = {
  name: string;
  url: string;
  status: PullRequestStatus;
  createdAt: Date;
};

export enum PullRequestStatus {
  NotChecked,
  ReReviewNeeded,
  New,
  WaitingForResponse,
  Approved,
  Checked,
}
