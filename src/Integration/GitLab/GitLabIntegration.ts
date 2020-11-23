import { Integration, PullRequest, PullRequestStatus } from '../Integration'
import { ApolloClient, gql, InMemoryCache } from '@apollo/client';

export type GitLabSource = {
  repositoryPath: string;
  filterLabels: string[];
}

const GITLAB_MR_DATA_QUERY = gql`
  query gitlabMRData($repositoryPath: ID!) {
    currentUser { id }
    project (fullPath: $repositoryPath) {
      mergeRequests (state: opened) {
        nodes {
          title
          approved
          webUrl
          approvedBy { nodes { id } }
          createdAt
          updatedAt
          discussions { nodes {
            notes { nodes {
              updatedAt
              resolved
              resolvable
              author { id }
            }}
          }}
        }
      }
    }
  }
`;

type GitLabQueryResponseData = {
  currentUser: {
    id: string;
  };
  project: {
    mergeRequests: {
      nodes: {
        title: string;
        approved: boolean;
        webUrl: string;
        approvedBy: { nodes: { id: string}[] };
        createdAt: string;
        updatedAt: string;
        discussions: {
          nodes: {
            notes: {
              nodes: {
                updatedAt: string;
                resolved: boolean;
                resolvable: boolean;
                author: { id: string };
              }[]
            },
          }[];
        };
      }[];
    };
  }

}

export class GitLabIntegration implements Integration<GitLabSource> {
  public id = 'gitlab';
  public extraRoutes: Record<string, () => void>;
  private client: ApolloClient<unknown>;
  private accessToken: string|null;

  constructor() {
    this.client = new ApolloClient({
      uri: 'https://gitlab.com/api/graphql',
      cache: new InMemoryCache(),
    });
    this.accessToken = localStorage.getItem("gltoken");
    this.extraRoutes = {
      '/gitlab/token': () => {
        const accessToken = /^#access_token=([^&]+)/.exec(document.location.hash)?.[1];
        if (accessToken) {
          localStorage.setItem('gltoken', accessToken);
          document.location.replace('/');
        }
      }
    }
  }

  async fetchPullRequests({ repositoryPath, filterLabels }: GitLabSource): Promise<PullRequest[]> {
    if (this.accessToken === null) {
      document.location.replace('https://gitlab.com/oauth/authorize?client_id=3d1983d0d92a47f5f2791e63aaef1536445f7a91b7f4b0c84129d4beb26d493a&redirect_uri=http://localhost:3000/gitlab/token&response_type=token&scope=api');
      return new Promise(() => {});
    }

    const gitlabMRDataQueryResponse = await this.client.query<GitLabQueryResponseData>({
      query: GITLAB_MR_DATA_QUERY,
      variables: { repositoryPath },
      context: {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
        },
      },
    });

    if (gitlabMRDataQueryResponse.data) {
      const mergeRequests = gitlabMRDataQueryResponse.data.project.mergeRequests.nodes;
      const myUserId = gitlabMRDataQueryResponse.data.currentUser.id;

      return mergeRequests.map(
        mergeRequest => {
          let status = PullRequestStatus.NotChecked;
          const approvedByMe = mergeRequest.approvedBy.nodes.some(
            ({ id }) => id === myUserId
          );


          const myNotes = mergeRequest.discussions.nodes.flatMap(
            discussion =>
              discussion.notes.nodes.filter(
                note => note.author.id === myUserId
              )
          );
          const myResolvableNotes = myNotes.filter(
            note => note.resolvable && note.author.id === myUserId
          );
          const myThreadsCount = myResolvableNotes.length;
          const myResolvedThreadsCount = myResolvableNotes.reduce(
            (count, { resolved }) => count + +resolved,
            0
          );
          const myLastAction = myNotes.reduce(
            (latestUpdatedAt, { updatedAt }) => {
              const updatedAtTimestamp = +new Date(updatedAt);
              return updatedAtTimestamp > latestUpdatedAt ? updatedAtTimestamp : latestUpdatedAt;
            },
            0
          );
          const mergeRequestUpdatedAtTimestamp = +new Date(mergeRequest.updatedAt);

          if (myLastAction > 0 && myLastAction < mergeRequestUpdatedAtTimestamp && myResolvedThreadsCount < myThreadsCount) {
            status = PullRequestStatus.ReReviewNeeded;
          } else if (approvedByMe && myResolvedThreadsCount === myThreadsCount) {
            status = PullRequestStatus.Approved;
          } else if (myThreadsCount > 0 && myResolvedThreadsCount < myThreadsCount && !approvedByMe) {
            status = PullRequestStatus.WaitingForResponse;
          } else if (approvedByMe && myThreadsCount > myResolvedThreadsCount) {
            status = PullRequestStatus.Checked;
          } else if (Date.now() - mergeRequestUpdatedAtTimestamp  < 10 * 60 * 1000) {
            status = PullRequestStatus.New;
          }

          return {
            name: mergeRequest.title,
            url: mergeRequest.webUrl,
            status,
            createdAt: new Date(mergeRequest.createdAt),
          };
        }
      );
    }

    throw new Error("Unknown error");

  }



}


