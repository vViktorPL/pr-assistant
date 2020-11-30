import { useCallback, useEffect, useState } from 'react'

import { PlayCircleTwoTone, PauseCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';

export type StopwatchProps = {
  value: StopwatchState;
  onChange: (stopwatchState: StopwatchState) => void;
};

export type StopwatchState
  = StopwatchRunning
  | StopwatchPaused;

type StopwatchRunning = {
  status: "running";
  accumulatedTime: number;
  startTime: number;
};

type StopwatchPaused = {
  status: "paused";
  accumulatedTime: number;
}

type FormatTimeIntervalOptions = {
  roundToMinutes?: boolean;
};

const formatTimeInterval = (ms: number, { roundToMinutes = false }: FormatTimeIntervalOptions = {}): string => {
  const hours = Math.floor(ms / 3600_000);
  const minutes = Math[roundToMinutes ? "ceil" : "floor"]((ms - hours * 3600_000) / 60_000);
  const seconds = roundToMinutes ? 0 : Math.floor((ms - (hours * 3600_000 + minutes * 60_000)) / 1000);

  return [[hours, "h"], [minutes, "m"], [seconds, "s"]].flatMap(
    ([value, unit]) => value > 0 ? [`${value}${unit}`] : []
  ).join(" ");
};

export const Stopwatch = ({ value, onChange }: StopwatchProps) => {

  const [intervalId, setIntervalId] = useState<number|undefined>(undefined);
  const [, setReRender] = useState<{}|undefined>(undefined);

  useEffect(
    () => {
      if (intervalId === undefined && value.status === "running") {
        setIntervalId(window.setInterval(
          () => {
            setReRender({});
          },
          500
        ));
      }

      if (intervalId !== undefined && value.status !== "running" && intervalId !== undefined) {
        clearInterval(intervalId);
        setIntervalId(undefined);
      }

      return () => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      };
    },
    [intervalId, value]
  );

  const onStart = useCallback(
    () => {
      if (value.status === "running") {
        return;
      }

      onChange({
        status: "running",
        startTime: Date.now(),
        accumulatedTime: value.accumulatedTime,
      });
    },
    [onChange, value]
  );

  const onPause = useCallback(
    () => {
      if (value.status === "paused") {
        return;
      }

      onChange({
        status: "paused",
        accumulatedTime: value.accumulatedTime + (Date.now() - value.startTime),
      });
    },
    [onChange, value]
  );

  const onReset = useCallback(
    () => {
      return onChange({
        status: "paused",
        accumulatedTime: 0,
      });
    },
    [onChange]
  );

  switch (value.status) {
    case "running":
      return (
        <>
          {formatTimeInterval(value.accumulatedTime + (Date.now() - value.startTime))}
          <br/>
          <PauseCircleTwoTone onClick={onPause} />
        </>
      );

    case "paused":
      return (
        <>
          {formatTimeInterval(value.accumulatedTime, { roundToMinutes: true })}
          {value.accumulatedTime > 0 && <br/>}
          <PlayCircleTwoTone onClick={onStart} />
          {value.accumulatedTime > 0 && <CloseCircleTwoTone onClick={onReset} />}
        </>
      );
  }
}
