import { PullRequest, PullRequestStatus } from '../Integration/Integration'
import { Table, Tag, Tooltip } from 'antd';
import { useMemo, useState } from 'react'
import {
  Stopwatch,
  StopwatchProps,
  StopwatchState
} from './Stopwatch/Stopwatch'
import { TableProps } from 'antd/es/table'

export type PullRequestTableProps = {
  loading: boolean;
  pullRequests: PullRequest[],
};

type PullRequestWithLocalData = PullRequest & {
  stopwatchState: StopwatchState;
};

const statusToIcon: Partial<Record<PullRequestStatus, { icon: string, description: string }>> = {
  [PullRequestStatus.New]: { icon: '🆕', description: 'This PR has been created less than 10 minutes ago.' },
  [PullRequestStatus.ReReviewNeeded]: { icon: '👀', description: 'Some new changes has been pushed since your last comments in this PR. How about taking a look again?'},
  [PullRequestStatus.Checked]: { icon: '✔️', description: 'You have left some feedback and pre-approved this PR.' },
  [PullRequestStatus.WaitingForResponse]: { icon: '⏳', description: 'PR author needs to address your comments.' },
  [PullRequestStatus.Approved]: { icon: '👍', description: 'You have approved this PR.' },
  [PullRequestStatus.Mine]: { icon: '😜', description: 'This is your own PR ;)' },
}

type ColumnsDeps = {
  onStopwatchChange: (pullRequestUrl: string) => StopwatchProps["onChange"];
}

const buildColumns = ({ onStopwatchChange }: ColumnsDeps): TableProps<PullRequestWithLocalData>["columns"] => [
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
        <a href={record.url} target="_blank" rel="noreferrer">{text}</a>
        {" "}
        {record.labels.map(({ title, color }, index) => <Tag color={color} key={index}>{title}</Tag>)}
      </>
    ),
  },
  {
    title: 'Created at',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: Date) => date.toLocaleString("en"),
  },
  {
    title: 'Stopwatch',
    dataIndex: 'stopwatchState',
    width: 150,
    render: (stopwatchState: StopwatchState, record: PullRequest) => (
      <Stopwatch value={stopwatchState} onChange={onStopwatchChange(record.url)} />
    ),
  },
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

type StopwatchesData = Record<PullRequest["url"], StopwatchState>;

const stopwatchesInitData: StopwatchesData = JSON.parse(localStorage.getItem("stopwatches") || "{}");
const stopwatchInit: StopwatchState = { status: "paused", accumulatedTime: 0 };

export const PullRequestTable = ({loading, pullRequests}: PullRequestTableProps) => {
  const [stopwatchesData, setStopwatchesData] = useState(stopwatchesInitData);

  const pullRequestsWithLocalData: PullRequestWithLocalData[] = useMemo(
    () => pullRequests.map(
      pullRequest => ({
        ...pullRequest,
        stopwatchState: stopwatchesData[pullRequest.url] || stopwatchInit,
      })
    ),
    [stopwatchesData, pullRequests]
  );

  const columns = useMemo(
    () => buildColumns({
      onStopwatchChange(pullRequestUrl: PullRequest["url"]) {
        return (stopwatchState: StopwatchState) => {
          setStopwatchesData(prevState => {
            const newState = {
              ...prevState,
              [pullRequestUrl]: stopwatchState,
            };

            if (stopwatchState.status === "paused" && stopwatchState.accumulatedTime === 0) {
              delete newState[pullRequestUrl];
            }

            localStorage.setItem("stopwatches", JSON.stringify(newState));

            return newState;
          });
        };
      },
    }),
    []
  );

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={pullRequestsWithLocalData}
      rowClassName={rowClassName}
      rowKey="url"
    />
  );
}
