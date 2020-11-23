import { PullRequest, PullRequestStatus } from './Integration/Integration'
import { Table } from 'antd';

export type PullRequestTableProps = {
  loading: boolean;
  pullRequests: PullRequest[],
};

const columns = [
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: PullRequestStatus) => {
      switch (status) {
        case PullRequestStatus.New:
          return "🆕";
        case PullRequestStatus.ReReviewNeeded:
          return "👀";
        case PullRequestStatus.Checked:
          return "✅";
        case PullRequestStatus.WaitingForResponse:
          return "⏳";
        case PullRequestStatus.Approved:
          return "👍";
      }

      return "";
    }
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record: PullRequest) => <a href={record.url} target="_blank">{text}</a>,
  },
  {
    title: 'Created at',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: Date) => date.toLocaleString("en"),
  }
];

const rowClassName = ({ status }: PullRequest) => {

  if ([
    PullRequestStatus.Approved,
    PullRequestStatus.WaitingForResponse,
    PullRequestStatus.Checked,
  ].includes(status)) {
    return "grayed-out";
  }

  return "";
};

export const PullRequestTable = ({loading, pullRequests}: PullRequestTableProps) => {
  return (
    <Table loading={loading} columns={columns} dataSource={pullRequests} rowClassName={rowClassName} />
  );
}
