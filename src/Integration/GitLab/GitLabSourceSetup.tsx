import { Input, Form, Select } from 'antd';
import { ChangeEvent, useCallback } from 'react'

export const GitLabSourceSetup = () => {
  return (
    <>
      <Form.Item
        label="Repository path / url"
        name="repositoryPath"
        rules={[{ required: true, message: 'Please input repository path.' }]}
      >
        <GitLabRepositoryPathInput />
      </Form.Item>
      <Form.Item
        label="Filter labels"
        name="filterLabels"
      >
        <Select mode="tags" style={{ width: '100%' }} placeholder="Enter PR labels..." />
      </Form.Item>
    </>
  );
}

type GitLabRepositoryPathInputProps = {
  onChange?: (value: string) => void;
  defaultValue?: string;
}

const GitLabRepositoryPathInput = ({ onChange, defaultValue }: GitLabRepositoryPathInputProps) => {
  const onChangeInternal = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!onChange) {
        return
      }

      const value = event.target.value;
      const urlMatch = /https:\/\/gitlab\.com\/(([^/]+)\/([^/]+))\/?[^/]*/.exec(value);

      if (urlMatch && urlMatch[1]) {
        onChange(urlMatch[1]);
        return;
      }

      onChange(value)
    },
    [onChange]
  )

  return <Input onChange={onChangeInternal} defaultValue={defaultValue} />
}
