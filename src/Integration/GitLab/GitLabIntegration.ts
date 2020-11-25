import { Integration, PullRequest, PullRequestStatus } from '../Integration'
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GITLAB_MR_DATA_QUERY, GitLabQueryResponseData } from './GitLabQuery'
import { GitLabSourceSetup } from './GitLabSourceSetup'

const GITLAB_APPLICATION_ID = '3d1983d0d92a47f5f2791e63aaef1536445f7a91b7f4b0c84129d4beb26d493a';
const GITLAB_TOKEN_RETRIEVE_ROUTE_PATH = '/gitlab/token'

export type GitLabSource = {
  repositoryPath: string;
  filterLabels: string[];
}

export class GitLabIntegration implements Integration<GitLabSource> {
  public id = 'gitlab';
  public name = 'GitLab cloud';
  public extraRoutes: Record<string, () => void>;
  public sourceSetupComponent = GitLabSourceSetup;

  private client: ApolloClient<unknown>;
  private accessToken: string|null;

  constructor() {
    this.client = new ApolloClient({
      uri: 'https://gitlab.com/api/graphql',
      cache: new InMemoryCache(),
    });
    this.accessToken = localStorage.getItem("gltoken");
    this.extraRoutes = {
      [GITLAB_TOKEN_RETRIEVE_ROUTE_PATH]: () => {
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
      const authorizationUrl = `https://gitlab.com/oauth/authorize?client_id=${GITLAB_APPLICATION_ID}&redirect_uri=${document.location.origin}${GITLAB_TOKEN_RETRIEVE_ROUTE_PATH}&response_type=token&scope=api`
      document.location.replace(authorizationUrl);
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
      fetchPolicy: 'no-cache',
    });

    if (gitlabMRDataQueryResponse.data) {
      const mergeRequests = gitlabMRDataQueryResponse.data.project.mergeRequests.nodes;
      const myUserId = gitlabMRDataQueryResponse.data.currentUser.id;
      const filterLabelsLowerCase = filterLabels.map(label => label.toLowerCase());

      return mergeRequests
        .filter(mr =>
          filterLabels.length === 0 ||
          mr.labels.nodes.some(
            ({ title }) => filterLabelsLowerCase.includes(title.toLowerCase())
          )
        ).map(
        mergeRequest => {
          let status = PullRequestStatus.NotChecked;
          const approvedByMe = mergeRequest.approvedBy.nodes.some(
            ({id}) => id === myUserId
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
            (count, {resolved}) => count + +resolved,
            0
          );
          const myLastAction = myNotes.reduce(
            (latestUpdatedAt, {updatedAt}) => {
              const updatedAtTimestamp = +new Date(updatedAt);
              return updatedAtTimestamp > latestUpdatedAt ? updatedAtTimestamp : latestUpdatedAt;
            },
            0
          );
          const mergeRequestUpdatedAtTimestamp = +new Date(mergeRequest.updatedAt);
          const mergeRequestCreatedAtTimestamp = +new Date(mergeRequest.createdAt);

          if (mergeRequest.author.id === myUserId) {
            status = PullRequestStatus.Mine;
          } else if (myLastAction > 0 && myLastAction < mergeRequestUpdatedAtTimestamp && myResolvedThreadsCount < myThreadsCount) {
            status = PullRequestStatus.ReReviewNeeded;
          } else if (approvedByMe && myResolvedThreadsCount === myThreadsCount) {
            status = PullRequestStatus.Approved;
          } else if (myThreadsCount > 0 && myResolvedThreadsCount < myThreadsCount && !approvedByMe) {
            status = PullRequestStatus.WaitingForResponse;
          } else if (approvedByMe && myThreadsCount > myResolvedThreadsCount) {
            status = PullRequestStatus.Checked;
          } else if (Date.now() - mergeRequestCreatedAtTimestamp  < 10 * 60 * 1000) {
            status = PullRequestStatus.New;
          }

          return {
            name: mergeRequest.title,
            url: mergeRequest.webUrl,
            labels: mergeRequest.labels.nodes.map(
              ({ title, color }) => ({ title, color })
            ),
            status,
            createdAt: new Date(mergeRequest.createdAt),
          };
        }
      );
    }

    throw new Error("Unknown error");

  }

}


