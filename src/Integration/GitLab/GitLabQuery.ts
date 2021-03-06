import { gql } from '@apollo/client';

export const GITLAB_MR_DATA_QUERY = gql`
  query gitlabMRData($repositoryPath: ID!) {
    currentUser { id }
    project (fullPath: $repositoryPath) {
      mergeRequests (state: opened) {
        nodes {
          title
          approved
          webUrl
          approvedBy { nodes { id } }
          author { id }
          createdAt
          updatedAt
          labels { nodes { title, color } }
          discussions { nodes {
            resolved
            resolvable
            notes { nodes {
              system
              systemNoteIconName
              updatedAt
              author { id }
            }}
          }}
        }
      }
    }
  }
`;

export type GitLabQueryResponseData = {
  currentUser: {
    id: string;
  };
  project: {
    mergeRequests: {
      nodes: {
        title: string;
        approved: boolean;
        webUrl: string;
        approvedBy: { nodes: { id: string }[] };
        author: { id: string };
        createdAt: string;
        updatedAt: string;
        labels: {
          nodes: {
            title: string;
            color: string;
          }[],
        },
        discussions: {
          nodes: {
            resolvable: boolean;
            resolved: boolean;
            notes: {
              nodes: {
                system: boolean;
                systemNoteIconName: string;
                updatedAt: string;
                author: { id: string };
              }[]
            },
          }[];
        };
      }[];
    };
  }

}
