import * as React from 'react';

export interface Integration<Source> {
  id: string;
  name: string;
  fetchPullRequests(source: Source): Promise<PullRequest[]>;
  sourceSetupComponent: React.JSXElementConstructor<{}>;
  extraRoutes?: Record<string, () => void>;
};

export type PullRequest = {
  name: string;
  url: string;
  status: PullRequestStatus;
  labels: Label[];
  createdAt: Date;
};

export type Label = {
  title: string;
  color?: string;
};

// PRs will be sorted according to the order of the defined enum values
export enum PullRequestStatus {
  NotChecked,
  ReReviewNeeded,
  New,
  WaitingForResponse,
  Approved,
  Checked,
  Mine,
}

export type Repository<Source> = {
  name: string;
  integrationId: string;
  source: Source;
  data?: PullRequest[],
}
