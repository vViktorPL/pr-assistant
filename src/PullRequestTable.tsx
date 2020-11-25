import { PullRequest, PullRequestStatus } from './Integration/Integration'
import { Table, Tag, Tooltip } from 'antd';

export type PullRequestTableProps = {
  loading: boolean;
  pullRequests: PullRequest[],
};

const statusToIcon: Partial<Record<PullRequestStatus, { icon: string, description: string }>> = {
  [PullRequestStatus.New]: { icon: '🆕', description: 'This PR has been created less than 10 minutes ago.' },
  [PullRequestStatus.ReReviewNeeded]: { icon: '👀', description: 'Some new changes has been pushed since your last comments in this PR. How about taking a look again?'},
  [PullRequestStatus.Checked]: { icon: '✔️', description: 'You have left some feedback and pre-approved this PR.' },
  [PullRequestStatus.WaitingForResponse]: { icon: '⏳', description: 'PR author needs to address your comments.' },
  [PullRequestStatus.Approved]: { icon: '👍', description: 'You have approved this PR.' },
  [PullRequestStatus.Mine]: { icon: '😜', description: 'This is your own PR ;)' },
}

const columns = [
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: PullRequestStatus) => {
      if (status in statusToIcon) {
        return (
          <Tooltip placement="left" title={statusToIcon[status]!.description}><span style={{ cursor: 'help' }}>{statusToIcon[status]!.icon}</span></Tooltip>
        );
      }

      return "";
    }
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record: PullRequest) => (
      <>
        <a href={record.url} target="_blank">{text}</a>
        {" "}
        {record.labels.map(({ title, color }) => <Tag color={color}>{title}</Tag>)}
      </>
    ),
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
    PullRequestStatus.Mine,
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
